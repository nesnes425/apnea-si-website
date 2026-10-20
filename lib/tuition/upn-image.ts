import {createHmac, timingSafeEqual} from "node:crypto";
import {deflateSync} from "node:zlib";
import {siteConfig} from "@/lib/config";
import {fingerprint, type TuitionPlan} from "./plan";
import {tuitionQrMatrix} from "./upn-qr";

// Capability URLs contain no payer/contact/bank details. Domain separation keeps
// this signature distinct from operator authentication. Key rotation revokes URLs.
function signature(payload: string) {
  const key = process.env.TUITION_ADMIN_KEY;
  if (!key || key.length < 32) throw new Error("Tuition image signing is unavailable");
  return createHmac("sha256", key).update(`tuition-upn-image-v1\0${payload}`).digest("base64url");
}
export function upnImageUrl(plan: TuitionPlan, sample = false) {
  if (sample) return `${siteConfig.url}/api/tuition/upn-qr/sample`;
  const expires = Math.floor(Date.parse(`${plan.first.serviceTo}T23:59:59Z`) / 1000) + 30 * 86400;
  const payload = `${plan.id}.${fingerprint(plan)}.${expires}`;
  return `${siteConfig.url}/api/tuition/upn-qr/${payload}.${signature(payload)}`;
}
export function verifyUpnImageToken(token: string, now = Date.now()) {
  const match = /^([0-9a-f-]{36})\.([0-9a-f]{64})\.(\d{10})\.([A-Za-z0-9_-]{43})$/.exec(token);
  if (!match || Number(match[3]) * 1000 <= now) return null;
  const payload = token.slice(0, token.lastIndexOf("."));
  const expected = Buffer.from(signature(payload)), actual = Buffer.from(match[4]);
  if (expected.length !== actual.length || !timingSafeEqual(expected, actual)) return null;
  return {id: match[1], fingerprint: match[2]};
}

function chunk(type: string, data: Buffer) {
  const bytes = Buffer.concat([Buffer.from(type), data]);
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ ((crc & 1) ? 0xedb88320 : 0);
  }
  const size = Buffer.alloc(4), checksum = Buffer.alloc(4);
  size.writeUInt32BE(data.length); checksum.writeUInt32BE((crc ^ 0xffffffff) >>> 0);
  return Buffer.concat([size, bytes, checksum]);
}
// Lossless grayscale PNG, six pixels per module and a four-module quiet zone.
// Uses exactly the same ECI/version/ECC matrix as the attached PDF.
export function tuitionQrPng(plan: TuitionPlan, sample = false) {
  const qr = tuitionQrMatrix(plan, sample), scale = 6, width = (qr.size + 8) * scale;
  const pixels = Buffer.alloc((width + 1) * width, 255);
  for (let y = 0; y < width; y++) {
    pixels[y * (width + 1)] = 0; // PNG filter: none.
    for (let x = 0; x < width; x++) {
      if (qr.getModule(Math.floor(x / scale) - 4, Math.floor(y / scale) - 4))
        pixels[y * (width + 1) + x + 1] = 0;
    }
  }
  const header = Buffer.alloc(13);
  header.writeUInt32BE(width, 0); header.writeUInt32BE(width, 4); header[8] = 8;
  return Buffer.concat([Buffer.from([137,80,78,71,13,10,26,10]), chunk("IHDR", header), chunk("IDAT", deflateSync(pixels)), chunk("IEND", Buffer.alloc(0))]);
}

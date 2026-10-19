// prepare is offline. send requires a reviewed artifact, --apply, operator auth
// and a server-side allowlist. Keep one immutable ID per test recipient.
import { randomUUID } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve, dirname } from "node:path";
import { z } from "zod";
import { combinedPreview } from "../lib/tuition/combined-preview";
const schema = z.object({ id: z.uuid(), recipient: z.email().max(320) }).strict();
async function main() {
  const [action, value, flag] = process.argv.slice(2);
  if (action === "prepare") {
    const recipient = z.email().parse(value);
    const input = { id: randomUUID(), recipient };
    const dir = resolve("temp/tuition-email-tests", input.id);
    const message = await combinedPreview();
    await mkdir(dir, { recursive: true, mode: 0o700 });
    await writeFile(resolve(dir, "test.json"), JSON.stringify(input, null, 2), { mode: 0o600, flag: "wx" });
    await writeFile(resolve(dir, "sporocilo.html"), message.html, { mode: 0o600 });
    await writeFile(resolve(dir, "sporocilo.txt"), `Od: info@apnea.si\nZa: ${recipient}\nZadeva: [TEST – NI ZA PLAČILO] ${message.subject}\n\n${message.text}`, { mode: 0o600 });
    await writeFile(resolve(dir, message.attachment.name), Buffer.from(message.attachment.contentBase64, "base64"), { mode: 0o600 });
    console.log(`Prepared only; nothing sent: ${resolve(dir, "test.json")}`);
    return;
  }
  if (!["send", "status"].includes(action) || !value || (action === "send" && flag !== "--apply"))
    throw new Error("Use prepare EMAIL, status TEST_JSON, or send TEST_JSON --apply after approval");
  const input = schema.parse(JSON.parse(await readFile(value, "utf8")));
  if (!process.env.TUITION_API_URL) throw new Error("TUITION_API_URL missing");
  const url = new URL(process.env.TUITION_API_URL);
  if (url.username || url.password || (url.protocol !== "https:" && !(url.protocol === "http:" && ["localhost", "127.0.0.1"].includes(url.hostname)))) throw new Error("Unsafe operator URL");
  const key = process.env.TUITION_ADMIN_KEY;
  if (!key || key.length < 32) throw new Error("Operator credentials missing");
  const endpoint = action === "send" ? "/api/tuition/email-test" : `/api/tuition/email-delivery?id=${input.id}`;
  const response = await fetch(new URL(endpoint, url), {
    method: action === "send" ? "POST" : "GET",
    headers: { authorization: `Bearer ${key}`, "content-type": "application/json" },
    ...(action === "send" ? { body: JSON.stringify(input) } : {}),
    redirect: "error", signal: AbortSignal.timeout(40_000),
  });
  if (!response.ok) throw new Error(`Operator response ${response.status}. Inspect status with the SAME test file before any retry.`);
  await writeFile(resolve(dirname(value), `${action}-result.json`), JSON.stringify(await response.json(), null, 2), { mode: 0o600 });
  console.log(`${action} result saved alongside the test file.`);
}
main().catch(e => { console.error(e instanceof Error ? e.message : "Test failed"); process.exitCode = 1; });

import { timingSafeEqual } from "node:crypto";
export function tuitionAdminAuthorized(request: Request) {
  const secret = process.env.TUITION_ADMIN_KEY;
  if (!secret || secret.length < 32) return false;
  const expected = Buffer.from(`Bearer ${secret}`),
    actual = Buffer.from(request.headers.get("authorization") ?? "");
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

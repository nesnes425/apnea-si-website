import { z } from "zod";
import { siteConfig } from "@/lib/config";
import { combinedPreview } from "@/lib/tuition/combined-preview";
import { sendTrackedTuitionEmail } from "./delivery";

export const emailTestSchema = z.object({ id: z.uuid(), recipient: z.email().max(320) }).strict();
export async function sendInternalTuitionTest(input: z.infer<typeof emailTestSchema>) {
  const p = emailTestSchema.parse(input);
  const allowed = (process.env.TUITION_EMAIL_TEST_RECIPIENTS ?? "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (process.env.TUITION_EMAIL_TEST_ENABLED !== "true" || !allowed.includes(p.recipient.toLowerCase()))
    throw new Error("Internal test recipient not enabled");
  if (process.env.BREVO_FROM_EMAIL?.trim().toLowerCase() !== siteConfig.email || (process.env.BREVO_TUITION_WEBHOOK_SECRET?.length ?? 0) < 32)
    throw new Error("Sender or delivery webhook not configured");
  const message = await combinedPreview();
  return sendTrackedTuitionEmail(p.id, null, {
    to: { email: p.recipient }, subject: `[TEST – NI ZA PLAČILO] ${message.subject}`,
    html: message.html, text: message.text,
    replyTo: { email: siteConfig.email, name: siteConfig.tuitionBank.name },
    attachments: [message.attachment],
  });
}

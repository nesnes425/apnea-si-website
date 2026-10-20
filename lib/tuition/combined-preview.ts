import example from "@/scripts/tuition-plan.example.json";
import { planSchema } from "./plan";
import { combinedInvitation } from "./combined-template";
import { tuitionUpnPdf } from "./upn-pdf";
import {tuitionQrPng} from "./upn-image";

// Shared offline preview/internal test; never creates payment plans or calls providers.
export async function combinedPreview() {
  const plan = planSchema.parse(example);
  plan.participant = "Vzorec Član";
  plan.payer = { name: "Vzorec Član", email: "vzorec@example.invalid", address: "Vzorčna ulica 1", postalCode: "1000", city: "Ljubljana", country: "SI" };
  plan.agreementNoticeVersion = "2026-27-v1";
  const message = combinedInvitation(plan, "[Stripe povezava za dva obroka]", true);
  const pdf = await tuitionUpnPdf(plan, true);
  return { ...message, qrImage: tuitionQrPng(plan, true).toString("base64"), attachment: { name: "UPN-vzorec.pdf", contentBase64: pdf.toString("base64") } };
}

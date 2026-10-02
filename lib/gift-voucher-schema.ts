import { z } from "zod";

export const giftVoucherFormSchema = z.object({
  buyerName: z.string().trim().min(2, "Vnesi svoje ime in priimek.").max(100, "Ime je predolgo."),
  buyerEmail: z.string().trim().toLowerCase().email("Vnesi veljaven e-poštni naslov."),
  recipientName: z.string().trim().min(2, "Vnesi ime obdarjenca.").max(100, "Ime je predolgo."),
  wantsPrint: z.boolean().optional().default(false),
  shippingAddress: z.string().trim().max(300, "Naslov je predolg.").optional().default(""),
  comment: z.string().trim().max(1000, "Komentar je predolg (max 1000 znakov).").optional().default(""),
  acceptTerms: z.boolean().refine((v) => v === true, {
    error: "Za nadaljevanje moraš sprejeti pogoje poslovanja.",
  }),
}).refine((d) => !d.wantsPrint || d.shippingAddress.length >= 5, {
  path: ["shippingAddress"],
  error: "Vnesi naslov za pošiljanje.",
});

export type GiftVoucherFormInput = z.input<typeof giftVoucherFormSchema>;
export type GiftVoucherFormData = z.output<typeof giftVoucherFormSchema>;

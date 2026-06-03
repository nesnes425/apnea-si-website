import { z } from "zod";

export const giftVoucherFormSchema = z.object({
  buyerName: z.string().trim().min(2, "Vnesi svoje ime in priimek.").max(100, "Ime je predolgo."),
  buyerEmail: z.string().trim().toLowerCase().email("Vnesi veljaven e-poštni naslov."),
  recipientName: z.string().trim().min(2, "Vnesi ime obdarjenca.").max(100, "Ime je predolgo."),
  message: z.string().trim().max(500, "Sporočilo je predolgo (max 500 znakov).").optional().default(""),
  acceptTerms: z.boolean().refine((v) => v === true, {
    error: "Za nadaljevanje moraš sprejeti pogoje poslovanja.",
  }),
});

export type GiftVoucherFormInput = z.input<typeof giftVoucherFormSchema>;
export type GiftVoucherFormData = z.output<typeof giftVoucherFormSchema>;

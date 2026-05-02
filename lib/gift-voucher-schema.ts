import { z } from "zod";

export const giftVoucherFormSchema = z.object({
  buyerName: z.string().trim().min(2, "Vnesite svoje ime in priimek.").max(100, "Ime je predolgo."),
  buyerEmail: z.string().trim().toLowerCase().email("Vnesite veljaven e-poštni naslov."),
  recipientName: z.string().trim().min(2, "Vnesite ime obdarjenca.").max(100, "Ime je predolgo."),
  recipientEmail: z.string().trim().toLowerCase().email("Vnesite veljaven e-poštni naslov obdarjenca."),
  message: z.string().trim().max(500, "Sporočilo je predolgo (max 500 znakov).").optional().default(""),
  acceptTerms: z.boolean().refine((v) => v === true, {
    error: "Za nadaljevanje morate sprejeti pogoje poslovanja.",
  }),
});

export type GiftVoucherFormInput = z.input<typeof giftVoucherFormSchema>;
export type GiftVoucherFormData = z.output<typeof giftVoucherFormSchema>;

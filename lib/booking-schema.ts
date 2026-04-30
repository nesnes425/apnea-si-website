import { z } from "zod";

export const bookingFormSchema = z.object({
  fullName: z
    .string()
    .trim()
    .min(2, "Vnesite svoje ime in priimek.")
    .max(100, "Ime je predolgo."),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email("Vnesite veljaven e-poštni naslov."),
  phone: z
    .string()
    .trim()
    .min(6, "Vnesite veljavno telefonsko številko.")
    .max(30, "Telefonska številka je predolga."),
  acceptTerms: z.literal(true, {
    error: "Za nadaljevanje morate sprejeti pogoje poslovanja.",
  }),
  instanceId: z.string().min(1),
});

export type BookingFormInput = z.input<typeof bookingFormSchema>;
export type BookingFormData = z.output<typeof bookingFormSchema>;

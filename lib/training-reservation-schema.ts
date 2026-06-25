import { z } from "zod";

export const trainingReservationSchema = z.object({
  groupId: z.string().min(1),
  fullName: z.string().trim().min(2, "Vnesite svoje ime in priimek.").max(100),
  email: z.string().trim().toLowerCase().email("Vnesite veljaven e-poštni naslov."),
  phone: z.string().trim().min(6, "Vnesite veljavno telefonsko številko.").max(30),
  address: z.string().trim().min(2, "Vnesite naslov.").max(160),
  postalCode: z.string().trim().min(3, "Vnesite poštno številko.").max(12),
  city: z.string().trim().min(2, "Vnesite kraj.").max(80),
  acceptTerms: z.boolean().refine((value) => value, {
    error: "Za nadaljevanje morate sprejeti pogoje poslovanja.",
  }),
});

export type TrainingReservationInput = z.input<typeof trainingReservationSchema>;

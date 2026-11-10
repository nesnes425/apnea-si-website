import { z } from "zod";

export const statikaSignupSchema = z.object({
  groupId: z.string().min(1).max(150),
  requestId: z.uuid(),
  fullName: z.string().trim().min(2, "Vnesite svoje ime in priimek.").max(100).refine((value) => !/[\r\n]/.test(value), "Preverite ime in priimek."),
  email: z.string().trim().toLowerCase().max(254).email("Vnesite veljaven e-poštni naslov."),
  phone: z.string().trim().min(6, "Vnesite veljavno telefonsko številko.").max(30).refine((value) => !/[\r\n]/.test(value), "Preverite telefonsko številko."),
  membershipAlreadyPaid: z.boolean().refine((value) => value, "Potrdite, da ste članarino za to sezono že plačali."),
  acceptTerms: z.boolean().refine((value) => value, "Za nadaljevanje morate sprejeti pogoje poslovanja."),
  website: z.string().max(0).optional(),
}).strict();

export type StatikaSignupInput = z.input<typeof statikaSignupSchema>;

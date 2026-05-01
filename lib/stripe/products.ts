import { readEnv } from "@/lib/env";
import type { CourseType } from "@/lib/config";

const courseTypeToEnvVar: Record<CourseType, string> = {
  zacetni: "STRIPE_PRICE_ZACETNI",
  nadaljevalni: "STRIPE_PRICE_NADALJEVALNI",
  master: "STRIPE_PRICE_MASTER",
};

export function getCoursePriceId(courseType: CourseType): string {
  return readEnv(courseTypeToEnvVar[courseType]);
}

export function getGiftVoucherPriceId(): string {
  return readEnv("STRIPE_PRICE_GIFT_ZACETNI");
}

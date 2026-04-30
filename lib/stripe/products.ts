import { siteConfig, type CourseType } from "@/lib/config";

function readEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing ${name} environment variable`);
  }
  return value;
}

export const stripePriceIds = {
  zacetni: () => readEnv("STRIPE_PRICE_ZACETNI"),
  nadaljevalni: () => readEnv("STRIPE_PRICE_NADALJEVALNI"),
  master: () => readEnv("STRIPE_PRICE_MASTER"),
  giftZacetni: () => readEnv("STRIPE_PRICE_GIFT_ZACETNI"),
};

export function getCoursePriceId(courseType: CourseType): string {
  return stripePriceIds[courseType]();
}

export function getCoursePriceInCents(courseType: CourseType): number {
  return siteConfig.courses[courseType].priceInCents;
}

export function getCourseFullName(courseType: CourseType): string {
  return siteConfig.courses[courseType].fullName;
}

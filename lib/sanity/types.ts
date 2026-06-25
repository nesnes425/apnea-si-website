import type { PortableTextBlock } from "@portabletext/types";

export interface CourseInstance {
  _id: string;
  _type: "courseInstance";
  courseType: "zacetni" | "nadaljevalni" | "master";
  startDate: string;
  endDate: string;
  location: string;
  maxSpots: number;
  isFull: boolean;
  notes?: string;
  brevoListId?: number;
}

export interface BlogPost {
  _id: string;
  _type: "blogPost";
  title: string;
  slug: { current: string };
  body: PortableTextBlock[];
  featuredImage?: {
    asset: {
      _id: string;
      _ref?: string;
      url: string;
    };
    alt?: string;
  };
  publishedAt: string;
  categories?: string[];
  metaDescription?: string;
}

export interface TrainingSettings {
  _id: string;
  _type: "trainingSettings";
  seasonLabel: string;
  applicationsOpen: boolean;
  membershipFee: number;
  holdMinutes: number;
}

export interface TrainingProgram {
  _id: string;
  _type: "trainingProgram";
  name: string;
  slug: { current: string };
  shortDescription: string;
  description?: PortableTextBlock[];
  placementGuidance: string;
  equipment?: PortableTextBlock[];
  image?: SanityImage;
  sortOrder: number;
  active: boolean;
}

export interface TrainingPricing {
  monthlyDisplayPrice: number;
  firstInstallmentAmount: number;
  secondInstallmentAmount: number;
  fullPaymentAmountOverride?: number;
}

export interface TrainingVenue {
  _id: string;
  _type: "trainingVenue";
  name: string;
  city: string;
  slug: { current: string };
  description: string;
  address?: string;
  image?: SanityImage;
  defaultStartDate: string;
  defaultEndDate: string;
  defaultPricing: TrainingPricing;
  sortOrder: number;
  active: boolean;
}

export interface TrainingHold {
  _key: string;
  tokenHash: string;
  expiresAt: string;
  paymentIntentId?: string;
}

export interface TrainingGroup {
  _id: string;
  _rev: string;
  _type: "trainingGroup";
  venue: TrainingVenue;
  program: TrainingProgram;
  weekday: "ponedeljek" | "torek" | "sreda" | "cetrtek" | "petek";
  startTime: string;
  endTime: string;
  capacity: number;
  confirmedSpots: number;
  holds: TrainingHold[];
  startDateOverride?: string;
  endDateOverride?: string;
  pricingOverride?: Partial<TrainingPricing>;
  trainerName?: string;
  notes?: string;
  brevoListId?: number;
  confirmedPaymentIntentIds: string[];
  active: boolean;
  activeHoldCount: number;
  availableSpots: number;
  isFull: boolean;
}

export interface SanityImage {
  asset: {
    _id?: string;
    _ref?: string;
    url?: string;
  };
  alt?: string;
}

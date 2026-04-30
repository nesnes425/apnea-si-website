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
  body: unknown[]; // Portable Text
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

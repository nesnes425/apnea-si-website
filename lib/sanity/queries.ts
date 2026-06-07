import { sanityClient, sanityFreshClient } from "./client";
import type {
  BlogPost,
  CourseInstance,
  TrainingGroup,
  TrainingProgram,
  TrainingSettings,
  TrainingVenue,
} from "./types";

// === Course Instances ===

export async function getUpcomingCourses(
  courseType?: CourseInstance["courseType"]
): Promise<CourseInstance[]> {
  const filter = courseType
    ? `_type == "courseInstance" && courseType == $courseType && startDate >= now()`
    : `_type == "courseInstance" && startDate >= now()`;

  return sanityClient.fetch(
    `*[${filter}] | order(startDate asc)`,
    courseType ? { courseType } : {}
  );
}

export async function getCourseInstance(
  id: string
): Promise<CourseInstance | null> {
  return sanityClient.fetch(
    `*[_type == "courseInstance" && _id == $id][0]`,
    { id }
  );
}

// === Blog Posts ===

export async function getBlogPosts(
  limit = 10,
  offset = 0
): Promise<BlogPost[]> {
  return sanityClient.fetch(
    `*[_type == "blogPost"] | order(publishedAt desc) [$offset...$end] {
      _id,
      title,
      slug,
      featuredImage { asset->, alt },
      publishedAt,
      categories,
      metaDescription
    }`,
    { offset, end: offset + limit }
  );
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  return sanityClient.fetch(
    `*[_type == "blogPost" && slug.current == $slug][0] {
      _id,
      title,
      slug,
      body[] {
        ...,
        _type == "image" => { ..., asset-> }
      },
      featuredImage { asset->, alt },
      publishedAt,
      categories,
      metaDescription
    }`,
    { slug }
  );
}

export async function getBlogPostCount(): Promise<number> {
  return sanityClient.fetch(`count(*[_type == "blogPost"])`);
}

export async function getRelatedPosts(
  currentId: string,
  categories: string[] = [],
  limit = 3
): Promise<BlogPost[]> {
  // Try same-category posts first, fill with recent posts if not enough
  if (categories.length > 0) {
    const related = await sanityClient.fetch<BlogPost[]>(
      `*[_type == "blogPost" && _id != $currentId && count((categories[])[@ in $categories]) > 0] | order(publishedAt desc) [0...$limit] {
        _id, title, slug, featuredImage { asset->, alt }, publishedAt, categories
      }`,
      { currentId, categories, limit }
    );
    if (related.length >= limit) return related;

    // Fill remaining slots with recent posts
    const existingIds = [currentId, ...related.map((p) => p._id)];
    const filler = await sanityClient.fetch<BlogPost[]>(
      `*[_type == "blogPost" && !(_id in $existingIds)] | order(publishedAt desc) [0...$fillCount] {
        _id, title, slug, featuredImage { asset->, alt }, publishedAt, categories
      }`,
      { existingIds, fillCount: limit - related.length }
    );
    return [...related, ...filler];
  }

  // No categories — just show most recent
  return sanityClient.fetch(
    `*[_type == "blogPost" && _id != $currentId] | order(publishedAt desc) [0...$limit] {
      _id, title, slug, featuredImage { asset->, alt }, publishedAt, categories
    }`,
    { currentId, limit }
  );
}

// === Trainings ===

const trainingGroupProjection = `{
  _id,
  _rev,
  _type,
  weekday,
  startTime,
  endTime,
  capacity,
  confirmedSpots,
  holds,
  startDateOverride,
  endDateOverride,
  pricingOverride,
  trainerName,
  notes,
  brevoListId,
  confirmedPaymentIntentIds,
  active,
  "venue": venue->{
    _id, _type, name, city, slug, description, address,
    image { asset->, alt },
    defaultStartDate, defaultEndDate, defaultPricing, sortOrder, active
  },
  "program": program->{
    _id, _type, name, slug, shortDescription, description,
    placementGuidance, equipment, image { asset->, alt }, sortOrder, active
  },
  "activeHoldCount": count(coalesce(holds, [])[expiresAt > now()]),
  "availableSpots": capacity - coalesce(confirmedSpots, 0) - count(coalesce(holds, [])[expiresAt > now()]),
  "isFull": capacity - coalesce(confirmedSpots, 0) - count(coalesce(holds, [])[expiresAt > now()]) <= 0
}`;

export async function getTrainingSettings(): Promise<TrainingSettings | null> {
  return sanityFreshClient.fetch(
    `*[_type == "trainingSettings"][0] {
      _id, _type, seasonLabel, applicationsOpen, membershipFee, holdMinutes
    }`
  );
}

export async function getTrainingPrograms(): Promise<TrainingProgram[]> {
  return sanityFreshClient.fetch(
    `*[_type == "trainingProgram" && active == true] | order(sortOrder asc) {
      _id, _type, name, slug, shortDescription, description, placementGuidance,
      equipment, image { asset->, alt }, sortOrder, active
    }`
  );
}

export async function getTrainingVenues(): Promise<TrainingVenue[]> {
  return sanityFreshClient.fetch(
    `*[_type == "trainingVenue" && active == true] | order(sortOrder asc) {
      _id, _type, name, city, slug, description, address,
      image { asset->, alt },
      defaultStartDate, defaultEndDate, defaultPricing, sortOrder, active
    }`
  );
}

export async function getTrainingGroups(): Promise<TrainingGroup[]> {
  return sanityFreshClient.fetch(
    `*[_type == "trainingGroup" && active == true && venue->active == true && program->active == true]
      | order(venue->sortOrder asc, weekday asc, startTime asc) ${trainingGroupProjection}`
  );
}

export async function getTrainingGroup(id: string): Promise<TrainingGroup | null> {
  return sanityFreshClient.fetch(
    `*[_type == "trainingGroup" && _id == $id][0] ${trainingGroupProjection}`,
    { id }
  );
}

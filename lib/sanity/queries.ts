import { sanityClient, sanityFreshClient } from "./client";
import type {
  BlogPost,
  CourseDepthSession,
  CourseInstance,
  TrainingGroup,
  TrainingProgram,
  TrainingSettings,
  TrainingVenue,
} from "./types";

// === Course Instances ===

const previewShorterCourseDates = new Set([
  "2027-01-30",
  "2027-03-20",
  "2027-04-17",
]);

function applyCourseSchedulePreview(course: CourseInstance): CourseInstance {
  if (
    process.env.COURSE_SCHEDULE_PREVIEW !== "true" ||
    !previewShorterCourseDates.has(course.startDate)
  ) {
    return course;
  }

  return {
    ...course,
    endTime: course.endTime === "16:00" ? "15:00" : course.endTime,
    notes: course.notes?.replace("10.00–16.00", "10.00–15.00"),
  };
}

export async function getUpcomingCourses(
  courseType?: CourseInstance["courseType"]
): Promise<CourseInstance[]> {
  const filter = courseType
    ? `_type == "courseInstance" && courseType == $courseType && startDate >= now()`
    : `_type == "courseInstance" && startDate >= now()`;

  const courses = await sanityClient.fetch<CourseInstance[]>(
    `*[${filter}] | order(startDate asc)`,
    courseType ? { courseType } : {}
  );
  return courses.map(applyCourseSchedulePreview);
}

export async function getCourseInstance(
  id: string
): Promise<CourseInstance | null> {
  const course = await sanityClient.fetch<CourseInstance | null>(
    `*[_type == "courseInstance" && _id == $id][0]`,
    { id }
  );
  return course ? applyCourseSchedulePreview(course) : null;
}

export async function getActiveCourseApplicationCount(
  courseInstanceId: string
): Promise<number> {
  return sanityFreshClient.fetch(
    `count(*[
      _type == "courseApplication" &&
      courseInstance._ref == $courseInstanceId &&
      fullPaymentStatus != "cancelled"
    ])`,
    { courseInstanceId }
  );
}

export async function getOpenCourseDepthSessions(): Promise<CourseDepthSession[]> {
  if (process.env.COURSE_SCHEDULE_PREVIEW === "true") {
    return [
      {
        _id: "preview-depth-2027-05-22",
        _type: "courseDepthSession",
        startDate: "2027-05-22",
        endDate: "2027-05-23",
        location: "Krk, Omišalj",
        capacity: 32,
        confirmedSpots: 0,
        availableSpots: 32,
        isOpen: true,
      },
      {
        _id: "preview-depth-2027-05-29",
        _type: "courseDepthSession",
        startDate: "2027-05-29",
        endDate: "2027-05-30",
        location: "Krk, Omišalj",
        capacity: 8,
        confirmedSpots: 0,
        availableSpots: 8,
        isOpen: true,
      },
      {
        _id: "preview-depth-2027-06-19",
        _type: "courseDepthSession",
        startDate: "2027-06-19",
        endDate: "2027-06-20",
        location: "Krk, Omišalj",
        capacity: 32,
        confirmedSpots: 0,
        availableSpots: 32,
        isOpen: true,
        notes: "14 mest je rezerviranih za termin teorije in bazena 15.–16. junija.",
      },
      {
        _id: "preview-depth-2027-07-10",
        _type: "courseDepthSession",
        startDate: "2027-07-10",
        endDate: "2027-07-11",
        location: "Bled",
        capacity: 24,
        confirmedSpots: 0,
        availableSpots: 24,
        isOpen: true,
      },
    ];
  }
  return sanityFreshClient.fetch(
    `*[_type == "courseDepthSession" && isOpen == true && startDate >= now()] | order(startDate asc) {
      _id,
      _type,
      startDate,
      endDate,
      location,
      capacity,
      isOpen,
      notes,
      "confirmedSpots": count(*[
        _type == "courseApplication" &&
        depthSession._ref == ^._id &&
        fullPaymentStatus == "paid"
      ]),
      "availableSpots": capacity - count(*[
        _type == "courseApplication" &&
        depthSession._ref == ^._id &&
        fullPaymentStatus == "paid"
      ])
    }`
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
      intro,
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

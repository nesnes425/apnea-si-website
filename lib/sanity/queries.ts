import { sanityClient } from "./client";
import type { CourseInstance, BlogPost } from "./types";

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
      featuredImage { asset-> { _ref, url }, alt },
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
      body,
      featuredImage { asset-> { _ref, url }, alt },
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

import type { CourseType } from "@/lib/config";

export type CourseDepthOption = {
  value: string;
  dateRange: string;
  location: string;
  label: string;
};

const courseDepthOptions: Partial<Record<CourseType, CourseDepthOption[]>> = {
  zacetni: [
    {
      value: "zacetni-2026-09-26-krk",
      dateRange: "26.–27. september 2026",
      location: "Krk",
      label: "26.–27. september 2026 (Krk – globinski del)",
    },
  ],
};

export function getCourseDepthOptions(courseType: CourseType): CourseDepthOption[] {
  return courseDepthOptions[courseType] ?? [];
}

export function getCourseDepthOption(
  courseType: CourseType,
  value: string | undefined
): CourseDepthOption | undefined {
  if (!value) return undefined;
  return getCourseDepthOptions(courseType).find((option) => option.value === value);
}

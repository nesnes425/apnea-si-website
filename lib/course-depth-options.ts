import type { CourseDepthSession } from "@/lib/sanity/types";
import { formatCourseDateRange } from "@/lib/utils";

export type CourseDepthOption = {
  value: string;
  dateRange: string;
  location: string;
  label: string;
};

export const PENDING_DEPTH_OPTION_VALUE = "pending";

export const PENDING_DEPTH_OPTION: CourseDepthOption = {
  value: PENDING_DEPTH_OPTION_VALUE,
  dateRange: "",
  location: "",
  label: "Globinski del (termin bo usklajen naknadno)",
};

export function toCourseDepthOptions(
  sessions: CourseDepthSession[]
): CourseDepthOption[] {
  return sessions.map((session) => {
    const dateRange = formatCourseDateRange(session.startDate, session.endDate);
    return {
      value: session._id,
      dateRange,
      location: session.location,
      label: `${dateRange} (${session.location} – globinski del, začetni)`,
    };
  });
}

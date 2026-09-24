import type { CourseDepthSession } from "@/lib/sanity/types";
import { formatCourseDateRange } from "@/lib/utils";

export type CourseDepthOption = {
  value: string;
  dateRange: string;
  location: string;
  label: string;
  availableSpots: number;
};

export function toCourseDepthOptions(
  sessions: CourseDepthSession[]
): CourseDepthOption[] {
  return sessions
    .filter((session) => session.availableSpots > 0)
    .map((session) => {
      const dateRange = formatCourseDateRange(session.startDate, session.endDate);
      return {
        value: session._id,
        dateRange,
        location: session.location,
        label: `${dateRange} (${session.location} – globinski del)`,
        availableSpots: session.availableSpots,
      };
    });
}

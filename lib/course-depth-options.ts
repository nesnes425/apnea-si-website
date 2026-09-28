import type { CourseDepthSession } from "@/lib/sanity/types";
import { formatCourseDateRange } from "@/lib/utils";

export type CourseDepthOption = {
  value: string;
  dateRange: string;
  location: string;
  label: string;
  availableSpots: number;
};

// `courseDepthSession` documents have no course-level field, so every booking page
// (začetni, nadaljevalni, master) is currently offered the exact same list of depth
// dates. In practice all open sessions today are for the začetni course only, so we
// label them as such and give the other levels an explicit "termin ni še določen"
// option instead of letting them pick a začetni-only date by mistake (see September
// 28, 2026 mix-up). The real fix is a course-level field on courseDepthSession; this
// is a stopgap until that lands.
export const PENDING_DEPTH_OPTION_VALUE = "pending";

export const PENDING_DEPTH_OPTION: CourseDepthOption = {
  value: PENDING_DEPTH_OPTION_VALUE,
  dateRange: "",
  location: "",
  label: "Globinski del (termin bo usklajen naknadno)",
  availableSpots: 1,
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
        label: `${dateRange} (${session.location} – globinski del, začetni)`,
        availableSpots: session.availableSpots,
      };
    });
}

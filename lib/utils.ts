import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const slMonth = new Intl.DateTimeFormat("sl-SI", { month: "long" });
const slMonthYear = new Intl.DateTimeFormat("sl-SI", { month: "long", year: "numeric" });
const slFull = new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "long", year: "numeric" });

export function formatCourseDateRange(startISO: string, endISO: string): string {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const sd = start.getDate();
  const ed = end.getDate();
  const sameYear = start.getFullYear() === end.getFullYear();
  const sameMonth = sameYear && start.getMonth() === end.getMonth();

  if (sameMonth) {
    return `${sd}.–${ed}. ${slMonthYear.format(start)}`;
  }
  if (sameYear) {
    return `${sd}. ${slMonth.format(start)} – ${ed}. ${slMonthYear.format(end)}`;
  }
  return `${slFull.format(start)} – ${slFull.format(end)}`;
}

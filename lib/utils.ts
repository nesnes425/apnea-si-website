import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

const slMonth = new Intl.DateTimeFormat("sl-SI", { month: "long" });
const slMonthYear = new Intl.DateTimeFormat("sl-SI", { month: "long", year: "numeric" });
const slFull = new Intl.DateTimeFormat("sl-SI", { day: "numeric", month: "long", year: "numeric" });

export function escapeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

export function splitName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  const first = parts[0] ?? "";
  const last = parts.slice(1).join(" ");
  return { first, last };
}

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

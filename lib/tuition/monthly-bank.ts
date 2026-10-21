import type {TuitionPlan} from "./plan";

export function monthEnd(firstMonth: string, offset = 0) {
  const [year, month] = firstMonth.split("-").map(Number);
  return new Date(Date.UTC(year, month + offset, 0, 12)).toISOString().slice(0, 10);
}

export function monthlyBankDates(plan: TuitionPlan) {
  const schedule = plan.monthlyBankPayments;
  return schedule ? Array.from({length: schedule.count}, (_, i) => monthEnd(schedule.firstMonth, i)) : [];
}

export function upnDeadline(plan: TuitionPlan) {
  return monthlyBankDates(plan).at(-1) ?? plan.firstPaymentDeadline;
}

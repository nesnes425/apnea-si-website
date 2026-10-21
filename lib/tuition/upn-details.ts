import {siteConfig} from "@/lib/config";
import {displayDate, type TuitionPlan} from "./plan";
import {bankReference} from "./bank-model";
import {upnDeadline} from "./monthly-bank";

export function upnDetails(plan: TuitionPlan, sample = false) {
  return {
    ...siteConfig.tuitionBank,
    iban: sample ? "[IBAN društva - v vzorcu ni za plačilo]" : siteConfig.tuitionBank.iban,
    reference: sample ? "[osebni sklic]" : bankReference(plan.id),
    amountCents: plan.first.amountCents + (plan.second?.amountCents ?? 0),
    purpose: `Vadnina 2026/27 - ${plan.participant}`,
    deadline: displayDate(upnDeadline(plan)),
    payer: plan.payer,
  };
}

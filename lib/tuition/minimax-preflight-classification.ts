import {minimaxIndividualSwimmingItem} from "@/lib/config";
import type {MinimaxIssuedInvoice} from "@/lib/minimax/client";

const normalized = (value:string) => value.normalize("NFKC").trim().replace(/\s+/g," ").toLocaleLowerCase("sl");
const seasonalEvidence = /vadnin|tuition|sezon|season|obrok|\b20\d{2}\s*(?:\/\s*(?:20)?\d{2}|[–—-]\s*20\d{2})\b|\bplan(?:[_ -]?id)?\b|\b(?:pi|ch|in)_[a-z0-9]+|\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/i;

// Only positively identified individual lessons are separate. Unknown items,
// mixed invoices, seasonal references and malformed/missing rows stay blocking.
export function classifyMinimaxInvoice(
  invoice:MinimaxIssuedInvoice,
  seasonalItemIds:ReadonlySet<number | undefined>,
  membershipItemId:number | undefined,
  organisationId:number,
) {
  const rows=invoice.IssuedInvoiceRows;
  if(!rows?.length) throw new Error("Minimax invoice rows missing");
  const knownIndividualRows=organisationId===minimaxIndividualSwimmingItem.organisationId && rows.every(row=>
    row.Item?.ID===minimaxIndividualSwimmingItem.itemId &&
    !seasonalItemIds.has(row.Item.ID) &&
    normalized(row.ItemName??"")===normalized(minimaxIndividualSwimmingItem.name) &&
    (!row.Item.Name || normalized(row.Item.Name)===normalized(minimaxIndividualSwimmingItem.name)) &&
    /\bindividualn/i.test(row.Description??"") &&
    !seasonalEvidence.test(row.Description??""),
  );
  const separateService=knownIndividualRows &&
    !invoice.DocumentReference?.trim() && invoice.InvoiceForPeriod!=="D" &&
    !seasonalEvidence.test([invoice.Notes,invoice.DescriptionAbove,invoice.DescriptionBelow].join(" "))
    ? "individual_swimming" as const : undefined;
  const tuition=!separateService && rows.some(row=>seasonalItemIds.has(row.Item?.ID) ||
    /vadnin|tuition/i.test(`${row.ItemName??""} ${row.Description??""} ${row.Item?.Name??""}`));
  const membershipOnly=Boolean(membershipItemId) && rows.every(row=>row.Item?.ID===membershipItemId) && !tuition;
  return {tuition,membershipOnly,...(separateService ? {separateService} : {})};
}

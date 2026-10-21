import {createHash} from "node:crypto";
import {trainingStripe} from "@/lib/stripe/training-client";
import {getResource, getIssuedInvoice, getItemByCode, type MinimaxIssuedInvoice} from "@/lib/minimax/client";
import {tuitionDb, type PlanRecord} from "./store";
import {CLUB_STRIPE_ACCOUNT, tuitionItem, TUITION_TYPE, type TuitionPlan} from "./plan";
import {normalize, type PreflightReaders, type ProviderRecord, type ProviderSnapshot, type RegistrySnapshot} from "./batch-preflight";

const ORGANISATION = 241557;
const MAX_PAGES = 20;
const PAGE_SIZE = 100;
const stripeOptions = {timeout:5000,maxNetworkRetries:0};
type Page<T> = {Rows:T[]; TotalRows:number; CurrentPageNumber:number; PageSize:number};
type Customer = {CustomerId:number; Code?:string; Name?:string; Address?:string; PostalCode?:string};
const quoted = (v:string) => `"${v.replace(/\\/g,"\\\\").replace(/"/g,'\\"')}"`;
const inList = (values:string[]) => `(${values.map(quoted).join(",")})`;

// Every loop is bounded and fails closed at a truncated page or a repeated cursor.
export async function readCompleteStripePages<T extends {id:string}>(read:(cursor?:string)=>Promise<{data:T[];has_more:boolean}>, assertTime:()=>void): Promise<T[]> {
  const result:T[] = [], seen = new Set<string>();
  let cursor:string|undefined;
  for (let page=0; page<MAX_PAGES;page++) {
    assertTime();
    const response = await read(cursor);
    if (!Array.isArray(response.data) || typeof response.has_more !== "boolean") throw new Error("Invalid Stripe page");
    for (const row of response.data) {
      if (!row.id || seen.has(row.id)) throw new Error("Repeated Stripe page");
      seen.add(row.id); result.push(row);
    }
    if (!response.has_more) return result;
    if (!response.data.length) throw new Error("Missing Stripe next cursor");
    cursor=response.data.at(-1)!.id;
  }
  throw new Error("Stripe coverage limit reached");
}
export async function readCompleteMinimaxPages<T extends {CustomerId?:number;IssuedInvoiceId?:number}>(read:(page:number)=>Promise<Page<T>>, assertTime:()=>void):Promise<T[]> {
  const result:T[]=[], seen=new Set<number>();
  let expectedTotal:number|undefined;
  for(let page=1;page<=MAX_PAGES;page++) {
    assertTime();
    const r=await read(page);
    if (!Array.isArray(r.Rows) || !Number.isSafeInteger(r.TotalRows) || r.TotalRows<0 || r.CurrentPageNumber!==page || r.PageSize!==PAGE_SIZE || (expectedTotal!==undefined && expectedTotal!==r.TotalRows)) throw new Error("Incomplete Minimax page metadata");
    expectedTotal=r.TotalRows;
    for(const row of r.Rows) {
      const id=row.CustomerId ?? row.IssuedInvoiceId;
      if (!id || seen.has(id)) throw new Error("Repeated Minimax page");
      seen.add(id);result.push(row);
    }
    if(result.length===r.TotalRows) return result;
    if(!r.Rows.length || result.length>r.TotalRows || r.Rows.length<PAGE_SIZE) throw new Error("Truncated Minimax page");
  }
  throw new Error("Minimax coverage limit reached");
}
async function readDbPages<T>(route:string, assertTime:()=>void):Promise<T[]> {
  const rows:T[]=[];
  for(let page=0;page<MAX_PAGES;page++) {
    assertTime();
    const result=await tuitionDb<T[]>(`${route}${route.includes("?") ? "&" : "?"}limit=${PAGE_SIZE}&offset=${page*PAGE_SIZE}`);
    if(!Array.isArray(result)) throw new Error("Invalid registry page");
    rows.push(...result);
    if(result.length<PAGE_SIZE) return rows;
  }
  throw new Error("Registry coverage limit reached");
}
function snapshots(plans:TuitionPlan[], scope:string): ProviderSnapshot[] {return plans.map(()=>({records:[],complete:true,scope}));}

export function runtimePreflightReaders():PreflightReaders {
  const deadline=Date.now()+43_000;
  const assertTime=()=>{if(Date.now()>deadline) throw new Error("Preflight read budget exceeded");};
  return {
    async registry(plans) {
      const queries=[`tuition_plans?or=${encodeURIComponent(`(id.in.${inList(plans.map(p=>p.id))},source_obligation.in.${inList(plans.map(p=>p.source.obligationId))})`)}&order=id`];
      for(const email of new Set(plans.map(p=>normalize(p.payer.email)))) {
        // ILIKE without wildcards is exact, case-insensitive email equality.
        const escaped=email.replace(/[\\%_*]/g,c=>`\\${c}`);
        queries.push(`tuition_plans?manifest->payer->>email=ilike.${encodeURIComponent(escaped)}&order=id`);
      }
      const records=(await Promise.all(queries.map(q=>readDbPages<PlanRecord>(q,assertTime)))).flat();
      const unique=[...new Map(records.map(r=>[r.id,r])).values()];
      if(!unique.length) return {plans:[],payments:[],deliveries:[],bankEntries:[]};
      const filter=`plan_id=in.${encodeURIComponent(inList(unique.map(r=>r.id)))}`;
      const [payments,deliveries,bankEntries]=await Promise.all([
        readDbPages<RegistrySnapshot["payments"][number]>(`tuition_payments?${filter}&select=id,plan_id,minimax_id&order=id`,assertTime),
        readDbPages<RegistrySnapshot["deliveries"][number]>(`tuition_email_deliveries?${filter}&select=id,plan_id,submission_state&order=id`,assertTime),
        readDbPages<RegistrySnapshot["bankEntries"][number]>(`tuition_bank_entries?${filter}&select=entry_key,plan_id,state&order=entry_key`,assertTime),
      ]);
      return {plans:unique,payments,deliveries,bankEntries};
    },
    async stripe(plans) {
      if(!/^(sk|rk)_live_/.test(process.env.TRAINING_STRIPE_SECRET_KEY ?? "")) throw new Error("Live Stripe key required");
      const account=await trainingStripe.accounts.retrieve(null,{},stripeOptions);
      if(account.id!==CLUB_STRIPE_ACCOUNT) throw new Error("Wrong Stripe club account");
      // Account list APIs avoid Search's eventually consistent absence. Guest
      // intents are included even when they do not have a Stripe customer.
      const [customers,invoices,payments,charges]=await Promise.all([
        readCompleteStripePages(cursor=>trainingStripe.customers.list({limit:100,...(cursor ? {starting_after:cursor}:{})},stripeOptions),assertTime),
        readCompleteStripePages(cursor=>trainingStripe.invoices.list({limit:100,...(cursor ? {starting_after:cursor}:{})},stripeOptions),assertTime),
        readCompleteStripePages(cursor=>trainingStripe.paymentIntents.list({limit:100,expand:["data.latest_charge"],...(cursor ? {starting_after:cursor}:{})},stripeOptions),assertTime),
        readCompleteStripePages(cursor=>trainingStripe.charges.list({limit:100,...(cursor ? {starting_after:cursor}:{})},stripeOptions),assertTime),
      ]);
      const result=snapshots(plans,`stripe:${account.id}:live:complete_lists`);
      for(let i=0;i<plans.length;i++) {
        const p=plans[i], email=normalize(p.payer.email), matching=customers.filter(c=>normalize(c.email??"")===email);
        const ids=new Set(matching.map(c=>c.id));
        const add=(r:ProviderRecord)=>result[i].records.push(r);
        for(const c of matching) {
          if(!c.livemode) throw new Error("Stripe mode mismatch");
          add({ref:`stripe:${c.id}`,kind:"customer",planId:c.metadata?.planId,customerId:c.id});
        }
        for(const inv of invoices) {
          const customer=typeof inv.customer==="string" ? inv.customer:inv.customer?.id;
          if(!ids.has(customer??"") && normalize(inv.customer_email??"")!==email) continue;
          if(!inv.livemode) throw new Error("Stripe mode mismatch");
          // A metadata label alone cannot hide mixed membership/tuition lines.
          const lines=await readCompleteStripePages(cursor=>trainingStripe.invoices.listLineItems(inv.id,{limit:100,...(cursor ? {starting_after:cursor}:{})},stripeOptions),assertTime);
          const text=lines.map(l=>l.description??"").join(" ");
          const tuition=inv.metadata?.type===TUITION_TYPE || /vadnin|tuition/i.test(text);
          const membershipOnly=(!inv.metadata?.type || inv.metadata.type==="training_membership") && !tuition && lines.length>0 && lines.every(l=>/članarin|clanarin|membership/i.test(l.description??""));
          add({ref:`stripe:${inv.id}`,kind:"invoice",planId:inv.metadata?.planId,customerId:customer,tuition,membershipOnly,paid:inv.status==="paid",inactive:inv.status==="void"});
        }
        const includedPayments=new Set<string>();
        for(const pi of payments) {
          const customer=typeof pi.customer==="string" ? pi.customer:pi.customer?.id;
          const charge=typeof pi.latest_charge==="object" ? pi.latest_charge:null;
          if(!ids.has(customer??"") && ![pi.metadata.customerEmail,pi.receipt_email,charge?.billing_details?.email].some(v=>v && normalize(v)===email)) continue;
          if(!pi.livemode) throw new Error("Stripe mode mismatch");
          includedPayments.add(pi.id);
          const tuition=pi.metadata.type===TUITION_TYPE || /vadnin|tuition/i.test(pi.description??"");
          const membershipOnly=pi.metadata.type==="training_membership" && Boolean(pi.metadata.trainingGroupId) && !tuition;
          add({ref:`stripe:${pi.id}`,kind:"payment",planId:pi.metadata.planId,customerId:customer??undefined,tuition,membershipOnly,inactive:pi.status==="canceled" || (!tuition && !["succeeded","processing","requires_capture"].includes(pi.status))});
        }
        // Include legacy standalone charges and charges whose billing email is
        // absent from the intent's latest charge. A seen intent is not duplicated.
        for(const charge of charges) {
          const customer=typeof charge.customer==="string" ? charge.customer:charge.customer?.id;
          if(!ids.has(customer??"") && ![charge.billing_details?.email,charge.receipt_email].some(v=>v && normalize(v)===email)) continue;
          const intentId=typeof charge.payment_intent==="string" ? charge.payment_intent:charge.payment_intent?.id;
          if(intentId && includedPayments.has(intentId)) continue;
          if(!charge.livemode) throw new Error("Stripe mode mismatch");
          const intent=intentId ? payments.find(pi=>pi.id===intentId):undefined;
          if(intentId && !intent) throw new Error("Charge intent missing from complete list");
          const metadata=intent?.metadata ?? charge.metadata;
          const tuition=metadata.type===TUITION_TYPE || /vadnin|tuition/i.test(`${charge.description??""} ${intent?.description??""}`);
          const membershipOnly=metadata.type==="training_membership" && Boolean(metadata.trainingGroupId) && !tuition;
          add({ref:`stripe:${intentId??charge.id}`,kind:"payment",planId:metadata.planId,customerId:customer??undefined,tuition,membershipOnly,inactive:charge.status==="failed"});
        }
      }
      return result;
    },
    async minimax(plans) {
      if(Number(process.env.MINIMAX_TRAINING_ORGANISATION_ID)!==ORGANISATION) throw new Error("Wrong Minimax club configuration");
      const org=await getResource<{OrganisationId:number;Title:string}>(`/api/orgs/${ORGANISATION}`);
      if(org.OrganisationId!==ORGANISATION || !/APNEA/i.test(org.Title??"")) throw new Error("Wrong Minimax organisation");
      const [customers,membership]=await Promise.all([
        readCompleteMinimaxPages(page=>getResource<Page<Customer>>(`/api/orgs/${ORGANISATION}/customers?CurrentPage=${page}&PageSize=100`),assertTime),
        getItemByCode({organisationId:ORGANISATION,code:"APNEA-CLANARINA"}),
      ]);
      const itemIds=new Set(plans.map(p=>tuitionItem(p.locationCode).minimaxItemId));
      if(itemIds.has(undefined)) throw new Error("Missing Minimax tuition item mapping");
      const result=snapshots(plans,`minimax:org:${ORGANISATION}:payer_name_or_stable_code:all_invoice_pages`);
      const invoiceCache=new Map<number,Promise<MinimaxIssuedInvoice[]>>();
      const readInvoices=(customerId:number)=>{
        let pending=invoiceCache.get(customerId);
        if(!pending) {
          pending=(async()=>{
            const listed=await readCompleteMinimaxPages(page=>getResource<Page<{IssuedInvoiceId:number}>>(`/api/orgs/${ORGANISATION}/issuedinvoices?InvoiceType=R&CustomerID=${customerId}&CurrentPage=${page}&PageSize=100`),assertTime);
            const invoices:MinimaxIssuedInvoice[]=[];
            // Small parallel groups bound upstream traffic and wall-clock time.
            for(let at=0;at<listed.length;at+=5) {
              assertTime();
              const group=await Promise.all(listed.slice(at,at+5).map(row=>getIssuedInvoice({organisationId:ORGANISATION,issuedInvoiceId:row.IssuedInvoiceId})));
              if(group.some(inv=>inv.Customer?.ID!==customerId)) throw new Error("Minimax customer filter not verified");
              invoices.push(...group);
            }
            return invoices;
          })(); invoiceCache.set(customerId,pending);
        }
        return pending;
      };
      for(let i=0;i<plans.length;i++) {
        const p=plans[i], code=`AP-T-${createHash("sha256").update(p.payerId).digest("hex").slice(0,16).toUpperCase()}`;
        const matches=customers.filter(c=>c.Code===code || normalize(c.Name??"")===normalize(p.payer.name));
        for(const customer of matches) {
          result[i].records.push({ref:`minimax:customer:${customer.CustomerId}`,kind:"customer"});
          for(const inv of await readInvoices(customer.CustomerId)) {
            const rows=inv.IssuedInvoiceRows;
            if(!rows?.length) throw new Error("Minimax invoice rows missing");
            const tuition=rows.some(r=>itemIds.has(r.Item?.ID) || /vadnin|tuition/i.test(`${r.ItemName??""} ${r.Description??""} ${r.Item?.Name??""}`));
            const membershipOnly=Boolean(membership) && rows.every(r=>r.Item?.ID===membership!.ItemId) && !tuition;
            result[i].records.push({ref:`minimax:${inv.IssuedInvoiceId}`,kind:"invoice",tuition,membershipOnly,serviceFrom:inv.DateTransactionFrom?.slice(0,10),serviceTo:inv.DateTransaction?.slice(0,10)});
          }
        }
      }
      return result;
    },
  };
}

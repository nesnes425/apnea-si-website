// Lists "Nadomeščanje" rows of the master sheet log on the matching planned portal
// sessions. Run from a trusted server after the roster sync. Logs only sheet row
// numbers and reasons, never names or emails. Dry-run by default; --apply writes.
// Required env: PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON, PORTAL_SUPABASE_URL,
// PORTAL_SUPABASE_SERVICE_KEY.
import { parseRoster, RANGES } from '../lib/portal/roster-source.mjs';
import { parseMakeups, LOG_RANGE } from '../lib/portal/makeup-source.mjs';
import { readRanges, callRpc } from '../lib/portal/sheet-read.mjs';
const required=['PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON','PORTAL_SUPABASE_URL','PORTAL_SUPABASE_SERVICE_KEY'];
for(const key of required)if(!process.env[key])throw Error(`Missing ${key}`);
const observed=new Date().toISOString();
const values=await readRanges([...RANGES.map(range=>`Skupine!${range}`),LOG_RANGE]);
const identities=[];
parseRoster(values.slice(0,5),observed,undefined,identities);
const {payload,rows,report}=parseMakeups(values[5],identities,observed);
if(!process.argv.includes('--apply'))console.log(JSON.stringify({mode:'dry-run',items:payload.items.length,not_listed:report}));
else {
 const response=await callRpc('portal_sync_makeups',payload);
 if(!response.ok)throw Error(`Makeup update rejected (${response.status}); no partial changes committed`);
 const result=await response.json();
 // Sheet rows that are not on a planned session, for Katarina's morning review.
 const placed=new Set(['added','listed','recorded']);
 const notListed=[...report,...result.statuses.map((reason,i)=>({row:rows[i],reason})).filter(r=>!placed.has(r.reason))];
 console.log(JSON.stringify({items:result.items,added:result.added,removed:result.removed,not_listed:notListed}));
}

// Run from a trusted server. No personal data or credential values are logged.
// Required env: PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON, PORTAL_SUPABASE_URL,
// PORTAL_SUPABASE_SERVICE_KEY. Dry-run by default; --apply explicitly writes.
import { createSign } from 'node:crypto';
import { parseRoster, SOURCE_ID, RANGES } from '../lib/portal/roster-source.mjs';
const required=['PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON','PORTAL_SUPABASE_URL','PORTAL_SUPABASE_SERVICE_KEY'];
for(const key of required)if(!process.env[key])throw Error(`Missing ${key}`);
const account=JSON.parse(process.env.PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON);
const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
const now=Math.floor(Date.now()/1000);
const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
const assertion=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).sign(account.private_key,'base64url');
const auth=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(30000)});
if(!auth.ok)throw Error(`Google authentication failed (${auth.status})`);
const {access_token}=await auth.json();
const query=new URLSearchParams({valueRenderOption:'FORMATTED_VALUE'});
for(const range of RANGES)query.append('ranges',`Skupine!${range}`);
const observed=new Date().toISOString();
const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SOURCE_ID}/values:batchGet?${query}`,{headers:{Authorization:`Bearer ${access_token}`},signal:AbortSignal.timeout(30000)});
if(!response.ok)throw Error(`Source read failed (${response.status})`);
const data=await response.json();
const payload=parseRoster(data.valueRanges.map(r=>r.values||[]),observed,process.env.PORTAL_INITIAL_MEMBERSHIP_DATE);
if(!process.argv.includes('--apply'))console.log(JSON.stringify({mode:'dry-run',groups:payload.groups.length,enrolments:payload.groups.reduce((n,g)=>n+g.members.length,0)}));
else {
 const response=await fetch(`${process.env.PORTAL_SUPABASE_URL}/rest/v1/rpc/portal_sync_roster`,{method:'POST',headers:{apikey:process.env.PORTAL_SUPABASE_SERVICE_KEY,'Content-Type':'application/json',...(process.env.PORTAL_SUPABASE_SERVICE_KEY.startsWith('eyJ')?{Authorization:`Bearer ${process.env.PORTAL_SUPABASE_SERVICE_KEY}`}:{})},body:JSON.stringify({payload}),signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Roster update rejected (${response.status}); no partial changes committed`);
 console.log(JSON.stringify(await response.json()));
}

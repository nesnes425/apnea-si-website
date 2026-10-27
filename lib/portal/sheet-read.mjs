// Read-only Google Sheets access for trusted server scripts. Never logs values.
import { createSign } from 'node:crypto';
import { SOURCE_ID } from './roster-source.mjs';
export async function readRanges(ranges) {
 const account=JSON.parse(process.env.PORTAL_GOOGLE_SERVICE_ACCOUNT_JSON);
 const encode=x=>Buffer.from(JSON.stringify(x)).toString('base64url');
 const now=Math.floor(Date.now()/1000);
 const unsigned=encode({alg:'RS256',typ:'JWT'})+'.'+encode({iss:account.client_email,scope:'https://www.googleapis.com/auth/spreadsheets.readonly',aud:'https://oauth2.googleapis.com/token',iat:now,exp:now+3600});
 const assertion=unsigned+'.'+createSign('RSA-SHA256').update(unsigned).sign(account.private_key,'base64url');
 const auth=await fetch('https://oauth2.googleapis.com/token',{method:'POST',body:new URLSearchParams({grant_type:'urn:ietf:params:oauth:grant-type:jwt-bearer',assertion}),signal:AbortSignal.timeout(30000)});
 if(!auth.ok)throw Error(`Google authentication failed (${auth.status})`);
 const {access_token}=await auth.json();
 const query=new URLSearchParams({valueRenderOption:'FORMATTED_VALUE'});
 for(const range of ranges)query.append('ranges',range);
 const response=await fetch(`https://sheets.googleapis.com/v4/spreadsheets/${SOURCE_ID}/values:batchGet?${query}`,{headers:{Authorization:`Bearer ${access_token}`},signal:AbortSignal.timeout(30000)});
 if(!response.ok)throw Error(`Source read failed (${response.status})`);
 return (await response.json()).valueRanges.map(r=>r.values||[]);
}
export async function callRpc(name,payload) {
 const key=process.env.PORTAL_SUPABASE_SERVICE_KEY;
 const response=await fetch(`${process.env.PORTAL_SUPABASE_URL}/rest/v1/rpc/${name}`,{method:'POST',headers:{apikey:key,'Content-Type':'application/json',...(key.startsWith('eyJ')?{Authorization:`Bearer ${key}`}:{})},body:JSON.stringify({payload}),signal:AbortSignal.timeout(30000)});
 return response;
}

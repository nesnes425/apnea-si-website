// Run from the website checkout with the existing .env.tuition.local operator config.
// The original XML remains local. Only normalized payment evidence reaches the API.
import {execFile} from 'node:child_process';
import {promisify} from 'node:util';
import {resolve, dirname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {mkdir, writeFile} from 'node:fs/promises';
const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const [file, ...flags] = process.argv.slice(2);
if (!file || flags.some(f => f !== '--apply')) throw Error('Use tuition-bank-import.mjs <statement.xml> [--apply]');
const base = new URL(process.env.TUITION_API_URL ?? '');
if (base.protocol !== 'https:' && !['localhost','127.0.0.1'].includes(base.hostname)) throw Error('HTTPS required');
if (!process.env.TUITION_ADMIN_KEY) throw Error('Missing operator key');
const {stdout} = await promisify(execFile)(process.env.TUITION_PYTHON ?? 'python3', [resolve(root,'scripts/parse-bank-statement.py'), resolve(file)], {maxBuffer:4_000_000});
const input = JSON.parse(stdout);
const response = await fetch(new URL('/api/tuition/bank-import',base), {
  method:'POST',headers:{authorization:`Bearer ${process.env.TUITION_ADMIN_KEY}`,'content-type':'application/json'},
  body:JSON.stringify({...input,apply:flags.includes('--apply')}), signal:AbortSignal.timeout(65_000),
});
if (!response.ok) throw Error(`Import HTTP ${response.status}. Preserve file; inspect status before retry.`);
const result = await response.json();
const dir = resolve(root,'temp/bank-imports');
await mkdir(dir,{recursive:true,mode:0o700});
const output = resolve(dir,`${input.fileHash}-${Date.now()}.json`);
await writeFile(output,JSON.stringify(result,null,2),{mode:0o600});
const counts = {};
for (const r of result.results) counts[r.state] = (counts[r.state] ?? 0) + 1;
console.log(JSON.stringify({applied:result.applied,counts,report:output},null,2));

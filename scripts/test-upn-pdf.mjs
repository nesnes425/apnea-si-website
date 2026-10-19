// Synthetic test artifacts only. Never sends a message or contacts a provider.
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {tuitionUpnPdf} from '../lib/tuition/upn-pdf.tsx';
import {upnPayload,tuitionQr} from '../lib/tuition/upn-qr.ts';
import {planSchema} from '../lib/tuition/plan.ts';
const p=planSchema.parse(JSON.parse(await readFile('scripts/tuition-plan.example.json','utf8')));
p.payer.name='Žiga Ščuk Čopić';p.payer.address='Šolska cesta 12';p.payer.city='Škofja Loka';p.payer.postalCode='4220';p.participant='Žiga Ščuk Čopić';
await mkdir('temp/qr-tests',{recursive:true,mode:0o700});
for(const sample of [false,true]){
 const name=sample?'sample':'synthetic-payment';
 await writeFile(`temp/qr-tests/${name}.pdf`,await tuitionUpnPdf(p,sample),{mode:0o600});
 await writeFile(`temp/qr-tests/${name}.txt`,sample?tuitionQr(p,true).payload:upnPayload(p),{mode:0o600});
}
console.log('Synthetic QR PDFs generated for independent decoding. Do not send or pay them.');

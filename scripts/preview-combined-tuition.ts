// Synthetic preview only. No env files, database, Stripe or email API calls.
import {readFile, mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {planSchema} from "../lib/tuition/plan";
import {combinedInvitation} from "../lib/tuition/combined-template";
import {tuitionUpnPdf} from "../lib/tuition/upn-pdf";
async function main() {
const p = planSchema.parse(JSON.parse(await readFile("scripts/tuition-plan.example.json","utf8")));
p.participant = "Vzorec Član";
p.payer = {name:"Vzorec Član", email:"vzorec@example.invalid",address:"Vzorčna ulica 1",postalCode:"1000",city:"Ljubljana",country:"SI"};
p.agreementNoticeVersion = "2026-27-v1";
const message = combinedInvitation(p,"[Stripe povezava za dva obroka]",true);
const dir = resolve("temp/combined-tuition-preview");
await mkdir(dir,{recursive:true});
await writeFile(resolve(dir,"sporocilo.html"),message.html);
await writeFile(resolve(dir,"sporocilo.txt"),`Od: info@apnea.si\nZadeva: ${message.subject}\n\n${message.text}`);
await writeFile(resolve(dir,"UPN-vzorec.pdf"),await tuitionUpnPdf(p,true));
console.log(dir);

}
main().catch(e => {console.error(e);process.exitCode=1;});

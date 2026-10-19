// Synthetic preview only. No env files, database, Stripe or email API calls.
import {mkdir, writeFile} from "node:fs/promises";
import {resolve} from "node:path";
import {combinedPreview} from "../lib/tuition/combined-preview";
async function main() {
const message = await combinedPreview();
const dir = resolve("temp/combined-tuition-preview");
await mkdir(dir,{recursive:true});
await writeFile(resolve(dir,"sporocilo.html"),message.html);
await writeFile(resolve(dir,"sporocilo.txt"),`Od: info@apnea.si\nZadeva: ${message.subject}\n\n${message.text}`);
await writeFile(resolve(dir,"UPN-vzorec.pdf"),Buffer.from(message.attachment.contentBase64,"base64"));
console.log(dir);

}
main().catch(e => {console.error(e);process.exitCode=1;});

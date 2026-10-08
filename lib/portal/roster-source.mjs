import { createHash } from 'node:crypto';
export const SOURCE_ID = '1f5mlpxe0fmmqtn7VOqC5l6yXtXs2gl7C8BBScZmsUtI';
export const RANGES = ['B1:H1048','Q1:W1048','AF1:AL1048','AU1:BA1048','BJ1:BP1048'];
const days = ['ponedeljek','torek','sreda','četrtek','petek'];
const levels = {'začetna':'beginner','nadaljevalna':'advanced','performance':'performance','mladinska':'youth','statika':'static'};
const locations = new Set(['DIF','Tivoli','Koper','Radovljica','Velenje','Ilirija','Novo mesto','Kranj','Nova Gorica','Vevče']);
// Never identify members by row number: rows move. Keep emails out of portal data.
// Name/email corrections need an operator identity mapping before the next import.
export function parseRoster(weekdays, observedAt, initialFrom) {
 if (weekdays.length !== 5) throw Error('Missing weekday');
 const groups=[];
 for (const [d,rows] of weekdays.entries()) {
  if(rows[1]?.[0] !== 'BAZEN' || rows[1]?.[1] !== 'URA') throw Error('Source headers changed');
  let location='', group;
  for(const [i,row] of rows.entries()) {
   if(i<2) continue;
   const cell=String(row[0]||'').trim();
   if(cell && !/^\d+$/.test(cell)) {
    location=cell==='Ilirja'?'Ilirija':cell;
    if(!locations.has(location)) throw Error('Unknown location');
   }
   const time=String(row[1]||'').replace(/\./g,':').match(/^(\d{1,2}:\d{2})\s*-\s*(\d{1,2}:\d{2})$/);
   if(row[1] && !time) throw Error('Unknown time');
   if(time) {
    const starts=time[1].padStart(5,'0'),ends=time[2].padStart(5,'0');
    if(!location || starts>=ends) throw Error('Invalid time');
    group={key:`2026-27|${d+1}|${location}|${starts}`,label:`${location} · ${days[d]} ${starts}–${ends}`,level:null,levels:[],members:[]};groups.push(group);
   }
   if(row[3]) {
    const level=levels[String(row[3]).trim()];
    if(!group || !level) throw Error('Unknown level');
    if(!group.levels.includes(level))group.levels.push(level);
    group.level=group.levels.length===1?level:'mixed';
   }
   const name=String(row[5]||'').trim().replace(/\s+/g,' '),email=String(row[6]||'').trim().toLowerCase();
   if(!name) {if(email)throw Error('Email without name');continue;}
   if(name==='november - marec' && !email && d===2 && group?.key==='2026-27|3|Tivoli|20:45')continue;
   if(!group || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))throw Error(`Member identity requires review: day ${d+1}, row ${i+1}`);
   const key=createHash('sha256').update(`${name.normalize('NFC').toLowerCase()}\n${email}`).digest('hex');
   if(group.members.some(m=>m.key===key))throw Error('Duplicate member in group');
   group.members.push({key,name});
  }
 }
 if(groups.length!==33 || new Set(groups.map(g=>g.key)).size!==33 || groups.some(g=>!g.level))throw Error('Group layout changed');
 return {source_id:SOURCE_ID,observed_at:observedAt,initial_from:initialFrom,groups:groups.map(({levels,...g})=>g)};
}

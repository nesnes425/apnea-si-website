import { SOURCE_ID, locations, memberKey } from './roster-source.mjs';
export const LOG_RANGE = 'Odsotnosti & nadomeščanja!A1:I1000';
const HEADER = 'Tip (Izostanek/Nadomeščanje)';
const days = { 'ponedeljek': 1, 'torek': 2, 'sreda': 3, 'četrtek': 4, 'petek': 5 };
// The log uses Sanity venue names; the roster sheet uses its own short names.
const venues = { 'Fakulteta za šport': 'DIF', 'Ilirja': 'Ilirija' };
// "Torek, Ilirija, 21:00, nadaljevalna" -> roster group key. The level is not part
// of the key: the roster has one group per weekday, pool and start time.
export function groupKey(label) {
 const m = String(label || '').trim().match(/^([^,]+),\s*([^,]+),\s*(\d{1,2})[:.](\d{2})\s*,/);
 const day = m && days[m[1].trim().toLowerCase()];
 if (!day) return null;
 const venue = venues[m[2].trim()] || m[2].trim();
 if (!locations.has(venue)) return null;
 return { key: `2026-27|${day}|${venue}|${m[3].padStart(2, '0')}:${m[4]}`, day };
}
export function isoDate(text) {
 const m = String(text || '').match(/^\s*(\d{1,2})\.\s*(\d{1,2})\.\s*(\d{4})\s*$/);
 if (!m) return null;
 const date = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
 if (date.getUTCDate() !== +m[1] || date.getUTCMonth() !== +m[2] - 1) return null;
 return { iso: date.toISOString().slice(0, 10), weekday: date.getUTCDay() };
}
// Reads only "Nadomeščanje" rows; absences are ignored. Rows still waiting for the
// person's choice (no target group or date) are skipped without a report.
// identities: [{key,email}] from parseRoster. Row numbers are for the report only.
export function parseMakeups(rows, identities, observedAt) {
 if (rows[0]?.[0] !== HEADER) throw Error('Source headers changed');
 const keys = new Set(identities.map(i => i.key)), byEmail = new Map();
 for (const { key, email } of identities) byEmail.set(email, new Set([...(byEmail.get(email) || []), key]));
 const items = [], report = [], seen = new Set();
 for (const [index, row] of rows.entries()) {
  if (index === 0 || String(row[0] || '').trim() !== 'Nadomeščanje') continue;
  const line = index + 1, dateText = String(row[1] || '').trim(), target = String(row[5] || '').trim();
  if (!dateText || !target) continue;
  const date = isoDate(dateText), group = groupKey(target);
  if (!date) { report.push({ row: line, reason: 'invalid_date' }); continue; }
  if (!group) { report.push({ row: line, reason: 'unknown_group' }); continue; }
  if (date.weekday !== group.day) { report.push({ row: line, reason: 'wrong_weekday' }); continue; }
  const name = String(row[2] || '').trim().replace(/\s+/g, ' '), email = String(row[3] || '').trim().toLowerCase();
  let key = name && email ? memberKey(name, email) : null;
  // A differently written name still matches when the email belongs to one member.
  if (!keys.has(key)) key = byEmail.get(email)?.size === 1 ? [...byEmail.get(email)][0] : null;
  if (!key) { report.push({ row: line, reason: 'not_member' }); continue; }
  const id = `${key}|${group.key}|${date.iso}`;
  if (seen.has(id)) continue;
  seen.add(id);
  items.push({ row: line, member_key: key, group_key: group.key, date: date.iso });
 }
 return { payload: { source_id: SOURCE_ID, observed_at: observedAt, items: items.map(i => ({ member_key: i.member_key, group_key: i.group_key, date: i.date })) }, rows: items.map(i => i.row), report };
}

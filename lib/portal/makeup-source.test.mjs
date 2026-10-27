import assert from 'node:assert/strict';
import test from 'node:test';
import { memberKey } from './roster-source.mjs';
import { parseMakeups, groupKey, isoDate } from './makeup-source.mjs';

const header = ['Tip (Izostanek/Nadomeščanje)', 'Datum', 'Ime in priimek', 'Email', 'Izvorna skupina', 'Ciljna skupina', 'Vnesel', 'Vneseno', 'Opomba'];
const ana = { key: memberKey('Ana Novak', 'ana@example.com'), email: 'ana@example.com' };
const row = (over = {}) => Object.assign(['Nadomeščanje', '20. 10. 2026', 'Ana Novak', 'ana@example.com', 'Ponedeljek, Ilirija, 20:00, nadaljevalna', 'Torek, Ilirija, 21:00, nadaljevalna', 'Katarina', '', ''], over);

test('labels map Sanity venue names to roster group keys', () => {
  assert.equal(groupKey('Ponedeljek, Fakulteta za šport, 07:00, začetna').key, '2026-27|1|DIF|07:00');
  assert.equal(groupKey('Četrtek, Vevče, 20:00, nadaljevalna').key, '2026-27|4|Vevče|20:00');
  assert.equal(groupKey('Priložnostni obisk (brez redne skupine)'), null);
  assert.equal(groupKey('Sobota, Tivoli, 10:00, začetna'), null);
  assert.equal(isoDate('31. 11. 2026'), null);
  assert.equal(isoDate('3.11.2026').iso, '2026-11-03');
});

test('only complete makeup rows become items; absences and open offers are skipped', () => {
  const { payload, rows, report } = parseMakeups([header,
    row(),
    ['Izostanek', '19. 10. 2026', 'Ana Novak', 'ana@example.com', 'Ponedeljek, Ilirija, 20:00, nadaljevalna', '', '', '', ''],
    row({ 1: '', 5: '' }),
    row(),
  ], [ana], '2026-10-27T10:00:00.000Z');
  assert.deepEqual(payload.items, [{ member_key: ana.key, group_key: '2026-27|2|Ilirija|21:00', date: '2026-10-20' }]);
  assert.deepEqual(rows, [2]);
  assert.deepEqual(report, []);
  assert.equal(JSON.stringify(payload).includes('ana@'), false);
});

test('a differently written name matches by a unique email', () => {
  const { payload } = parseMakeups([header, row({ 2: 'Ana  NOVAK ml.' })], [ana], 'now');
  assert.equal(payload.items[0].member_key, ana.key);
});

test('unclear rows are reported by row number, never guessed', () => {
  const other = { key: memberKey('Ana Kos', 'ana@example.com'), email: 'ana@example.com' };
  const { payload, report } = parseMakeups([header,
    row({ 3: 'nobody@example.com' }),
    row({ 1: '21. 10. 2026' }),
    row({ 5: 'Torek, Atlantis, 21:00, nadaljevalna' }),
    row({ 5: 'Sobota, Tivoli, 10:00, začetna', 1: '24. 10. 2026' }),
    row({ 1: '20/10/2026' }),
    row({ 2: 'A. Novak' }),
  ], [ana, other], 'now');
  assert.equal(payload.items.length, 0);
  assert.deepEqual(report.map(r => [r.row, r.reason]), [[2, 'not_member'], [3, 'wrong_weekday'], [4, 'unknown_group'], [5, 'unknown_group'], [6, 'invalid_date'], [7, 'not_member']]);
});

test('a changed header stops the run', () => {
  assert.throws(() => parseMakeups([['Tip'], row()], [ana], 'now'), /headers changed/);
});

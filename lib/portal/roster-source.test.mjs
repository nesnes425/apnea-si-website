import assert from 'node:assert/strict';
import test from 'node:test';
import { parseRoster } from './roster-source.mjs';

const observedAt = '2026-10-15T10:00:00.000Z';

function source() {
  return [7, 7, 7, 6, 6].map((count, day) => [
    [], ['BAZEN', 'URA'],
    ...Array.from({ length: count }, (_, index) => [
      'Tivoli', `${String(index + 7).padStart(2, '0')}:00 - ${String(index + 8).padStart(2, '0')}:00`,
      '', 'začetna', '1', `Test Member ${day}-${index}`, `test-${day}-${index}@example.com`,
    ]),
  ]);
}

test('unnamed email and note rows do not block valid members or later groups', () => {
  const rows = source();
  const expected = parseRoster(rows, observedAt);
  rows[2].splice(3, 0,
    ['', '', '', '', '2', '', 'unnamed@example.com'],
    ['', '', '', '', '3', ' \t ', 'november - marec'],
    ['', '', '', '', '4', '', ''],
  );
  assert.deepEqual(parseRoster(rows, observedAt), expected);
});

test('a group starting with an unnamed member remains present, including when empty', () => {
  const rows = source();
  rows[0][2][5] = '';
  const roster = parseRoster(rows, observedAt);
  assert.equal(roster.groups.length, 33);
  assert.equal(roster.groups[0].key, '2026-27|1|Tivoli|07:00');
  assert.equal(roster.groups[0].level, 'beginner');
  assert.deepEqual(roster.groups[0].members, []);
  assert.equal(roster.groups[1].members.length, 1);

  rows[0].splice(3, 0, ['', '', '', '', '2', 'Later Member', 'later@example.com']);
  const withMember = parseRoster(rows, observedAt);
  assert.equal(withMember.groups[0].members[0].name, 'Later Member');
  assert.equal(withMember.groups[1].members.length, 1);
});

test('named members still require a valid email and unique identity', () => {
  for (const email of ['', 'invalid']) {
    const rows = source();
    rows[0][2][6] = email;
    assert.throws(() => parseRoster(rows, observedAt), /Member identity requires review/);
  }
  const rows = source();
  rows[0].splice(3, 0, ['', '', '', '', '2', rows[0][2][5], rows[0][2][6]]);
  assert.throws(() => parseRoster(rows, observedAt), /Duplicate member/);
});

test('unnamed entries do not bypass source header or group-layout validation', () => {
  const rows = source();
  rows[0][2][5] = '';
  rows[0][2][1] = 'bad time';
  assert.throws(() => parseRoster(rows, observedAt), /Unknown time/);
  const missingGroup = source();
  missingGroup[0].pop();
  assert.throws(() => parseRoster(missingGroup, observedAt), /Group layout changed/);
});

import assert from "node:assert/strict";
import { describe, test } from "node:test";
import { normalizePhoneForBrevo } from "./phone";

describe("normalizePhoneForBrevo", () => {
  test("converts Slovenian national numbers", () => {
    assert.equal(normalizePhoneForBrevo("040727825"), "+38640727825");
    assert.equal(normalizePhoneForBrevo("041 618 274"), "+38641618274");
    assert.equal(normalizePhoneForBrevo("(0)31-344-862"), "+38631344862");
    assert.equal(normalizePhoneForBrevo("51358339"), "+38651358339");
  });

  test("keeps numbers that are already international", () => {
    assert.equal(normalizePhoneForBrevo("+38641755150"), "+38641755150");
    assert.equal(normalizePhoneForBrevo("00 386 40 345 437"), "+38640345437");
    assert.equal(normalizePhoneForBrevo("0038631879155"), "+38631879155");
    assert.equal(normalizePhoneForBrevo("386 40 123 456"), "+38640123456");
  });

  test("drops the national trunk zero after the country code", () => {
    assert.equal(normalizePhoneForBrevo("+386 040 727 825"), "+38640727825");
    assert.equal(normalizePhoneForBrevo("00386 040 727 825"), "+38640727825");
    assert.equal(normalizePhoneForBrevo("386 041 618 274"), "+38641618274");
    assert.equal(normalizePhoneForBrevo("+386 (0)41 618 274"), "+38641618274");
  });

  test("keeps foreign numbers untouched apart from formatting", () => {
    assert.equal(normalizePhoneForBrevo("+31 6 12345678"), "+31612345678");
    assert.equal(normalizePhoneForBrevo("0043 664 1234567"), "+436641234567");
  });

  test("returns null for anything unusable", () => {
    assert.equal(normalizePhoneForBrevo(""), null);
    assert.equal(normalizePhoneForBrevo("   "), null);
    assert.equal(normalizePhoneForBrevo("040"), null);
    assert.equal(normalizePhoneForBrevo("+3864072782512345678"), null);
    assert.equal(normalizePhoneForBrevo("ne vem"), null);
    assert.equal(normalizePhoneForBrevo("040727825 (+386)"), null);
    assert.equal(normalizePhoneForBrevo("041 618 274 / +386 31 344 862"), null);
    assert.equal(normalizePhoneForBrevo("+0038640727825"), null);
    assert.equal(normalizePhoneForBrevo("00000040727825"), null);
  });
});

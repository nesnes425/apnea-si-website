#!/usr/bin/env python3
"""Read-only camt.053 v02/v08 adapter. No network, no bank credentials, no writes.

Reject payment instruction files (pain.001), entities and unknown structures.
Stable bank IDs and structured creditor references are required for auto matching.
"""
import datetime
import hashlib
import json
import re
import sys
import xml.etree.ElementTree as ET
from decimal import Decimal, InvalidOperation
from pathlib import Path


def parse_statement(raw):
    if len(raw) > 8_000_000:
        raise ValueError("Statement exceeds 8 MB")
    # Decode before checking declarations: raw-byte scanning misses UTF-16 DTDs.
    decoded = raw.decode("utf-8-sig")
    if "\x00" in decoded or "<!DOCTYPE" in decoded.upper() or "<!ENTITY" in decoded.upper():
        raise ValueError("DTD/entities are not allowed")
    root = ET.fromstring(decoded)
    match = re.fullmatch(r"\{urn:iso:std:iso:20022:tech:xsd:(camt\.053\.001\.(?:02|08))\}Document", root.tag)
    if not match:
        raise ValueError("Expected camt.053.001.02 or .08 bank statement, not a payment order")
    ns = root.tag[1:].split("}")[0]
    def path(p): return "/".join("{" + ns + "}" + part for part in p.split("/"))
    def node(parent, p): return parent.find(path(p))
    def nodes(parent, p): return parent.findall(path(p))
    def text(parent, p, default=""):
        n = node(parent, p)
        return (n.text or "").strip() if n is not None else default
    def amount(n):
        if n is None: raise ValueError("Missing amount")
        try: d = Decimal(n.text or "")
        except InvalidOperation: raise ValueError("Invalid amount")
        if not d.is_finite() or d < 0 or d * 100 != (d * 100).to_integral_value(): raise ValueError("Invalid cent precision")
        return int(d * 100), n.attrib.get("Ccy", "")
    statements = nodes(root, "BkToCstmrStmt/Stmt")
    if not statements: raise ValueError("Statement has no account statements")
    entries = []
    for statement in statements:
        account = re.sub(r"\s", "", text(statement, "Acct/Id/IBAN")).upper()
        if not account: raise ValueError("Statement account IBAN missing")
        for entry in nodes(statement, "Ntry"):
            total, currency = amount(node(entry, "Amt"))
            status = text(entry, "Sts/Cd") or text(entry, "Sts")
            booked = text(entry, "BookgDt/Dt") or text(entry, "BookgDt/DtTm")[:10]
            datetime.date.fromisoformat(booked)
            direction = text(entry, "CdtDbtInd")
            if direction not in ("CRDT", "DBIT"): raise ValueError("Missing credit/debit direction")
            reversal_text = text(entry, "RvslInd", "false").lower()
            if reversal_text not in ("true", "false", "0", "1"): raise ValueError("Invalid reversal flag")
            reversal = reversal_text in ("true", "1")
            details = nodes(entry, "NtryDtls/TxDtls")
            if not details: details = [entry]
            for detail in details:
                issues = []
                bank_id = text(detail, "Refs/AcctSvcrRef")
                if not bank_id and len(details) == 1: bank_id = text(entry, "AcctSvcrRef")
                refs = nodes(detail, "RmtInf/Strd/CdtrRefInf/Ref")
                references = list(dict.fromkeys(re.sub(r"\s", "", r.text or "").upper() for r in refs if r.text))
                reference = references[0] if len(references) == 1 else ""
                if len(references) != 1: issues.append("missing_or_ambiguous_structured_reference")
                n = node(detail, "AmtDtls/TxAmt/Amt")
                if n is None: n = node(detail, "Amt")
                if n is not None:
                    cents, ccy = amount(n)
                    if len(details) == 1 and (cents != total or ccy != currency): issues.append("entry_detail_amount_mismatch")
                elif len(details) == 1: cents, ccy = total, currency
                else:
                    cents, ccy = 0, currency
                    issues.append("grouped_entry_missing_transaction_amount")
                if len(details) > 1: issues.append("grouped_entry_requires_review")
                tx_direction = text(detail, "CdtDbtInd") or direction
                if tx_direction != direction: issues.append("direction_mismatch")
                item = dict(account=account, bankId=bank_id, reference=reference, amountCents=cents,
                            currency=ccy, direction=direction, status=status, reversal=reversal, bookedOn=booked)
                if issues: item["issue"] = ";".join(issues)
                entries.append(item)
    if len(entries) > 2000: raise ValueError("Too many entries; split statement files")
    return dict(fileHash=hashlib.sha256(raw).hexdigest(), format=match[1], entries=entries)


if __name__ == "__main__":
    try:
        if len(sys.argv) != 2: raise ValueError("Use parse-bank-statement.py <statement.xml>")
        print(json.dumps(parse_statement(Path(sys.argv[1]).read_bytes()), ensure_ascii=False))
    except Exception as error:
        print(str(error), file=sys.stderr)
        sys.exit(1)

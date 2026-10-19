import importlib.util
import unittest
from pathlib import Path
spec = importlib.util.spec_from_file_location('parser', Path(__file__).with_name('parse-bank-statement.py'))
parser = importlib.util.module_from_spec(spec)
spec.loader.exec_module(parser)

def xml(version='08', amount='585.00', extra='', ref='RF941234', status=None):
    status = status or ('<Cd>BOOK</Cd>' if version == '08' else 'BOOK')
    return f'''<Document xmlns="urn:iso:std:iso:20022:tech:xsd:camt.053.001.{version}"><BkToCstmrStmt><Stmt><Acct><Id><IBAN>SI56040000277781751</IBAN></Id></Acct><Ntry><Amt Ccy="EUR">{amount}</Amt><CdtDbtInd>CRDT</CdtDbtInd><Sts>{status}</Sts><BookgDt><Dt>2026-10-19</Dt></BookgDt><AcctSvcrRef>bank-1</AcctSvcrRef>{extra}<NtryDtls><TxDtls><RmtInf><Strd><CdtrRefInf><Ref>{ref}</Ref></CdtrRefInf></Strd></RmtInf></TxDtls></NtryDtls></Ntry></Stmt></BkToCstmrStmt></Document>'''.encode()
class BankParser(unittest.TestCase):
    def test_versions_and_exact_cents(self):
        for v in ['02','08']:
            e=parser.parse_statement(xml(v))['entries'][0]
            self.assertEqual((e['amountCents'], e['status'],e['bankId']),(58500,'BOOK','bank-1'))
    def test_orders_unknown_format_and_entities(self):
        for raw in [b'<Document/>',xml().replace(b'camt.053',b'pain.001'),b'<!DOCTYPE x [<!ENTITY a "boom">]>'+xml(),xml().decode().encode('utf-16'),b'<x>']:
            with self.assertRaises(Exception): parser.parse_statement(raw)
    def test_precision(self):
        for a in ['1.001','NaN','-1','Infinity']:
            with self.assertRaises(ValueError): parser.parse_statement(xml(amount=a))
    def test_reversal_preserved_and_missing_reference_review(self):
        self.assertTrue(parser.parse_statement(xml(extra='<RvslInd>true</RvslInd>'))['entries'][0]['reversal'])
        self.assertIn('issue',parser.parse_statement(xml(ref=''))['entries'][0])
    def test_grouped_transaction_requires_review(self):
        raw=xml().replace(b'</NtryDtls>',b'<TxDtls><Refs><AcctSvcrRef>bank-2</AcctSvcrRef></Refs></TxDtls></NtryDtls>')
        entries=parser.parse_statement(raw)['entries']
        self.assertEqual(len(entries),2)
        self.assertTrue(all('grouped_entry' in e['issue'] for e in entries))
if __name__ == '__main__': unittest.main()

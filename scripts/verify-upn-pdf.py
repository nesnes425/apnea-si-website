"""Independent QR acceptance after: node --import tsx scripts/test-upn-pdf.mjs.
Requires pypdfium2 and zxing-cpp. Local synthetic PDFs only; no bank connection.
"""
from pathlib import Path
import pypdfium2 as pdfium
import zxingcpp
for name in ["synthetic-payment", "sample"]:
    base = Path("temp/qr-tests") / name
    doc = pdfium.PdfDocument(str(base.with_suffix(".pdf")))
    assert len(doc) == 1, "Unexpected PDF pagination"
    image = doc[0].render(scale=3).to_pil()
    codes = zxingcpp.read_barcodes(image)
    assert len(codes) == 1, "Expected one readable QR"
    expected = base.with_suffix(".txt").read_text()
    assert codes[0].text == expected, "Decoded QR differs from approved fields"
    if name == "synthetic-payment":
        f = codes[0].text.split("\n")
        assert len(f) == 21 and f[8] == "00000058500" and f[13] == "31.10.2026"
        assert f[5] == "Žiga Ščuk Čopić" and f[14] == "SI56040000277781751"
        assert int(f[19]) == len(("\n".join(f[:19])+"\n").encode("iso-8859-2"))
    else:
        assert not codes[0].text.startswith("UPNQR")
    print(name + ": independently decoded PDF QR matches every field")

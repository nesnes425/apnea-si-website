# QR encoder

`qrcodegen.ts` is Project Nayuki's MIT-licensed QR Code generator v1.8.0.
Source: https://github.com/nayuki/QR-Code-generator/blob/v1.8.0/typescript-javascript/qrcodegen.ts
Upstream SHA-256: `c4749095a91bf9696e3a303998b9905e467094f53041e64393e65e6d887737fd`.
Local changes: export the namespaces for module imports, strip trailing whitespace, and
disable lint for the vendored file. The upstream license is retained. No runtime download/dependency.
UPN uses its byte + ECI segments, fixed version 15 and medium error correction.

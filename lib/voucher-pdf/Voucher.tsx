/* eslint-disable @next/next/no-img-element */
import { Document, Page, Text, View, StyleSheet, pdf } from "@react-pdf/renderer";

// Brand-aligned placeholder design — clean, on-brand, prints OK.
// To redesign later: replace this component with a layout matching the new
// physical voucher; the API (data shape, code, validity) doesn't need to change.

const styles = StyleSheet.create({
  page: {
    backgroundColor: "#181E25", // navy-dark
    color: "#ffffff",
    padding: 56,
    fontFamily: "Helvetica",
  },
  brandRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 48,
  },
  brand: {
    fontSize: 14,
    color: "#d3a356",
    letterSpacing: 4,
    textTransform: "uppercase",
    fontFamily: "Helvetica-Bold",
  },
  meta: {
    fontSize: 10,
    color: "#8a8377",
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  overline: {
    fontSize: 11,
    color: "#d3a356",
    letterSpacing: 3,
    textTransform: "uppercase",
    marginBottom: 14,
    fontFamily: "Helvetica-Bold",
  },
  title: {
    fontSize: 38,
    fontFamily: "Helvetica-Bold",
    lineHeight: 1.1,
    marginBottom: 24,
  },
  recipient: {
    fontSize: 14,
    color: "#ffffff",
    marginBottom: 6,
  },
  recipientName: {
    fontSize: 26,
    fontFamily: "Helvetica-Bold",
    color: "#d3a356",
    marginBottom: 38,
  },
  message: {
    fontSize: 12,
    color: "#ffffff",
    fontStyle: "italic",
    borderLeft: "2pt solid #d3a356",
    paddingLeft: 14,
    marginBottom: 38,
    lineHeight: 1.5,
  },
  divider: {
    borderTop: "1pt solid rgba(255,255,255,0.15)",
    marginVertical: 28,
  },
  codeBlock: {
    backgroundColor: "rgba(211, 163, 86, 0.12)",
    border: "1pt solid #d3a356",
    padding: 18,
    marginBottom: 28,
  },
  codeLabel: {
    fontSize: 10,
    color: "#d3a356",
    letterSpacing: 2,
    textTransform: "uppercase",
    marginBottom: 6,
  },
  codeValue: {
    fontSize: 28,
    fontFamily: "Courier-Bold",
    letterSpacing: 4,
    color: "#ffffff",
  },
  body: {
    fontSize: 11,
    color: "rgba(255,255,255,0.75)",
    lineHeight: 1.6,
    marginBottom: 8,
  },
  footer: {
    position: "absolute",
    bottom: 40,
    left: 56,
    right: 56,
    fontSize: 9,
    color: "rgba(255,255,255,0.4)",
    textAlign: "center",
  },
});

const slMonths = [
  "januar",
  "februar",
  "marec",
  "april",
  "maj",
  "junij",
  "julij",
  "avgust",
  "september",
  "oktober",
  "november",
  "december",
];

function formatSlDate(d: Date): string {
  return `${d.getDate()}. ${slMonths[d.getMonth()]} ${d.getFullYear()}`;
}

export type VoucherProps = {
  voucherCode: string;
  recipientName: string;
  buyerName: string;
  message?: string;
  courseName: string;
  validUntil: Date;
  purchaseDate: Date;
};

export function VoucherDocument(props: VoucherProps) {
  return (
    <Document
      title={`Darilni bon — ${props.recipientName}`}
      author="Apnea Slovenija"
      subject={`${props.courseName} — darilni bon`}
    >
      <Page size="A5" orientation="landscape" style={styles.page}>
        <View style={styles.brandRow}>
          <Text style={styles.brand}>APNEA SLOVENIJA</Text>
          <Text style={styles.meta}>{formatSlDate(props.purchaseDate)}</Text>
        </View>

        <Text style={styles.overline}>Darilni bon</Text>
        <Text style={styles.title}>{props.courseName}</Text>

        <Text style={styles.recipient}>Za:</Text>
        <Text style={styles.recipientName}>{props.recipientName}</Text>

        {props.message ? <Text style={styles.message}>&ldquo;{props.message}&rdquo;</Text> : null}

        <View style={styles.codeBlock}>
          <Text style={styles.codeLabel}>Koda bona</Text>
          <Text style={styles.codeValue}>{props.voucherCode}</Text>
        </View>

        <Text style={styles.body}>
          Bon velja do {formatSlDate(props.validUntil)}.
        </Text>
        <Text style={styles.body}>
          Za rezervacijo termina pišite na info@apnea.si in navedite kodo bona.
        </Text>
        <Text style={styles.body}>Podarja: {props.buyerName}</Text>

        <Text style={styles.footer}>
          Apnea Slovenija · info@apnea.si · apnea.si
        </Text>
      </Page>
    </Document>
  );
}

export async function renderVoucherPdfBase64(props: VoucherProps): Promise<string> {
  const blob = await pdf(<VoucherDocument {...props} />).toBlob();
  const buffer = Buffer.from(await blob.arrayBuffer());
  return buffer.toString("base64");
}

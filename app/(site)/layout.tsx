import type { Metadata } from "next";
import { Lora, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { CookieConsent } from "@/components/blocks/CookieConsent";
import "../globals.css";

const lora = Lora({
  variable: "--font-lora",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

const roboto = Roboto({
  variable: "--font-roboto",
  subsets: ["latin", "latin-ext"],
  display: "swap",
});

export const metadata: Metadata = {
  title: {
    default: "Apnea Slovenija — Šola prostega potapljanja",
    template: "%s | Apnea Slovenija",
  },
  description:
    "Največja šola prostega potapljanja v Sloveniji. SSI tečaji, treningi in klubsko potapljanje na 5 lokacijah. 2000+ potapljačev, 245+ Google ocen (5.0 ★).",
  metadataBase: new URL("https://www.apnea.si"),
  openGraph: {
    title: "Apnea Slovenija — Šola prostega potapljanja",
    description:
      "SSI tečaji, celoletni treningi in klubsko prosto potapljanje v Sloveniji z ekipo Apnea Slovenija.",
    url: "https://www.apnea.si",
    type: "website",
    locale: "sl_SI",
    siteName: "Apnea Slovenija",
    images: [
      {
        url: "/images/og-default.jpg",
        width: 1200,
        height: 630,
        alt: "Apnea Slovenija - tečaji in treningi prostega potapljanja",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Apnea Slovenija — Šola prostega potapljanja",
    description:
      "SSI tečaji, celoletni treningi in klubsko prosto potapljanje v Sloveniji z ekipo Apnea Slovenija.",
    images: ["/images/og-default.jpg"],
  },
};

export default function SiteLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl" className={cn(lora.variable, roboto.variable)}>
      <body className="min-h-screen flex flex-col antialiased">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
        <CookieConsent />
      </body>
    </html>
  );
}

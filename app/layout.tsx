import type { Metadata } from "next";
import { Lora, Roboto } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

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
  metadataBase: new URL("https://apnea.si"),
  openGraph: {
    type: "website",
    locale: "sl_SI",
    siteName: "Apnea Slovenija",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="sl" className={cn(lora.variable, roboto.variable)}>
      <body className="min-h-screen flex flex-col antialiased">
        {children}
      </body>
    </html>
  );
}

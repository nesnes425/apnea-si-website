import type { Metadata } from "next";
import "../globals.css";
import "./portal.css";
export const metadata: Metadata = {
  title: "Trenerji | Apnea.si",
  robots: { index: false, follow: false },
};
export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body className="portal-body">{children}</body>
    </html>
  );
}

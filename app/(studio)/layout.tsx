export const metadata = {
  title: "Sanity Studio | Apnea Slovenija",
};

export default function StudioLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="sl">
      <body style={{ margin: 0 }}>{children}</body>
    </html>
  );
}

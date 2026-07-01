import { BookingPage } from "../../_components/BookingPage";

export const metadata = {
  title: "Prijava — Nadaljevalni tečaj prostega potapljanja",
  description: "Pošljite prijavo za nadaljevalni tečaj prostega potapljanja.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ instanceId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { instanceId } = await searchParams;
  return <BookingPage courseType="nadaljevalni" instanceId={instanceId} />;
}

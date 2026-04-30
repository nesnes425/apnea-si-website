import { BookingPage } from "../../_components/BookingPage";

export const metadata = {
  title: "Prijava — Master tečaj prostega potapljanja",
  description: "Rezervirajte mesto na master tečaju prostega potapljanja.",
  robots: { index: false, follow: false },
};

type Props = {
  searchParams: Promise<{ instanceId?: string }>;
};

export default async function Page({ searchParams }: Props) {
  const { instanceId } = await searchParams;
  return <BookingPage courseType="master" instanceId={instanceId} />;
}

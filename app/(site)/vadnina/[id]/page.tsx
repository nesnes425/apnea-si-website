import { notFound, redirect } from "next/navigation";
import { z } from "zod";
import { getPlan, claimPlan, releasePlan } from "@/lib/tuition/store";
import { tuitionCheckout } from "@/lib/tuition/stripe";
import { paymentConsentText, displayDate, euro } from "@/lib/tuition/plan";
import { Button } from "@/components/ui/button";
import { siteConfig } from "@/lib/config";
export const dynamic = "force-dynamic";
export const metadata = {
  title: "Plačilo vadnine",
  robots: { index: false, follow: false },
  referrer: "no-referrer" as const,
};

export default async function TuitionPaymentPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string; received?: string }>;
}) {
  const { id } = await params;
  if (!z.uuid().safeParse(id).success || process.env.TUITION_ENABLED !== "true")
    notFound();
  const record = await getPlan(id);
  if (!record) notFound();
  const p = record.manifest;
  const query = await searchParams;
  // This dynamic server response must evaluate expiry at request time.
  // eslint-disable-next-line react-hooks/purity
  const closed = record.cancelled_at || Date.parse(p.firstPaymentDeadline) < Date.now();
  async function pay() {
    "use server";
    let url: string | null = null;
    const plan = await claimPlan(id);
    try {
      url = await tuitionCheckout(plan);
    } catch {
      url = `/vadnina/${id}?error=1`;
    } finally {
      await releasePlan(plan);
    }
    redirect(url ?? `/vadnina/${id}?received=1`);
  }
  return (
    <main className="min-h-screen bg-surface py-16 md:py-24">
      <div className="mx-auto max-w-2xl px-6">
        <div className="border border-border-custom bg-white p-8 md:p-12">
          <p className="mb-3 text-sm text-muted-text">
            Športno društvo Apnea Slovenija
            {p.mode === "test" ? " · PREIZKUSNO PLAČILO" : ""}
          </p>
          <h1 className="mb-5 text-3xl font-bold text-navy">Plačilo vadnine</h1>
          <p className="mb-5 text-body">Udeleženec: {p.participant}</p>
          <p className="mb-5 text-body">{p.description}</p>
          <p className="mb-5 text-body">
            Obdobje vadbe: {displayDate(p.first.serviceFrom)}–
            {displayDate(p.first.serviceTo)}. Rok prvega plačila:{" "}
            {displayDate(p.firstPaymentDeadline)}.
          </p>
          {record.first_payment_id ? (
            <p className="text-body">
              Plačilo smo prejeli. Račun boste prejeli po e-pošti.{" "}
              {record.cancelled_at && !record.cancellation_confirmed
                ? "Vašo odpoved še urejamo."
                : p.second && !record.cancelled_at
                  ? `Dogovorjeni datum drugega obroka: ${displayDate(p.second.chargeAt)}.`
                  : "Nadaljnjih samodejnih plačil ni."}
            </p>
          ) : !closed &&
            record.first_payment_flow === "stripe_invoice" &&
            record.invitation_state !== "submitted" ? (
            <p className="text-body">
              Plačilni poziv še pripravljamo. Ko bo pripravljen, boste prejeli
              sporočilo iz Stripa.
            </p>
          ) : closed ? (
            <p className="text-body">
              Ta povezava za plačilo ni več aktivna. Za dogovor se obrnite na
              društvo.
            </p>
          ) : (
            <>
              <p className="mb-5 text-2xl font-bold text-navy">
                Zdaj: {euro(p.first.amountCents)}
              </p>
              {p.agreementNoticeVersion && (
                <p className="mb-6 text-body">
                  {siteConfig.tuitionAgreement2026.acceptanceText}.{" "}
                  <a
                    href={siteConfig.tuitionAgreement2026.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gold underline"
                  >
                    Preberite dogovor
                  </a>
                </p>
              )}
              <p className="mb-6 text-body">{paymentConsentText(p)}</p>
              {query.received && (
                <p className="mb-5 text-body">
                  Potrditev plačila se še obdeluje. Če ste že plačali, ne
                  plačujte ponovno. Osvežite stran čez nekaj trenutkov.
                </p>
              )}
              {query.error && (
                <p role="alert" className="mb-5 text-body">
                  Plačila trenutno ni mogoče odpreti. Poskusite znova ali se
                  obrnite na društvo.
                </p>
              )}
              {!query.received && (
                <form action={pay}>
                  <Button type="submit">Nadaljujte na varno plačilo</Button>
                </form>
              )}
            </>
          )}
        </div>
      </div>
    </main>
  );
}

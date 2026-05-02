import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Section } from "@/components/blocks/Section";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";

export const metadata = {
  title: "Prosto potapljanje",
  description:
    "Prosto potapljanje — kaj je in kako začeti. Spoznajte šport, kjer se z enim vdihom potopite v globino.",
};

export default function ProstoPotapljanjePage() {
  return (
    <Section>
      <Overline>Prosto potapljanje</Overline>
      <SectionHeading className="mb-8 max-w-2xl">
        Stran v pripravi
      </SectionHeading>
      <p className="text-[17px] text-body leading-[1.7] font-body max-w-2xl mb-10">
        Tukaj bo izčrpen vodnik po prostem potapljanju — kaj je, kako se ga
        začneš učiti, kaj se dogaja s telom pod vodo in kje v Sloveniji se
        potapljati. Stran še pripravljamo.
      </p>
      <p className="text-[17px] text-body leading-[1.7] font-body max-w-2xl mb-10">
        Če želite začeti že zdaj, je najboljši korak začetni tečaj.
      </p>
      <Button asChild>
        <Link href="/tecaji/zacetni">Začetni tečaj →</Link>
      </Button>
    </Section>
  );
}

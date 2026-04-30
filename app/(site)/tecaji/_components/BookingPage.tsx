import Link from "next/link";
import { notFound } from "next/navigation";
import { siteConfig, type CourseType } from "@/lib/config";
import { formatCourseDateRange } from "@/lib/utils";
import { getCourseInstance } from "@/lib/sanity/queries";
import { Overline } from "@/components/blocks/Overline";
import { SectionHeading } from "@/components/blocks/SectionHeading";
import { CheckList } from "@/components/blocks/CheckList";
import { BookingFlow } from "./BookingFlow";

type Props = {
  courseType: CourseType;
  instanceId: string | undefined;
};

export async function BookingPage({ courseType, instanceId }: Props) {
  if (!instanceId) {
    notFound();
  }

  const instance = await getCourseInstance(instanceId);
  if (!instance || instance.courseType !== courseType) {
    notFound();
  }

  const course = siteConfig.courses[courseType];
  const dateRange = formatCourseDateRange(instance.startDate, instance.endDate);

  return (
    <section className="bg-surface min-h-screen py-16 md:py-24">
      <div className="max-w-4xl mx-auto px-6">
        <Link
          href={`/tecaji/${course.slug}#termini`}
          className="text-sm text-gold hover:text-gold-hover transition-colors font-body inline-block mb-8"
        >
          ← Spremeni termin
        </Link>

        <Overline>Prijava na tečaj</Overline>
        <SectionHeading className="mb-10">{course.fullName}</SectionHeading>

        <div className="grid md:grid-cols-[1fr_320px] gap-12">
          <div>
            <BookingFlow
              instanceId={instance._id}
              courseLabel={course.name}
              dateRange={dateRange}
              location={instance.location}
              priceInEuros={course.price}
            />
          </div>

          <aside className="md:sticky md:top-24 self-start">
            <div className="bg-white p-8 border border-border-custom">
              <Overline>Vaš termin</Overline>
              <p className="text-[20px] font-semibold text-navy font-heading leading-tight mt-2 mb-1">
                {dateRange}
              </p>
              <p className="text-sm text-muted-text font-body mb-6">
                {instance.location} · Bazenski del
              </p>

              <p className="text-[40px] font-bold text-navy font-heading leading-none mb-1">
                €{course.price}
              </p>
              <p className="text-sm text-muted-text font-body mb-6">
                Vse vključeno. Brez skritih stroškov.
              </p>

              <CheckList items={[...course.booking.sidebarItems]} />

              <p className="mt-6 pt-6 border-t border-border-custom text-xs text-muted-text font-body leading-relaxed">
                Globinski del (morje) se izvaja maj–avgust. Termin izberete po
                zaključenem bazenskem delu.
              </p>
            </div>
          </aside>
        </div>
      </div>
    </section>
  );
}

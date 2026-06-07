"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import type { TrainingGroup } from "@/lib/sanity/types";

type Props = {
  groups: TrainingGroup[];
  applicationsOpen: boolean;
  membershipFee: number;
};

const weekdayLabels: Record<TrainingGroup["weekday"], string> = {
  ponedeljek: "Ponedeljek",
  torek: "Torek",
  sreda: "Sreda",
  cetrtek: "Četrtek",
  petek: "Petek",
};

const weekdayOrder: Record<TrainingGroup["weekday"], number> = {
  ponedeljek: 1,
  torek: 2,
  sreda: 3,
  cetrtek: 4,
  petek: 5,
};

function formatDate(date: string) {
  return new Intl.DateTimeFormat("sl-SI", {
    day: "numeric",
    month: "numeric",
    year: "numeric",
  }).format(new Date(date));
}

function formatEuro(amount: number) {
  return new Intl.NumberFormat("sl-SI", {
    minimumFractionDigits: Number.isInteger(amount) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function TrainingScheduleSelector({
  groups,
  applicationsOpen,
  membershipFee,
}: Props) {
  const cities = useMemo(
    () => [...new Set(groups.map((group) => group.venue.city))],
    [groups]
  );
  const [selectedCity, setSelectedCity] = useState(cities[0] ?? "");
  const venues = useMemo(() => {
    const unique = new Map<string, TrainingGroup["venue"]>();
    groups
      .filter((group) => group.venue.city === selectedCity)
      .forEach((group) => unique.set(group.venue._id, group.venue));
    return [...unique.values()].sort((a, b) => a.sortOrder - b.sortOrder);
  }, [groups, selectedCity]);
  const [selectedVenueByCity, setSelectedVenueByCity] = useState<Record<string, string>>({});
  const selectedVenue =
    venues.find((venue) => venue._id === selectedVenueByCity[selectedCity]) ?? venues[0];
  const selectedGroups = useMemo(
    () =>
      groups
        .filter((group) => group.venue._id === selectedVenue?._id)
        .sort(
          (a, b) =>
            weekdayOrder[a.weekday] - weekdayOrder[b.weekday] ||
            a.startTime.localeCompare(b.startTime) ||
            a.program.sortOrder - b.program.sortOrder
        ),
    [groups, selectedVenue]
  );
  const days = [...new Set(selectedGroups.map((group) => group.weekday))];

  if (!selectedVenue) return null;

  const pricing = selectedVenue.defaultPricing;
  const imageUrl = selectedVenue.image?.asset.url;

  return (
    <div>
      <div className="mb-12">
        <label htmlFor="training-city" className="mb-2 block text-sm font-medium text-navy md:hidden">
          Izberite mesto
        </label>
        <select
          id="training-city"
          value={selectedCity}
          onChange={(event) => setSelectedCity(event.target.value)}
          className="w-full border border-border-custom bg-white px-4 py-3 text-[16px] text-navy focus:border-gold focus:outline-none md:hidden"
        >
          {cities.map((city) => (
            <option key={city} value={city}>{city}</option>
          ))}
        </select>

        <div className="hidden flex-wrap gap-2 md:flex" aria-label="Izberite mesto">
          {cities.map((city) => (
            <button
              key={city}
              type="button"
              onClick={() => setSelectedCity(city)}
              className={`border px-5 py-3 text-[15px] font-medium transition-colors ${
                city === selectedCity
                  ? "border-gold bg-gold text-white"
                  : "border-border-custom bg-white text-navy hover:border-gold"
              }`}
            >
              {city}
            </button>
          ))}
        </div>
      </div>

      {venues.length > 1 && (
        <div className="mb-12">
          <p className="mb-4 text-sm font-medium uppercase tracking-[0.08em] text-gold">
            Bazeni v mestu {selectedCity}
          </p>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
            {venues.map((venue) => {
              const groupCount = groups.filter((group) => group.venue._id === venue._id).length;
              const selected = venue._id === selectedVenue._id;
              const groupCountLabel =
                groupCount === 1
                  ? "skupina"
                  : groupCount === 2
                    ? "skupini"
                    : groupCount < 5
                      ? "skupine"
                      : "skupin";
              return (
                <button
                  key={venue._id}
                  type="button"
                  onClick={() =>
                    setSelectedVenueByCity((current) => ({
                      ...current,
                      [selectedCity]: venue._id,
                    }))
                  }
                  className={`min-h-28 border p-4 text-left transition-colors ${
                    selected
                      ? "border-gold bg-gold-pale"
                      : "border-border-custom bg-white hover:border-gold"
                  }`}
                >
                  <span className="block text-[16px] font-semibold leading-tight text-navy">
                    {venue.name}
                  </span>
                  <span className="mt-2 block text-sm text-muted-text">
                    {groupCount} {groupCountLabel}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      <article className="mb-14 border border-border-custom bg-white">
        <div className="grid md:grid-cols-2">
          <div className="relative min-h-64 bg-surface md:min-h-full">
            <Image
              src={imageUrl ?? "/images/placeholder/tecaj-bazen-samo.png"}
              alt={selectedVenue.image?.alt ?? selectedVenue.name}
              fill
              sizes="(min-width: 768px) 50vw, 100vw"
              className="object-cover"
            />
          </div>
          <div className="p-6 md:p-9">
            <p className="mb-1 text-sm font-medium uppercase tracking-[0.08em] text-gold">
              {selectedVenue.city}
            </p>
            <h3 className="mb-4 text-[28px] font-semibold text-navy">{selectedVenue.name}</h3>
            <p className="mb-7 text-[15px] leading-[1.7] text-body">{selectedVenue.description}</p>

            <dl className="space-y-3 border-t border-border-custom pt-6 text-sm">
              <div className="flex justify-between gap-6">
                <dt className="text-muted-text">Sezona</dt>
                <dd className="text-right font-medium text-navy">
                  {formatDate(selectedVenue.defaultStartDate)}–{formatDate(selectedVenue.defaultEndDate)}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-text">Mesečna vadnina</dt>
                <dd className="text-right text-[22px] font-bold text-navy">
                  {formatEuro(pricing.monthlyDisplayPrice)} €/mesec
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-text">Plačilo vadnine</dt>
                <dd className="text-right font-medium text-navy">
                  {pricing.secondInstallmentAmount > 0
                    ? `${formatEuro(pricing.firstInstallmentAmount)} € + ${formatEuro(pricing.secondInstallmentAmount)} €`
                    : `${formatEuro(pricing.firstInstallmentAmount)} € enkratno`}
                </dd>
              </div>
              <div className="flex justify-between gap-6">
                <dt className="text-muted-text">Ob prijavi</dt>
                <dd className="text-right font-medium text-navy">
                  {membershipFee} € letna članarina
                </dd>
              </div>
            </dl>
          </div>
        </div>
      </article>

      <div>
        <p className="mb-2 text-sm font-medium uppercase tracking-[0.08em] text-gold">
          Urnik
        </p>
        <h3 className="mb-8 text-[28px] font-semibold text-navy">Izberite skupino</h3>

        <div className="space-y-10">
          {days.map((day) => (
            <section key={day}>
              <h4 className="mb-3 border-b border-border-custom pb-3 text-[18px] font-semibold text-navy">
                {weekdayLabels[day]}
              </h4>
              <div className="space-y-3">
                {selectedGroups.filter((group) => group.weekday === day).map((group) => {
                  const monthlyPrice =
                    group.pricingOverride?.monthlyDisplayPrice ?? pricing.monthlyDisplayPrice;
                  return (
                    <article
                      key={group._id}
                      className="grid gap-4 border border-border-custom bg-white p-5 sm:grid-cols-[130px_1fr_auto] sm:items-center"
                    >
                      <div>
                        <p className="text-[17px] font-semibold text-navy">
                          {group.startTime}–{group.endTime}
                        </p>
                        {group.pricingOverride?.monthlyDisplayPrice != null && (
                          <p className="text-sm text-muted-text">{formatEuro(monthlyPrice)} €/mesec</p>
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-navy">{group.program.name}</p>
                        <p className={`mt-1 text-sm font-medium ${group.isFull ? "text-muted-text" : "text-gold"}`}>
                          {group.isFull ? "Polno" : `${group.availableSpots} prostih mest`}
                        </p>
                      </div>
                      {applicationsOpen && !group.isFull ? (
                        <Button asChild size="sm" fullWidth>
                          <Link href={`/treningi/prijava?groupId=${group._id}`}>Prijava</Link>
                        </Button>
                      ) : !group.isFull ? (
                        <span className="text-sm text-muted-text">Prijave zaprte</span>
                      ) : null}
                    </article>
                  );
                })}
              </div>
            </section>
          ))}
        </div>

        <p className="mt-8 text-sm leading-relaxed text-muted-text">
          Če se želite pridružiti skupini, ki je trenutno že polna, nam pišite na{" "}
          <a href="mailto:info@apnea.si" className="font-medium text-gold hover:text-gold-hover">
            info@apnea.si
          </a>
          .
        </p>
      </div>
    </div>
  );
}

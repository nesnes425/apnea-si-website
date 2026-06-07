import { defineArrayMember, defineField, defineType } from "sanity";

const pricingOverrideFields = [
  defineField({ name: "monthlyDisplayPrice", title: "Mesečna prikazana cena (€)", type: "number" }),
  defineField({ name: "firstInstallmentAmount", title: "Prvi obrok (€)", type: "number" }),
  defineField({ name: "secondInstallmentAmount", title: "Drugi obrok (€)", type: "number" }),
  defineField({ name: "fullPaymentAmountOverride", title: "Enkratno plačilo (€)", type: "number" }),
];

export const trainingGroup = defineType({
  name: "trainingGroup",
  title: "Trening — skupina",
  type: "document",
  fields: [
    defineField({
      name: "venue",
      title: "Lokacija",
      type: "reference",
      to: [{ type: "trainingVenue" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "program",
      title: "Program",
      type: "reference",
      to: [{ type: "trainingProgram" }],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "weekday",
      title: "Dan",
      type: "string",
      options: {
        list: [
          { title: "Ponedeljek", value: "ponedeljek" },
          { title: "Torek", value: "torek" },
          { title: "Sreda", value: "sreda" },
          { title: "Četrtek", value: "cetrtek" },
          { title: "Petek", value: "petek" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startTime",
      title: "Začetek",
      type: "string",
      description: "Primer: 20:00",
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    }),
    defineField({
      name: "endTime",
      title: "Konec",
      type: "string",
      description: "Primer: 21:00",
      validation: (Rule) => Rule.required().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
    }),
    defineField({
      name: "capacity",
      title: "Število mest",
      type: "number",
      initialValue: 8,
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "confirmedSpots",
      title: "Potrjena mesta (samodejno)",
      type: "number",
      initialValue: 0,
      readOnly: true,
      validation: (Rule) => Rule.required().integer().min(0),
    }),
    defineField({
      name: "holds",
      title: "Začasne rezervacije (samodejno)",
      type: "array",
      readOnly: true,
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({ name: "tokenHash", title: "Zgoščena vrednost žetona", type: "string" }),
            defineField({ name: "expiresAt", title: "Velja do", type: "datetime" }),
            defineField({ name: "paymentIntentId", title: "Stripe PaymentIntent", type: "string" }),
          ],
          preview: {
            select: { title: "token", subtitle: "expiresAt" },
          },
        }),
      ],
    }),
    defineField({
      name: "startDateOverride",
      title: "Drugačen začetek",
      type: "date",
    }),
    defineField({
      name: "endDateOverride",
      title: "Drugačen zaključek",
      type: "date",
    }),
    defineField({
      name: "pricingOverride",
      title: "Drugačne cene",
      type: "object",
      fields: pricingOverrideFields,
    }),
    defineField({
      name: "trainerName",
      title: "Trener",
      type: "string",
    }),
    defineField({
      name: "notes",
      title: "Opombe",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "brevoListId",
      title: "Brevo seznam skupine (samodejno)",
      type: "number",
      readOnly: true,
    }),
    defineField({
      name: "confirmedPaymentIntentIds",
      title: "Potrjena Stripe plačila (samodejno)",
      type: "array",
      readOnly: true,
      of: [{ type: "string" }],
      initialValue: [],
    }),
    defineField({
      name: "active",
      title: "Aktivna skupina",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: {
      venue: "venue.name",
      program: "program.name",
      weekday: "weekday",
      startTime: "startTime",
      capacity: "capacity",
      confirmed: "confirmedSpots",
    },
    prepare({ venue, program, weekday, startTime, capacity, confirmed }) {
      return {
        title: `${venue ?? "Lokacija"} — ${program ?? "Program"}`,
        subtitle: `${weekday ?? ""} ${startTime ?? ""} · ${confirmed ?? 0}/${capacity ?? 0}`,
      };
    },
  },
});

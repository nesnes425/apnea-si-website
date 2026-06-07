import { defineField, defineType } from "sanity";

const pricingFields = [
  defineField({
    name: "monthlyDisplayPrice",
    title: "Mesečna prikazana cena (€)",
    type: "number",
    validation: (Rule) => Rule.required().min(0),
  }),
  defineField({
    name: "firstInstallmentAmount",
    title: "Prvi obrok (€)",
    type: "number",
    validation: (Rule) => Rule.required().min(0),
  }),
  defineField({
    name: "secondInstallmentAmount",
    title: "Drugi obrok (€)",
    type: "number",
    validation: (Rule) => Rule.required().min(0),
  }),
  defineField({
    name: "fullPaymentAmountOverride",
    title: "Enkratno plačilo (€) — samo če ni vsota obrokov",
    type: "number",
    validation: (Rule) => Rule.min(0),
  }),
];

export const trainingVenue = defineType({
  name: "trainingVenue",
  title: "Trening — lokacija",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Naziv bazena",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "city",
      title: "Kraj",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "Oznaka",
      type: "slug",
      options: { source: "name", maxLength: 64 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Opis",
      type: "text",
      rows: 5,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "address",
      title: "Naslov",
      type: "string",
    }),
    defineField({
      name: "image",
      title: "Slika",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({ name: "alt", title: "Alt besedilo", type: "string" }),
      ],
    }),
    defineField({
      name: "defaultStartDate",
      title: "Privzeti začetek",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "defaultEndDate",
      title: "Privzeti zaključek",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "defaultPricing",
      title: "Privzete cene",
      type: "object",
      fields: pricingFields,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "sortOrder",
      title: "Vrstni red",
      type: "number",
      initialValue: 10,
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "active",
      title: "Aktivna lokacija",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", city: "city", media: "image" },
    prepare({ title, city, media }) {
      return { title, subtitle: city, media };
    },
  },
});

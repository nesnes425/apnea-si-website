import { defineArrayMember, defineField, defineType } from "sanity";

export const courseDepthSession = defineType({
  name: "courseDepthSession",
  title: "Tečaj — globinski termin",
  type: "document",
  fields: [
    defineField({ name: "startDate", title: "Začetek", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "endDate", title: "Konec", type: "date", validation: (Rule) => Rule.required() }),
    defineField({ name: "location", title: "Lokacija", type: "string", validation: (Rule) => Rule.required() }),
    defineField({
      name: "capacity",
      title: "Skupno število mest",
      type: "number",
      validation: (Rule) => Rule.required().integer().min(1),
    }),
    defineField({
      name: "reservedAllocations",
      title: "Rezervirane kvote",
      description: "Mesta, ki morajo ostati na voljo za udeležence določenega bazenskega termina.",
      type: "array",
      of: [
        defineArrayMember({
          type: "object",
          fields: [
            defineField({
              name: "courseInstance",
              title: "Termin teorije in bazena",
              type: "reference",
              to: [{ type: "courseInstance" }],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: "spots",
              title: "Rezervirana mesta",
              type: "number",
              validation: (Rule) => Rule.required().integer().min(1),
            }),
          ],
          preview: {
            select: { title: "courseInstance.startDate", spots: "spots" },
            prepare({ title, spots }) {
              return { title: title ?? "Termin", subtitle: `${spots ?? 0} rezerviranih mest` };
            },
          },
        }),
      ],
    }),
    defineField({
      name: "isOpen",
      title: "Odprto za prijave",
      type: "boolean",
      initialValue: true,
    }),
    defineField({ name: "notes", title: "Interne opombe", type: "text", rows: 3 }),
  ],
  preview: {
    select: { startDate: "startDate", endDate: "endDate", location: "location", capacity: "capacity", isOpen: "isOpen" },
    prepare({ startDate, endDate, location, capacity, isOpen }) {
      return {
        title: `${startDate ?? "Datum"}${endDate && endDate !== startDate ? `–${endDate}` : ""} — ${location ?? "Lokacija"}`,
        subtitle: `${capacity ?? 0} mest${isOpen === false ? " · zaprto" : ""}`,
      };
    },
  },
  orderings: [{ title: "Datum (naslednji najprej)", name: "startDateAsc", by: [{ field: "startDate", direction: "asc" }] }],
});

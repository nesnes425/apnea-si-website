import { defineField, defineType } from "sanity";

export const courseInstance = defineType({
  name: "courseInstance",
  title: "Tečaj — termin",
  type: "document",
  fields: [
    defineField({
      name: "courseType",
      title: "Vrsta tečaja",
      type: "string",
      options: {
        list: [
          { title: "Začetni tečaj (Level 1)", value: "zacetni" },
          { title: "Nadaljevalni tečaj (Level 2)", value: "nadaljevalni" },
          { title: "Master tečaj (Level 3)", value: "master" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "startDate",
      title: "Začetek tečaja",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "endDate",
      title: "Konec tečaja",
      type: "date",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "location",
      title: "Lokacija",
      type: "string",
      options: {
        list: [
          { title: "Ljubljana", value: "Ljubljana" },
          { title: "Nova Gorica", value: "Nova Gorica" },
          { title: "Velenje", value: "Velenje" },
          { title: "Novo Mesto", value: "Novo Mesto" },
          { title: "Koper", value: "Koper" },
        ],
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "maxSpots",
      title: "Število mest",
      type: "number",
      initialValue: 15,
      validation: (Rule) => Rule.required().min(1),
    }),
    defineField({
      name: "isFull",
      title: "Razprodano",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "notes",
      title: "Opombe",
      type: "text",
      rows: 3,
    }),
    defineField({
      name: "brevoListId",
      title: "Brevo list ID (auto)",
      description: "Set automatically by the booking webhook on first booking. Do not edit.",
      type: "number",
      readOnly: true,
    }),
  ],
  preview: {
    select: {
      courseType: "courseType",
      startDate: "startDate",
      location: "location",
      isFull: "isFull",
    },
    prepare({ courseType, startDate, location, isFull }) {
      const typeLabels: Record<string, string> = {
        zacetni: "Začetni",
        nadaljevalni: "Nadaljevalni",
        master: "Master",
      };
      return {
        title: `${typeLabels[courseType] || courseType} — ${location}`,
        subtitle: `${startDate}${isFull ? " ⛔ Razprodano" : ""}`,
      };
    },
  },
  orderings: [
    {
      title: "Datum (naslednji najprej)",
      name: "startDateAsc",
      by: [{ field: "startDate", direction: "asc" }],
    },
  ],
});

import { defineField, defineType } from "sanity";

export const trainingProgram = defineType({
  name: "trainingProgram",
  title: "Trening — program",
  type: "document",
  fields: [
    defineField({
      name: "name",
      title: "Naziv",
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
      name: "shortDescription",
      title: "Kratek opis",
      type: "text",
      rows: 3,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "description",
      title: "Opis programa",
      type: "array",
      of: [{ type: "block" }],
    }),
    defineField({
      name: "placementGuidance",
      title: "Komu je program namenjen",
      type: "text",
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "equipment",
      title: "Oprema",
      type: "array",
      of: [{ type: "block" }],
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
      name: "sortOrder",
      title: "Vrstni red",
      type: "number",
      initialValue: 10,
      validation: (Rule) => Rule.required().integer(),
    }),
    defineField({
      name: "active",
      title: "Aktiven",
      type: "boolean",
      initialValue: true,
    }),
  ],
  preview: {
    select: { title: "name", subtitle: "placementGuidance", media: "image" },
  },
  orderings: [
    {
      title: "Vrstni red",
      name: "sortOrderAsc",
      by: [{ field: "sortOrder", direction: "asc" }],
    },
  ],
});

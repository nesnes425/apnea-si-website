import { defineField, defineType } from "sanity";

export const blogPost = defineType({
  name: "blogPost",
  title: "Novica",
  type: "document",
  fields: [
    defineField({
      name: "title",
      title: "Naslov",
      type: "string",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "slug",
      title: "URL slug",
      type: "slug",
      options: { source: "title", maxLength: 96 },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "body",
      title: "Vsebina",
      type: "array",
      of: [
        { type: "block" },
        {
          type: "image",
          options: { hotspot: true },
          fields: [
            defineField({
              name: "alt",
              title: "Alt besedilo",
              type: "string",
            }),
          ],
        },
      ],
    }),
    defineField({
      name: "featuredImage",
      title: "Naslovna slika",
      type: "image",
      options: { hotspot: true },
      fields: [
        defineField({
          name: "alt",
          title: "Alt besedilo",
          type: "string",
        }),
      ],
    }),
    defineField({
      name: "publishedAt",
      title: "Datum objave",
      type: "datetime",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "categories",
      title: "Kategorije",
      type: "array",
      of: [{ type: "string" }],
      options: {
        list: [
          { title: "Nasveti", value: "nasveti" },
          { title: "Reportaže", value: "reportaze" },
          { title: "Tečaji", value: "tecaji" },
          { title: "Tekmovanja", value: "tekmovanja" },
          { title: "Treningi", value: "treningi" },
        ],
      },
    }),
    defineField({
      name: "metaDescription",
      title: "Meta opis (SEO)",
      type: "string",
      validation: (Rule) => Rule.max(160),
    }),
  ],
  preview: {
    select: {
      title: "title",
      date: "publishedAt",
      media: "featuredImage",
    },
    prepare({ title, date, media }) {
      return {
        title,
        subtitle: date
          ? new Date(date).toLocaleDateString("sl-SI")
          : "Brez datuma",
        media,
      };
    },
  },
  orderings: [
    {
      title: "Datum objave (najnovejši najprej)",
      name: "publishedAtDesc",
      by: [{ field: "publishedAt", direction: "desc" }],
    },
  ],
});

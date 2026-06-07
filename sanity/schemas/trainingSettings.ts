import { defineField, defineType } from "sanity";

export const trainingSettings = defineType({
  name: "trainingSettings",
  title: "Treningi — nastavitve",
  type: "document",
  fields: [
    defineField({
      name: "seasonLabel",
      title: "Sezona",
      type: "string",
      description: "Primer: 2026/27",
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "applicationsOpen",
      title: "Spletne prijave odprte",
      type: "boolean",
      initialValue: false,
    }),
    defineField({
      name: "membershipFee",
      title: "Letna članarina (€)",
      type: "number",
      initialValue: 35,
      validation: (Rule) => Rule.required().min(0),
    }),
    defineField({
      name: "holdMinutes",
      title: "Trajanje rezervacije mesta (minute)",
      type: "number",
      initialValue: 15,
      validation: (Rule) => Rule.required().integer().min(5).max(60),
    }),
  ],
  preview: {
    select: { season: "seasonLabel", open: "applicationsOpen" },
    prepare({ season, open }) {
      return {
        title: `Treningi ${season ?? ""}`,
        subtitle: open ? "Spletne prijave odprte" : "Spletne prijave zaprte",
      };
    },
  },
});

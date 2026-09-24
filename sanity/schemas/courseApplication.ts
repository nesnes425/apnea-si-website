import { defineField, defineType } from "sanity";

export const courseApplication = defineType({
  name: "courseApplication",
  title: "Tečaj — prijava",
  type: "document",
  fields: [
    defineField({ name: "submittedAt", title: "Datum prijave", type: "datetime", readOnly: true, validation: (Rule) => Rule.required() }),
    defineField({ name: "courseInstance", title: "Termin teorije in bazena", type: "reference", to: [{ type: "courseInstance" }], validation: (Rule) => Rule.required() }),
    defineField({ name: "depthSession", title: "Globinski termin", type: "reference", to: [{ type: "courseDepthSession" }] }),
    defineField({ name: "fullName", title: "Ime in priimek", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "email", title: "E-pošta", type: "string", validation: (Rule) => Rule.required().email() }),
    defineField({ name: "phone", title: "Telefon", type: "string", validation: (Rule) => Rule.required() }),
    defineField({ name: "note", title: "Opomba udeleženca", type: "text", rows: 3 }),
    defineField({
      name: "depositStatus",
      title: "Akontacija 50 €",
      type: "string",
      initialValue: "pending",
      options: { list: [{ title: "Čaka na plačilo", value: "pending" }, { title: "Plačano", value: "paid" }, { title: "Ni potrebno", value: "notRequired" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: "fullPaymentStatus",
      title: "Celotna prijavnina",
      type: "string",
      initialValue: "pending",
      options: { list: [{ title: "Čaka na plačilo", value: "pending" }, { title: "Plačano", value: "paid" }, { title: "Delno plačano", value: "partial" }, { title: "Stornirano / odpovedano", value: "cancelled" }] },
      validation: (Rule) => Rule.required(),
    }),
    defineField({ name: "zohoInvoiceId", title: "Zoho Books invoice ID", type: "string", readOnly: true }),
    defineField({ name: "zohoInvoiceNumber", title: "Številka računa", type: "string", readOnly: true }),
    defineField({ name: "zohoPaidAmount", title: "Plačani znesek (€)", type: "number", readOnly: true }),
  ],
  preview: {
    select: { name: "fullName", courseDate: "courseInstance.startDate", deposit: "depositStatus", full: "fullPaymentStatus", depthDate: "depthSession.startDate" },
    prepare({ name, courseDate, deposit, full, depthDate }) {
      const depositLabel = deposit === "paid" ? "akontacija ✓" : "akontacija čaka";
      const fullLabel = full === "paid" ? "v celoti ✓" : "preostanek čaka";
      return { title: name ?? "Prijava", subtitle: `${courseDate ?? "brez termina"} · ${depositLabel} · ${fullLabel}${depthDate ? ` · globina ${depthDate}` : ""}` };
    },
  },
  orderings: [{ title: "Najnovejše prijave", name: "submittedAtDesc", by: [{ field: "submittedAt", direction: "desc" }] }],
});

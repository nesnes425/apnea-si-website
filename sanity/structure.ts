import type { StructureResolver } from "sanity/structure";

export const structure: StructureResolver = (S) =>
  S.list()
    .title("Vsebina")
    .items([
      S.listItem()
        .title("Tečaji — pregled prijav")
        .child(
          S.documentTypeList("courseInstance")
            .title("Izberite termin")
            .defaultOrdering([{ field: "startDate", direction: "desc" }])
            .child((courseInstanceId) =>
              S.list()
                .title("Termin in prijave")
                .items([
                  S.listItem()
                    .title("Podatki termina")
                    .child(
                      S.document()
                        .schemaType("courseInstance")
                        .documentId(courseInstanceId)
                    ),
                  S.listItem()
                    .title("Prijavljeni udeleženci")
                    .child(
                      S.documentList()
                        .title("Prijavljeni udeleženci")
                        .schemaType("courseApplication")
                        .filter(
                          '_type == "courseApplication" && courseInstance._ref == $courseInstanceId'
                        )
                        .params({ courseInstanceId })
                        .defaultOrdering([
                          { field: "submittedAt", direction: "desc" },
                        ])
                    ),
                ])
            )
        ),
      S.divider(),
      S.documentTypeListItem("courseInstance").title("Tečaj — termini teorije in bazena"),
      S.documentTypeListItem("courseDepthSession").title("Tečaj — globinski termini"),
      S.documentTypeListItem("courseApplication").title("Tečaj — vse prijave"),
      S.divider(),
      ...S.documentTypeListItems().filter(
        (item) =>
          !["courseInstance", "courseDepthSession", "courseApplication"].includes(
            item.getId() ?? ""
          )
      ),
    ]);

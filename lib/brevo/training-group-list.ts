import { getTrainingGroup } from "@/lib/sanity/queries";
import { sanityWriteClient } from "@/lib/sanity/client";
import { readEnvNumber } from "@/lib/env";
import { createList } from "./client";

export async function findOrCreateTrainingGroupList(groupId: string, name: string): Promise<number> {
  const group = await getTrainingGroup(groupId);
  if (group?.brevoListId) return group.brevoListId;
  const listId = await createList({
    name,
    folderId: readEnvNumber("BREVO_FOLDER_TRAININGS"),
  });
  await sanityWriteClient.patch(groupId).set({ brevoListId: listId }).commit();
  return listId;
}

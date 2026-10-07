import { redirect } from "next/navigation";
import { identity, snapshot } from "@/lib/portal/backend";
import Portal from "../Portal";
export const dynamic = "force-dynamic";
export default async function AdminPage() {
  const id = await identity();
  if (!id || id.user.role !== "admin") redirect("/trenerji");
  return <Portal initial={await snapshot()} adminView />;
}

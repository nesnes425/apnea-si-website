import { configured, identity, snapshot } from "@/lib/portal/backend";
import { demoEnabled } from "@/lib/portal/demo";
import Login from "./Login";
import Portal from "./Portal";
export const dynamic = "force-dynamic";
export default async function Page() {
  const id = await identity();
  if (!id) return <Login ready={configured()} demo={demoEnabled()} />;
  const initial = await snapshot();
  return <Portal initial={initial} />;
}

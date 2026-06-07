/**
 * Open or close online training applications.
 *
 * Usage:
 *   node scripts/set-training-applications.mjs open
 *   node scripts/set-training-applications.mjs closed
 */

import { createClient } from "@sanity/client";
import { readFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const env = Object.fromEntries(
  readFileSync(resolve(root, ".env.local"), "utf8")
    .split("\n")
    .filter((line) => line.includes("=") && !line.startsWith("#"))
    .map((line) => {
      const [key, ...rest] = line.split("=");
      return [key.trim(), rest.join("=").trim().replace(/^["']|["']$/g, "")];
    })
);

const value = process.argv[2];
if (!["open", "closed"].includes(value)) {
  throw new Error("Pass either 'open' or 'closed'.");
}

const sanity = createClient({
  projectId: env.NEXT_PUBLIC_SANITY_PROJECT_ID,
  dataset: env.NEXT_PUBLIC_SANITY_DATASET,
  apiVersion: "2026-04-08",
  token: env.SANITY_API_TOKEN,
  useCdn: false,
});

await sanity
  .patch("training-settings")
  .set({ applicationsOpen: value === "open" })
  .commit();

console.log(`Training applications are ${value}.`);

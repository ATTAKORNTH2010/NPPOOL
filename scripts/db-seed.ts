/**
 * npm run db:seed [-- --sample-vehicle-types]
 * Runs in the Vercel build after migrations (vercel-build) and locally.
 */
import "./load-env";
import { db } from "@/db/client";
import { seedReferenceData, seedSampleVehicleTypes } from "@/db/seed";

async function main() {
  await seedReferenceData(db);
  console.log("seed: work statuses up to date");
  if (process.argv.includes("--sample-vehicle-types")) {
    await seedSampleVehicleTypes(db);
    console.log("seed: sample vehicle types added (development only)");
  }
}

main()
  .catch((error: unknown) => {
    console.error("seed failed:", error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => db.$client.end());

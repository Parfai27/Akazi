import { checkpointDatabase } from "../src/db";
import { crawlAll } from "../src/lib/crawl/run";

async function main() {
  const result = await crawlAll();
  console.log(
    `Crawl ${result.status}: ${result.jobsSeen} open, ${result.jobsNew} new, ${result.failures} source errors`,
  );
  for (const line of result.notes) console.log(`- ${line}`);
  checkpointDatabase();
  if (result.status === "error") process.exitCode = 1;
}

main().catch((error: unknown) => {
  console.error(error);
  process.exitCode = 1;
});

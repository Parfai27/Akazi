import { connection } from "next/server";
import { ViewerCount } from "@/components/viewer-count";
import { countRoleViewers } from "@/lib/record-log";

export async function JobViewers({
  publicId,
  sourceId,
  externalId,
}: {
  publicId: string;
  sourceId: string;
  externalId: string;
}) {
  await connection();
  const viewers = await countRoleViewers(publicId, { sourceId, externalId });
  return <ViewerCount initial={viewers} publicId={publicId} />;
}

import { extRoute } from "@/lib/ext";
import { listMaps, RETENTION_DAYS } from "@/lib/exports";

// "My maps" in the extension: everything created in the last RETENTION_DAYS days.
export const GET = extRoute(async (userId) => ({ retention_days: RETENTION_DAYS, maps: await listMaps(userId) }));

import { extRoute } from "@/lib/ext";
import { getStatus } from "@/lib/status";

export const GET = extRoute((userId) => getStatus(userId));

import "server-only";
import { userFromRequest } from "./apiKeys";
import type { Position } from "./network";

type Handler = (userId: string, req: Request) => Promise<unknown>;

/** Wraps an extension API route: API-key auth + JSON response. */
export function extRoute(handler: Handler) {
  return async (req: Request) => {
    const userId = await userFromRequest(req);
    if (!userId) return Response.json({ error: "invalid or missing API key" }, { status: 401 });
    try {
      return Response.json(await handler(userId, req));
    } catch (e) {
      console.error(e);
      return Response.json({ error: e instanceof Error ? e.message : "server error" }, { status: 500 });
    }
  };
}

/** The newest position without an end date. */
export function currentPosition(positions: Position[] | undefined) {
  const open = (positions ?? []).filter((p) => !p.end);
  return open.sort((a, b) => (b.start?.year ?? 0) * 12 + (b.start?.month ?? 0) - ((a.start?.year ?? 0) * 12 + (a.start?.month ?? 0)))[0];
}

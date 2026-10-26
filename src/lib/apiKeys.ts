import "server-only";
import { createHash, randomBytes } from "node:crypto";
import { adminClient } from "./supabase/admin";

const hash = (key: string) => createHash("sha256").update(key).digest("hex");

/** Creates a key and returns the plaintext once. Only the hash is stored. */
export async function createApiKey(userId: string, name = "default") {
  const key = `hk_${randomBytes(24).toString("base64url")}`;
  const { error } = await adminClient()
    .from("api_keys")
    .insert({ user_id: userId, name, prefix: key.slice(0, 7), key_hash: hash(key) });
  if (error) throw error;
  return key;
}

/** Resolves a bearer key to its user id, or null. */
export async function verifyApiKey(key: string | null | undefined): Promise<string | null> {
  if (!key?.startsWith("hk_")) return null;
  const db = adminClient();
  const { data } = await db
    .from("api_keys")
    .select("id, user_id")
    .eq("key_hash", hash(key))
    .is("revoked_at", null)
    .maybeSingle();
  if (!data) return null;
  await db.from("api_keys").update({ last_used_at: new Date().toISOString() }).eq("id", data.id);
  return data.user_id;
}

/** Reads `Authorization: Bearer hk_...` from a request. */
export async function userFromRequest(req: Request) {
  const auth = req.headers.get("authorization") ?? "";
  return verifyApiKey(auth.replace(/^Bearer\s+/i, "").trim());
}

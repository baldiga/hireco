"use server";

import { redirect } from "next/navigation";
import { createApiKey } from "@/lib/apiKeys";
import { serverClient } from "@/lib/supabase/server";

export async function generateKey() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect("/login");
  return createApiKey(data.user.id);
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/");
}

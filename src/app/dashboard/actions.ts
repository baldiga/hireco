"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { accessFor } from "@/lib/access";
import { createApiKey } from "@/lib/apiKeys";
import { adminClient } from "@/lib/supabase/admin";
import { serverClient } from "@/lib/supabase/server";

async function member() {
  const supabase = await serverClient();
  const { data } = await supabase.auth.getUser();
  if (!data.user || (await accessFor(data.user.email)) !== "approved") redirect("/login");
  return data.user;
}

export async function generateKey() {
  return createApiKey((await member()).id);
}

export async function setMarketing(optIn: boolean) {
  const user = await member();
  await adminClient().from("waitlist")
    .update({ marketing_opt_in: optIn, marketing_opt_in_at: optIn ? new Date().toISOString() : null })
    .eq("email", user.email!.toLowerCase());
  revalidatePath("/dashboard");
}

export async function signOut() {
  const supabase = await serverClient();
  await supabase.auth.signOut();
  redirect("/");
}

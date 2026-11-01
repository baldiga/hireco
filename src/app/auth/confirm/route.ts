import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse } from "next/server";
import { accessFor } from "@/lib/access";
import { serverClient } from "@/lib/supabase/server";

// Sign-in link landing (links minted by src/lib/email.ts): verify the token, then go to the dashboard.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") ?? "email") as EmailOtpType;
  if (tokenHash) {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
    if (!error && (await accessFor(data.user?.email)) === "approved") return NextResponse.redirect(new URL("/dashboard", url.origin));
    await supabase.auth.signOut();
    return NextResponse.redirect(new URL("/login?expired=1", url.origin));
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}

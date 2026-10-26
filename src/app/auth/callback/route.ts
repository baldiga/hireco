import { NextResponse } from "next/server";
import { accessFor } from "@/lib/access";
import { serverClient } from "@/lib/supabase/server";

// Magic-link landing: exchange the code for a session, then go to the dashboard (approved emails only).
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await serverClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error && (await accessFor(data.user?.email)) === "approved") return NextResponse.redirect(new URL("/dashboard", url.origin));
    await supabase.auth.signOut();
  }
  return NextResponse.redirect(new URL("/login", url.origin));
}

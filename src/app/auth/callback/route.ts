import { NextResponse } from "next/server";
import { serverClient } from "@/lib/supabase/server";

// Magic-link landing: exchange the code for a session, then go to the dashboard.
export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) {
    const supabase = await serverClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) return NextResponse.redirect(new URL("/dashboard", url.origin));
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}

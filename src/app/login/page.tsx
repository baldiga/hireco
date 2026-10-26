"use client";

import { createBrowserClient } from "@supabase/ssr";
import { useState } from "react";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState("");

  async function send(e: React.FormEvent) {
    e.preventDefault();
    setState("sending");
    const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${location.origin}/auth/callback` },
    });
    if (error) {
      setError(error.message);
      setState("error");
    } else setState("sent");
  }

  return (
    <main className="mx-auto w-full max-w-sm px-6 py-24">
      <h1 className="text-2xl font-semibold">Sign in to Hireco</h1>
      {state === "sent" ? (
        <p className="mt-4 text-neutral-500">Check <b>{email}</b> for a sign-in link.</p>
      ) : (
        <form onSubmit={send} className="mt-6 flex flex-col gap-3">
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            className="rounded-lg border border-neutral-300 bg-transparent px-3 py-2 dark:border-neutral-700"
          />
          <button disabled={state === "sending"} className="rounded-lg bg-emerald-600 px-4 py-2 font-medium text-white hover:bg-emerald-700 disabled:opacity-60">
            {state === "sending" ? "Sending…" : "Email me a sign-in link"}
          </button>
          {state === "error" && <p className="text-sm text-red-500">{error}</p>}
        </form>
      )}
    </main>
  );
}

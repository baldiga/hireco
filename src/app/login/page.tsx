"use client";

import Link from "next/link";
import { useActionState } from "react";
import { requestSignIn, type FormState } from "@/app/actions";
import { Wordmark } from "@/components/Brand";

export default function Login() {
  const [state, action, pending] = useActionState<FormState, FormData>(requestSignIn, null);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="rise d1 mb-10"><Wordmark /></div>
      <div className="rise d2 panel panel-hi w-full max-w-md p-8 sm:p-10">
        <h1 className="font-display text-4xl font-light text-white">Welcome back.</h1>
        <p className="mt-2 text-mist">We&apos;ll email you a one-time sign-in link.</p>
        {state?.ok ? (
          <div className="mt-8 rounded-2xl border border-glint/30 bg-glint/[0.06] p-5 text-frost">{state.message}</div>
        ) : (
          <form action={action} className="mt-8 grid gap-3">
            <input name="email" type="email" required placeholder="you@example.com" autoComplete="email" className="field" />
            <button disabled={pending} className="btn-primary w-full">{pending ? "Sending…" : "Email me a sign-in link"}</button>
            {state && !state.ok && <p className="text-sm text-[#ff9aa8]">{state.message}</p>}
          </form>
        )}
      </div>
      <p className="rise d3 mt-8 text-sm text-mist">
        New here? <Link href="/#early" className="text-ice underline decoration-white/20 underline-offset-4">Create your free account</Link>
      </p>
    </main>
  );
}

"use client";

import Link from "next/link";
import { useActionState } from "react";
import { signUp, type FormState } from "@/app/actions";

export default function SignupForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(signUp, null);

  if (state?.ok)
    return (
      <div className="rise rounded-2xl border border-glint/30 bg-glint/[0.06] p-6 text-center">
        <p className="font-display text-3xl font-light text-white">{state.queued ? "You're in line." : "Check your inbox."}</p>
        <p className="mt-2 text-mist">{state.message}</p>
      </div>
    );

  return (
    <form action={action} className="grid gap-3">
      <input name="name" required placeholder="Full name" autoComplete="name" className="field" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field" />
      <input name="linkedin" placeholder="LinkedIn profile URL (optional)" className="field" />
      {/* Honeypot: hidden from people, filled in by bots. */}
      <input name="website" tabIndex={-1} autoComplete="off" aria-hidden="true" className="absolute -left-[9999px] h-0 w-0 opacity-0" />

      <label className="mt-1 flex cursor-pointer items-start gap-3 text-sm text-mist">
        <input type="checkbox" name="terms" required className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-azure)]" />
        <span>
          I agree to the <Link href="/terms" target="_blank" className="text-ice underline decoration-white/20 underline-offset-4">Terms</Link> and{" "}
          <Link href="/privacy" target="_blank" className="text-ice underline decoration-white/20 underline-offset-4">Privacy Policy</Link>.
        </span>
      </label>
      <label className="flex cursor-pointer items-start gap-3 text-sm text-mist">
        <input type="checkbox" name="marketing" className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-azure)]" />
        <span>Email me product updates and tips (optional, a few a month at most, unsubscribe any time).</span>
      </label>

      <button disabled={pending} className="btn-primary mt-1 w-full">
        {pending ? "Creating your account…" : "Create my free account"}
      </button>
      {state && !state.ok && <p className="text-sm text-[#ff9aa8]">{state.message}</p>}
      <p className="text-center text-xs text-mist">Free and open source. We&apos;ll email you a link to confirm and sign in.</p>
    </form>
  );
}

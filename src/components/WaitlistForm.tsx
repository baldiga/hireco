"use client";

import { useActionState } from "react";
import { joinWaitlist, type FormState } from "@/app/actions";

export default function WaitlistForm() {
  const [state, action, pending] = useActionState<FormState, FormData>(joinWaitlist, null);

  if (state?.ok)
    return (
      <div className="rise rounded-2xl border border-glint/30 bg-glint/[0.06] p-6 text-center">
        <p className="font-display text-3xl font-light text-white">You&apos;re on the list.</p>
        <p className="mt-2 text-mist">{state.message}</p>
      </div>
    );

  return (
    <form action={action} className="grid gap-3">
      <input name="name" required placeholder="Full name" autoComplete="name" className="field" />
      <input name="email" type="email" required placeholder="Email" autoComplete="email" className="field" />
      <input name="linkedin" required placeholder="LinkedIn profile URL — linkedin.com/in/…" className="field" />
      <button disabled={pending} className="btn-primary mt-1 w-full">
        {pending ? "Requesting…" : "Request early access"}
      </button>
      {state && !state.ok && <p className="text-sm text-[#ff9aa8]">{state.message}</p>}
      <p className="text-center text-xs text-mist">Free during early access. We approve new members by hand.</p>
    </form>
  );
}

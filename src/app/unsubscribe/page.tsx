import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { Wordmark } from "@/components/Brand";
import { adminClient } from "@/lib/supabase/admin";

export const metadata: Metadata = { title: "Unsubscribe — Hireco", robots: { index: false } };

// Linked from product emails. A button (not the link itself) unsubscribes, so mail scanners
// that open links don't unsubscribe people by accident.
export const instant = false;

const UUID = /^[0-9a-f-]{36}$/i;

async function unsubscribe(form: FormData) {
  "use server";
  const token = String(form.get("t") ?? "");
  if (UUID.test(token))
    await adminClient().from("waitlist").update({ marketing_opt_in: false, marketing_opt_in_at: null }).eq("unsubscribe_token", token);
  redirect("/unsubscribe?done=1");
}

export default async function Unsubscribe({ searchParams }: { searchParams: Promise<{ t?: string; done?: string }> }) {
  const { t, done } = await searchParams;
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16">
      <div className="rise d1 mb-10"><Wordmark /></div>
      <div className="rise d2 panel panel-hi w-full max-w-md p-8 text-center sm:p-10">
        {done ? (
          <>
            <h1 className="font-display text-4xl font-light text-white">You&apos;re unsubscribed.</h1>
            <p className="mt-3 text-mist">No more product emails. You&apos;ll still get sign-in links when you ask for them.</p>
          </>
        ) : t && UUID.test(t) ? (
          <form action={unsubscribe}>
            <h1 className="font-display text-4xl font-light text-white">Unsubscribe?</h1>
            <p className="mt-3 text-mist">Stop product updates and tips from Hireco. Your account stays as it is.</p>
            <input type="hidden" name="t" value={t} />
            <button className="btn-primary mt-8 w-full">Unsubscribe</button>
          </form>
        ) : (
          <>
            <h1 className="font-display text-4xl font-light text-white">Link not valid.</h1>
            <p className="mt-3 text-mist">Sign in and turn product emails off at the bottom of your dashboard, or reply to any Hireco email.</p>
          </>
        )}
      </div>
    </main>
  );
}

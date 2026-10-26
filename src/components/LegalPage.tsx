import Link from "next/link";
import type { ReactNode } from "react";
import { Wordmark } from "./Brand";

export const CONTACT_EMAIL = "hello@hireco.help";

export function LegalPage({ eyebrow, title, updated, children }: { eyebrow: string; title: string; updated?: string; children: ReactNode }) {
  return (
    <main className="mx-auto w-full max-w-3xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <Link href="/" className="text-sm text-mist hover:text-frost">Home</Link>
      </header>
      <p className="eyebrow rise d1 pt-8">{eyebrow}</p>
      <h1 className="rise d2 font-display mt-3 text-5xl font-light text-white">{title}</h1>
      {updated && <p className="mt-3 text-sm text-mist">Last updated {updated}</p>}
      <div className="legal rise d3 mt-10 space-y-8 text-[15px] leading-relaxed text-frost/90">{children}</div>
    </main>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h2 className="font-display mb-3 text-2xl font-normal text-white">{title}</h2>
      <div className="space-y-3 [&_li]:ml-5 [&_li]:list-disc [&_li]:pl-1 [&_a]:text-ice [&_a]:underline [&_a]:decoration-white/20 [&_a]:underline-offset-4">{children}</div>
    </section>
  );
}

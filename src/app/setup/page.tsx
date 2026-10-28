import type { Metadata } from "next";
import Link from "next/link";
import { Wordmark } from "@/components/Brand";
import Walkthrough from "@/components/walkthrough/Walkthrough";

export const metadata: Metadata = {
  title: "Set up Hireco, step by step",
  description: "A screenshot-by-screenshot walkthrough: install the extension, get your key, sync your network and connect your AI.",
};

export default function Setup() {
  return (
    <main className="mx-auto w-full max-w-6xl px-6 pb-24">
      <header className="flex items-center justify-between py-6">
        <Wordmark />
        <nav className="flex items-center gap-6 text-sm text-mist">
          <Link href="/guide" className="hidden hover:text-frost sm:inline">Guide</Link>
          <Link href="/dashboard" className="hover:text-frost">Dashboard →</Link>
        </nav>
      </header>

      <p className="eyebrow rise d1 pt-6">Setup walkthrough</p>
      <h1 className="rise d2 font-display mt-3 text-4xl font-light text-white sm:text-5xl">Ten minutes, <em className="text-gradient">step by step</em>.</h1>
      <p className="rise d3 mt-4 max-w-2xl text-lg text-mist">
        Every click, with a screenshot. The gold ring shows where to click. Keep this page open next to Chrome and go one step at a time.
      </p>

      <div className="rise d4 mt-10">
        <Walkthrough />
      </div>

      <p className="mt-10 text-sm text-mist">
        Stuck anyway? Email <a href="mailto:hello@hireco.help" className="text-ice underline decoration-white/20 underline-offset-4">hello@hireco.help</a> with a screenshot and we&apos;ll get you through it.
      </p>
    </main>
  );
}

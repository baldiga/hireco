import Link from "next/link";
import { Wordmark } from "@/components/Brand";

export default function MapNotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center px-6 py-16 text-center">
      <div className="rise d1 mb-10"><Wordmark /></div>
      <div className="rise d2 panel panel-hi w-full max-w-md p-10">
        <h1 className="font-display text-4xl font-light text-white">This map has expired.</h1>
        <p className="mt-3 text-mist">
          Maps are kept for 14 days. Ask your AI the same question again and Hireco will draw a fresh one from your latest network.
        </p>
        <Link href="/guide" className="btn-ghost mt-6">Prompts to try →</Link>
      </div>
    </main>
  );
}

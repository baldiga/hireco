"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";
import { useSyncExternalStore } from "react";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;
const KEY = "hireco-cookie-consent";

const listeners = new Set<() => void>();
const subscribe = (fn: () => void) => (listeners.add(fn), () => void listeners.delete(fn));
// Falls back to memory when storage is blocked, so the choice still holds for this visit.
let memory: string | null = null;
function read() {
  try { return localStorage.getItem(KEY) ?? memory; } catch { return memory; }
}

// Google Analytics loads only after the visitor accepts, and never on map pages
// (map URLs are access links to someone's network).
export default function Analytics() {
  const path = usePathname();
  // undefined while rendering on the server, so the banner never flashes for people who already chose.
  const consent = useSyncExternalStore(subscribe, read, () => undefined);
  if (!GA_ID || consent === undefined || path?.startsWith("/map/")) return null;

  const choose = (v: "yes" | "no") => {
    memory = v;
    try { localStorage.setItem(KEY, v); } catch {}
    listeners.forEach((fn) => fn());
  };

  if (consent === "yes") return <GoogleAnalytics gaId={GA_ID} />;
  if (consent === "no") return null;
  return (
    <div role="dialog" aria-label="Cookies" className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-xl flex-wrap items-center gap-4 rounded-2xl border border-[var(--line-strong)] bg-ink-2/95 p-4 text-sm text-mist shadow-2xl backdrop-blur sm:inset-x-6">
      <p className="min-w-0 flex-1">
        We&apos;d like to count visits with Google Analytics cookies. Optional; Hireco works the same either way.{" "}
        <a href="/privacy" className="text-ice underline decoration-white/20 underline-offset-4">Privacy</a>
      </p>
      <div className="flex gap-2">
        <button onClick={() => choose("no")} className="btn-ghost px-4 py-2">No thanks</button>
        <button onClick={() => choose("yes")} className="btn-primary px-4 py-2">Accept</button>
      </div>
    </div>
  );
}

import Link from "next/link";

export function Mark({ size = 22 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden>
      <defs>
        <radialGradient id="mk" cx="50%" cy="50%" r="50%">
          <stop offset="0" stopColor="#fff" />
          <stop offset=".5" stopColor="#9fd8ff" />
          <stop offset="1" stopColor="#3f6cff" />
        </radialGradient>
      </defs>
      <g stroke="#b9cdff" strokeOpacity=".6" strokeWidth="1">
        <line x1="16" y1="16" x2="6" y2="8" /><line x1="16" y1="16" x2="26" y2="9" />
        <line x1="16" y1="16" x2="24" y2="25" /><line x1="16" y1="16" x2="7" y2="24" />
      </g>
      <g fill="#dfe7ff"><circle cx="6" cy="8" r="2" /><circle cx="26" cy="9" r="1.7" /><circle cx="24" cy="25" r="2" /><circle cx="7" cy="24" r="1.5" /></g>
      <circle cx="16" cy="16" r="4.2" fill="url(#mk)" />
    </svg>
  );
}

export function Wordmark({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-2.5">
      <Mark />
      <span className="font-display text-2xl font-normal tracking-wide text-white">Hireco</span>
    </Link>
  );
}

export function EarlyBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-champagne/30 bg-champagne/[0.06] px-3 py-1 text-[0.68rem] font-normal uppercase tracking-[0.22em] text-champagne">
      <span className="h-1.5 w-1.5 rounded-full bg-champagne shadow-[0_0_10px_rgba(231,214,176,.9)]" />
      Free · open source
    </span>
  );
}

"use client";

import { GoogleAnalytics } from "@next/third-parties/google";
import { usePathname } from "next/navigation";

// Map URLs are access links to someone's network, so they never go to Google.
export default function Analytics() {
  const path = usePathname();
  if (path?.startsWith("/map/")) return null;
  return <GoogleAnalytics gaId="G-K1MJ1GLHZM" />;
}

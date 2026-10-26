import type { Metadata } from "next";
import { Cormorant_Garamond, Hanken_Grotesk, JetBrains_Mono } from "next/font/google";
import "./globals.css";

const display = Cormorant_Garamond({ variable: "--nf-display", subsets: ["latin"], weight: ["300", "400", "500"], style: ["normal", "italic"] });
const sans = Hanken_Grotesk({ variable: "--nf-sans", subsets: ["latin"], weight: ["200", "300", "400", "500"] });
const mono = JetBrains_Mono({ variable: "--nf-mono", subsets: ["latin"], weight: ["400"] });

export const metadata: Metadata = {
  title: "Hireco — your next role is one introduction away",
  description: "Hireco maps your LinkedIn network into the hiring managers, insiders and ex-coworkers who can get you hired — right inside your AI agent.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${display.variable} ${sans.variable} ${mono.variable} h-full antialiased`}>
      <body className="min-h-full">
        <div className="grain" aria-hidden />
        {children}
      </body>
    </html>
  );
}

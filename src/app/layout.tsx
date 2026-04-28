import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/toaster";
import { Fraunces, Geist, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Display serif — distinctive, has a beautiful italic, variable optical sizing
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-fraunces",
  axes: ["opsz", "SOFT", "WONK"],
  display: "swap",
});

// Body sans — Vercel's Geist, modern but characterful (not Inter)
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-geist",
  display: "swap",
});

// Mono — JetBrains Mono for data, datelines, tickers
const jetbrainsMono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export const metadata = {
  title: "The Signal — Tech intelligence, distilled.",
  description: "Real-time tech briefings. Curated by AI, refined for humans who don't have time to read everything.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${fraunces.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ClerkProvider>
          <Toaster />
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}

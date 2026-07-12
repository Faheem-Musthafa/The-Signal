import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/toaster";
import { Geist, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

// Body + display sans — Vercel's Geist
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
    <html lang="en" className={`${geist.variable} ${jetbrainsMono.variable}`}>
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

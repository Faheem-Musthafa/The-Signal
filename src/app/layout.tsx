import type { Metadata } from "next";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/toaster";
import { Archivo, Geist, JetBrains_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SITE_DESCRIPTION, SITE_NAME, SITE_TITLE, getSiteUrl } from "@/components/siteUrl";
import "./globals.css";

// Display — Archivo variable with the width axis; used expanded (wdth 112–125) at 700–800
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});

// Body — Vercel's Geist
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

export const metadata: Metadata = {
  metadataBase: getSiteUrl(),
  title: {
    default: SITE_TITLE,
    template: `%s · ${SITE_NAME}`,
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  openGraph: {
    type: "website",
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
  },
};

/**
 * Clerk modals/components in the Broadcast look (paper, ink, ultramarine, Geist,
 * rounded cards, pill buttons). Literal hex values: Clerk derives tints from them.
 */
const clerkAppearance = {
  variables: {
    colorPrimary: "#2F4BFF",
    colorPrimaryForeground: "#FFFFFF",
    colorDanger: "#D4342C",
    colorSuccess: "#0E8A5F",
    colorWarning: "#B45309",
    colorNeutral: "#0E1220",
    colorForeground: "#0E1220",
    colorMutedForeground: "#6A7287",
    colorMuted: "#EEF0F6",
    colorBackground: "#FFFFFF",
    colorInput: "#FFFFFF",
    colorInputForeground: "#0E1220",
    colorBorder: "#D3D8E4",
    colorRing: "#2F4BFF",
    colorShadow: "rgba(14, 18, 32, 0.22)",
    colorModalBackdrop: "rgba(14, 18, 32, 0.6)",
    fontFamily: "var(--font-geist), system-ui, sans-serif",
    fontFamilyButtons: "var(--font-geist), system-ui, sans-serif",
    fontSize: "1rem",
    borderRadius: "0.875rem",
  },
  elements: {
    card: "shadow-lift",
    headerTitle: "font-display stretch-wide font-extrabold tracking-[-0.02em]",
    formButtonPrimary: "rounded-full font-semibold normal-case shadow-glow",
    socialButtonsBlockButton: "rounded-full",
    formFieldInput: "rounded-[12px]",
    footerActionLink: "font-semibold text-signal hover:text-signal-deep",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${archivo.variable} ${geist.variable} ${jetbrainsMono.variable}`}>
      <body>
        <ClerkProvider appearance={clerkAppearance}>
          <Toaster />
          {children}
          <Analytics />
        </ClerkProvider>
      </body>
    </html>
  );
}

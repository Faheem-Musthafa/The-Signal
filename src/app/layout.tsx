import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "@/components/toaster";
import { Inter, Playfair_Display, DM_Mono } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });
const dmMono = DM_Mono({ weight: ["400", "500"], subsets: ["latin"], variable: "--font-dm-mono" });

export const metadata = {
  title: "The Signal",
  description: "Daily tech intelligence digest",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${inter.variable} ${playfair.variable} ${dmMono.variable}`}>
      <body>
        <ClerkProvider>
          <Toaster />
          {children}
        </ClerkProvider>
      </body>
    </html>
  );
}

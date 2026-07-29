import type { Metadata } from "next";
import { Cormorant_Garamond, Manrope } from "next/font/google";
import { FrameDecor } from "@/components/FrameDecor";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  style: ["normal", "italic"],
  display: "swap",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Ernest H. Photography — Photographe de mariage",
  description:
    "Photographe de mariage — photojournalisme, lumière naturelle. Galerie, devis en ligne et contact.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="fr"
      className={`${cormorant.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream text-ink font-sans">
        <FrameDecor />
        {children}
      </body>
    </html>
  );
}

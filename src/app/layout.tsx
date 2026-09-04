import type { Metadata } from "next";
import { Caveat, DM_Sans, Fraunces, Outfit } from "next/font/google";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import { siteProfile } from "@/data/content";
import "./globals.css";

const sans = DM_Sans({
  variable: "--font-sans",
  subsets: ["latin"],
});

const display = Fraunces({
  variable: "--font-display",
  subsets: ["latin"],
});

const projectTemplate = Outfit({
  variable: "--font-project-template",
  subsets: ["latin"],
  weight: ["400", "800"],
});

const handwriting = Caveat({
  variable: "--font-hand",
  subsets: ["latin"],
  weight: ["400", "600"],
});

export const metadata: Metadata = {
  title: {
    default: `${siteProfile.name} — Interactive Study`,
    template: `%s — ${siteProfile.name}`,
  },
  description: siteProfile.introduction,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" data-scroll-behavior="smooth">
  <body className={`${sans.variable} ${display.variable} ${projectTemplate.variable} ${handwriting.variable}`}>
        <SiteHeader />
        {children}
        <SiteFooter />
      </body>
    </html>
  );
}

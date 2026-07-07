import type { Metadata } from "next";
import { Geist, Lora } from "next/font/google";
import "./globals.css";

const sans = Geist({
  variable: "--font-sans",
  subsets: ["latin"],
});

// Warm, readable serif for headings — calm and editorial without feeling churchy.
const serif = Lora({
  variable: "--font-serif",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pathlight — Bible passages for what you're walking through",
  description:
    "Describe a life situation and discover curated Bible passages to reflect on, pray over, and study — with reflection questions and context, never as magic answers.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sans.variable} ${serif.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground">
        {children}
      </body>
    </html>
  );
}

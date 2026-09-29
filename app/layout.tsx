import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const display = Geist({ subsets: ["latin"], variable: "--font-display" });
const code = Geist_Mono({ subsets: ["latin"], variable: "--font-code" });

export const metadata: Metadata = {
  title: "Loom — describe a website, get it live",
  description: "Build a website with AI, then push it to GitHub or deploy it in one click.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${code.variable}`}>
      <body>{children}</body>
    </html>
  );
}

import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "SponsorFlow | Personal AI UK Visa Job Acquisition Engine",
  description:
    "Systematic, personalized outreach engine connecting top tech talent with licensed UK visa sponsors.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-canvas-light text-ink antialiased">
        {children}
      </body>
    </html>
  );
}

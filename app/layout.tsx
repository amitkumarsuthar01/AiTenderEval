import type { Metadata } from "next";

import "./globals.css";

import { Toaster } from "sonner";

export const metadata: Metadata = {
  title:
    "AI Tender Evaluation Platform",

  description:
    "AI-powered procurement intelligence platform for tender analysis, bidder evaluation, compliance verification, and procurement risk assessment.",

  keywords: [
    "Tender AI",
    "Procurement AI",
    "Government Tender",
    "Bid Analysis",
    "Procurement Intelligence",
    "AI Compliance",
    "Tender Evaluation",
  ],

  authors: [
    {
      name: "Amit Kumar, Pinki",
    },
  ],

  creator: "Amit Kumar, Pinki",

  openGraph: {
    title:
      "AI Tender Evaluation Platform",

    description:
      "Smart AI procurement and bidder evaluation system.",

    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>
        {children}

        <Toaster
          position="top-right"
          richColors
        />
      </body>
    </html>
  );
}
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "EcosystemOS AI – Intelligent Ecosystem Relationship Orchestration",
  description:
    "AI-powered platform that automates relationships between startups, mentors, investors, and accelerators. Verify startups, match mentors, track ecosystem health.",
  keywords: ["ecosystem", "startups", "mentors", "AI", "accelerator", "innovation"],
  openGraph: {
    title: "EcosystemOS AI",
    description: "Intelligent Ecosystem Relationship Orchestration Platform",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} antialiased`}>
        {children}
        <Toaster />
      </body>
    </html>
  );
}

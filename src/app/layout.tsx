import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Z-5 X AI Chat - Real-time AI Assistant",
  description: "Experience real-time AI conversations with Z-5 X. Get instant streaming responses, chat history management, and a modern interface powered by Next.js.",
  keywords: ["Z-5 X", "AI Chat", "Real-time Streaming", "Next.js", "TypeScript", "Tailwind CSS", "shadcn/ui", "AI Assistant"],
  authors: [{ name: "Z-5 X Team" }],
  icons: {
    icon: "/favicon.ico",
  },
  openGraph: {
    title: "Z-5 X AI Chat",
    description: "Real-time AI conversations with instant streaming responses",
    url: "https://aichatyougee.vercel.app",
    siteName: "Z-5 X AI Chat",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Z-5 X AI Chat",
    description: "Real-time AI conversations with instant streaming responses",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}

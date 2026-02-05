import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import ChatInterface from '@/components/ChatInterface';
import { ChatProvider } from '@/context/ChatContext'; // Import ChatProvider

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketLens",
  description: "AI-powered market intelligence",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-market-background-dark text-white`}
      >
        <ChatProvider> {/* Wrap with ChatProvider */}
          <Header />
          <main className="mt-15">
            {children}
          </main>
          <ChatInterface />
        </ChatProvider>
      </body>
    </html>
  );
}

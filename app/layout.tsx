import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";
import localFont from "next/font/local";

const geistMono = localFont({
  src: "./fonts/GeistMonoVF.woff",
  variable: "--font-geist-mono",
});

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Payment Tracker",
  description: "Track your project payments and milestones",
  icons: {
    icon: "/logo.png",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang='en' className='dark' suppressHydrationWarning>
      <body
        className={`${geistMono.className} min-h-screen bg-background text-foreground antialiased`}
        suppressHydrationWarning>
        <div className='relative min-h-screen flex flex-col bg-gradient-to-b from-background via-background/95 to-background/90'>
          {children}
          <Toaster />
        </div>
      </body>
    </html>
  );
}

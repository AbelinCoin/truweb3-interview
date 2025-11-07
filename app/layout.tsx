import type { Metadata } from "next";
import { Inter, IBM_Plex_Mono } from "next/font/google";
import "./globals.css";

import { Providers } from "./providers";
import { StarsBackground } from "@/components/StarsBackground";

const primarySans = Inter({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const primaryMono = IBM_Plex_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600"],
});

export const metadata: Metadata = {
  title: "Uniswap V4 Sepolia Portal",
  description: "Minimalist ETH ↔ USDC swap and liquidity interface for Uniswap V4 on Sepolia.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${primarySans.variable} ${primaryMono.variable} antialiased`}
      >
        <StarsBackground />
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}

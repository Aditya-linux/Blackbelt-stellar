import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Sentinel | Non-Custodial DeFi Guardian",
  description:
    "AI-powered non-custodial DeFi dashboard that analyzes financial news sentiment and executes asset swaps on the Stellar network.",
  keywords: ["DeFi", "Stellar", "Soroban", "AI", "Sentiment", "Non-Custodial"],
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        {children}
      </body>
    </html>
  );
}

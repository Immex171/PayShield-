import type { Metadata } from "next";
import "../styles/globals.css";
import { WagmiProviderWrapper } from "../components/shared/WagmiProviderWrapper";
import { Navbar } from "../components/layout/Navbar";
import { Footer } from "../components/layout/Footer";

export const metadata: Metadata = {
  title: "PayShield — Private Payroll for Public Blockchains",
  description:
    "Confidential on-chain payroll powered by Fhenix CoFHE. Encrypt salaries, fund payroll, and let workers claim privately without exposing compensation data.",
  keywords: ["payroll", "privacy", "fhenix", "cofhe", "web3", "dao", "encrypted"],
  openGraph: {
    title: "PayShield",
    description: "Private payroll for public blockchains.",
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
      <body className="font-body antialiased bg-void text-primary min-h-screen">
        <div className="scan-line" aria-hidden="true" />
        <WagmiProviderWrapper>
          <Navbar />
          <main>{children}</main>
          <Footer />
        </WagmiProviderWrapper>
      </body>
    </html>
  );
}

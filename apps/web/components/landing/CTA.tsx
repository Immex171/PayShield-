"use client";

import Link from "next/link";
import { ArrowRight, Github, FileText } from "lucide-react";

export function CTA() {
  return (
    <section
      className="py-24 px-4 relative overflow-hidden"
      style={{ background: "var(--bg-void)" }}
    >
      {/* Background glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 60% 60% at 50% 50%, rgba(0,212,255,0.06) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="relative z-10 max-w-3xl mx-auto text-center">
        <h2
          className="text-4xl md:text-5xl font-bold mb-6"
          style={{ fontFamily: "Syne, sans-serif" }}
        >
          Ready to shield
          <br />
          your payroll?
        </h2>
        <p className="text-lg mb-10" style={{ color: "#7ba3bb" }}>
          Deploy your first encrypted payroll contract in minutes.
          No salary data ever hits a public ledger in plaintext.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/demo"
            className="btn-primary flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl"
          >
            Run the Demo
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/company"
            className="btn-ghost flex items-center gap-2 px-8 py-4 text-base font-semibold rounded-xl"
          >
            Company Dashboard
          </Link>
        </div>

        {/* Links */}
        <div className="mt-12 flex items-center justify-center gap-8">
          <a
            href="https://github.com/payshield"
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "#3d6480" }}
          >
            <Github className="w-4 h-4" />
            GitHub
          </a>
          <a
            href="/docs"
            className="flex items-center gap-2 text-sm transition-colors hover:text-white"
            style={{ color: "#3d6480" }}
          >
            <FileText className="w-4 h-4" />
            Documentation
          </a>
        </div>

        {/* Testnet disclaimer */}
        <div
          className="mt-10 px-4 py-3 rounded-xl text-sm"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.12)",
            color: "#7ba3bb",
          }}
        >
          <span style={{ color: "#f59e0b" }}>⚡ Buildathon MVP: </span>
          This demo runs on Fhenix local mock / Helium testnet. Not
          production-ready. Real FHE encryption active on testnet; mock mode
          used for local Hardhat testing.
        </div>
      </div>
    </section>
  );
}

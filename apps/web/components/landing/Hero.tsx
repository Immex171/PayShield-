"use client";

import Link from "next/link";
import { Shield, Lock, ArrowRight, Zap } from "lucide-react";

export function Hero() {
  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center px-4 pt-20 pb-16 overflow-hidden"
      style={{ background: "var(--bg-void)" }}
    >
      {/* Grid background */}
      <div
        className="absolute inset-0 grid-bg opacity-40"
        aria-hidden="true"
      />

      {/* Radial glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        aria-hidden="true"
        style={{
          background:
            "radial-gradient(ellipse 80% 60% at 50% 40%, rgba(0,212,255,0.05) 0%, transparent 70%)",
        }}
      />

      {/* Floating orbs */}
      <div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,212,255,0.06) 0%, transparent 70%)",
          animation: "floatGlow 8s ease-in-out infinite",
          filter: "blur(40px)",
        }}
        aria-hidden="true"
      />
      <div
        className="absolute bottom-1/3 right-1/4 w-96 h-96 rounded-full pointer-events-none"
        style={{
          background: "radial-gradient(circle, rgba(0,255,204,0.04) 0%, transparent 70%)",
          animation: "floatGlow 10s ease-in-out infinite reverse",
          filter: "blur(60px)",
        }}
        aria-hidden="true"
      />

      {/* Content */}
      <div className="relative z-10 max-w-4xl mx-auto text-center">
        {/* Badge */}
        <div
          className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-medium mb-8 animate-fade-in-up"
          style={{
            background: "rgba(0,212,255,0.08)",
            border: "1px solid rgba(0,212,255,0.2)",
            color: "#00d4ff",
            fontFamily: "DM Mono, monospace",
            letterSpacing: "0.05em",
          }}
        >
          <Zap className="w-3 h-3" />
          POWERED BY FHENIX COFHE · FULLY HOMOMORPHIC ENCRYPTION
        </div>

        {/* Headline */}
        <h1
          className="text-5xl sm:text-6xl md:text-7xl font-bold tracking-tight mb-6 animate-fade-in-up delay-100"
          style={{
            fontFamily: "Syne, sans-serif",
            lineHeight: 1.05,
          }}
        >
          Private payroll
          <br />
          for{" "}
          <span
            style={{
              background: "linear-gradient(135deg, #00d4ff 0%, #00ffcc 60%, #00b4cc 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            public blockchains.
          </span>
        </h1>

        {/* Subline */}
        <p
          className="text-lg md:text-xl max-w-2xl mx-auto mb-10 animate-fade-in-up delay-200"
          style={{ color: "#7ba3bb", lineHeight: 1.7 }}
        >
          PayShield uses Fhenix's Confidential FHE to encrypt salary records
          on-chain. Companies pay workers without leaking compensation data.
          Workers claim privately. Auditors see only what they're granted.
        </p>

        {/* CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up delay-300">
          <Link
            href="/demo"
            className="btn-primary flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl"
          >
            <span>Try the Demo</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            href="/company"
            className="btn-ghost flex items-center gap-2 px-8 py-3.5 text-base font-semibold rounded-xl"
          >
            <Building className="w-4 h-4" />
            Company Dashboard
          </Link>
        </div>

        {/* Stats strip */}
        <div
          className="mt-16 grid grid-cols-3 gap-6 max-w-lg mx-auto animate-fade-in-up delay-500"
        >
          {[
            { label: "Salary Visibility", value: "Zero" },
            { label: "FHE Encryption", value: "128-bit" },
            { label: "Access Control", value: "On-chain" },
          ].map(({ label, value }) => (
            <div key={label} className="text-center">
              <div
                className="text-2xl font-bold mb-1"
                style={{
                  fontFamily: "Syne, sans-serif",
                  background: "linear-gradient(135deg, #00d4ff, #00ffcc)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                {value}
              </div>
              <div className="text-xs" style={{ color: "#3d6480", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                {label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Scroll indicator */}
      <div
        className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-fade-in-up delay-700"
        style={{ color: "#3d6480" }}
      >
        <div
          className="w-5 h-8 rounded-full border flex items-start justify-center pt-1.5"
          style={{ borderColor: "rgba(0,212,255,0.2)" }}
        >
          <div
            className="w-1 h-2 rounded-full"
            style={{
              background: "#00d4ff",
              animation: "scrollBob 2s ease-in-out infinite",
            }}
          />
        </div>
      </div>

      <style jsx>{`
        @keyframes scrollBob {
          0%, 100% { transform: translateY(0); opacity: 1; }
          50% { transform: translateY(4px); opacity: 0.4; }
        }
      `}</style>
    </section>
  );
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
function Building(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round" {...props}>
      <rect x="3" y="3" width="18" height="18" rx="2" />
      <path d="M9 3v18M15 3v18M3 9h18M3 15h18" />
    </svg>
  );
}

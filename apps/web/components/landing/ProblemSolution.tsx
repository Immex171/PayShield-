"use client";

import { Eye, FileText, Clock, DollarSign, Shield, Lock, Key, CheckCircle } from "lucide-react";

export function ProblemSection() {
  const problems = [
    {
      icon: Eye,
      title: "Salary Transparency Leak",
      description:
        "Every on-chain payroll transaction broadcasts salary amounts publicly. Anyone with a block explorer can see exactly what each worker earns.",
    },
    {
      icon: DollarSign,
      title: "Treasury Exposure",
      description:
        "Company treasury movements are visible to competitors, revealing hiring velocity, team size, and operational budget in real time.",
    },
    {
      icon: Clock,
      title: "Payment Timing Surveillance",
      description:
        "Transaction timestamps expose pay cycles, contractor schedules, and when key personnel are compensated — a competitive intelligence goldmine.",
    },
    {
      icon: FileText,
      title: "Worker Identity Risk",
      description:
        "Linking wallet addresses to workers creates permanent, public records of employment history that cannot be deleted or redacted.",
    },
  ];

  return (
    <section
      className="py-24 px-4 relative"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="max-w-6xl mx-auto">
        {/* Section header */}
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4"
            style={{
              background: "rgba(255,77,109,0.1)",
              border: "1px solid rgba(255,77,109,0.25)",
              color: "#ff4d6d",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.05em",
            }}
          >
            THE PROBLEM
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Public chains are{" "}
            <span style={{ color: "#ff4d6d" }}>hostile</span>
            <br />
            to real-world payroll.
          </h2>
          <p
            className="text-lg max-w-2xl mx-auto"
            style={{ color: "#7ba3bb" }}
          >
            Transparent ledgers were designed for auditability — but auditability
            without access control means every salary is permanently public.
          </p>
        </div>

        {/* Problem cards */}
        <div className="grid md:grid-cols-2 gap-6">
          {problems.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="p-6 rounded-2xl flex gap-4"
              style={{
                background: "rgba(255,77,109,0.04)",
                border: "1px solid rgba(255,77,109,0.12)",
              }}
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5"
                style={{
                  background: "rgba(255,77,109,0.12)",
                  border: "1px solid rgba(255,77,109,0.2)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "#ff4d6d" }} />
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ fontFamily: "Syne, sans-serif", color: "#e8f4f8" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7ba3bb" }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual: public tx callout */}
        <div
          className="mt-12 p-6 rounded-2xl overflow-x-auto"
          style={{
            background: "rgba(255,77,109,0.04)",
            border: "1px solid rgba(255,77,109,0.15)",
          }}
        >
          <p
            className="text-xs mb-3"
            style={{ color: "#ff4d6d", fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            ⚠ What anyone sees on a standard blockchain today:
          </p>
          <div
            className="text-sm"
            style={{ fontFamily: "DM Mono, monospace", color: "#7ba3bb" }}
          >
            <span style={{ color: "#3d6480" }}>tx.to:&nbsp;</span>
            <span style={{ color: "#e8f4f8" }}>0xworker_alice</span>
            {"  "}
            <span style={{ color: "#3d6480" }}>value:&nbsp;</span>
            <span style={{ color: "#ff4d6d", fontWeight: "600" }}>8,500 USDC</span>
            {"  "}
            <span style={{ color: "#3d6480" }}>from:&nbsp;</span>
            <span style={{ color: "#e8f4f8" }}>AcmeCorp_Treasury</span>
            {"  "}
            <span style={{ color: "#3d6480" }}>timestamp:&nbsp;</span>
            <span style={{ color: "#e8f4f8" }}>2024-01-31 09:00:01</span>
          </div>
        </div>
      </div>
    </section>
  );
}

export function SolutionSection() {
  const solutions = [
    {
      icon: Lock,
      title: "Client-Side Salary Encryption",
      description:
        "Salary amounts are encrypted in the browser before the transaction is signed. The plaintext never touches the network.",
    },
    {
      icon: Shield,
      title: "Encrypted On-Chain Storage",
      description:
        "Salaries are stored as euint128 — Fhenix CoFHE encrypted integers. No block explorer, node, or indexer can read the value.",
    },
    {
      icon: Key,
      title: "Permission-Gated Decryption",
      description:
        "Only the worker can view their own salary. Auditors see proofs only if the company explicitly grants access. Public users see nothing.",
    },
    {
      icon: CheckCircle,
      title: "Verifiable Without Exposure",
      description:
        "Payroll can be audited using FHE-powered proofs — verifying amounts are correct without revealing them to unauthorized parties.",
    },
  ];

  return (
    <section
      className="py-24 px-4 relative"
      style={{ background: "var(--bg-void)" }}
    >
      {/* Glow */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(0,212,255,0.03) 0%, transparent 70%)",
        }}
        aria-hidden
      />

      <div className="max-w-6xl mx-auto relative z-10">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4"
            style={{
              background: "rgba(0,212,255,0.08)",
              border: "1px solid rgba(0,212,255,0.2)",
              color: "#00d4ff",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.05em",
            }}
          >
            THE SOLUTION
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Encrypted computation.
            <br />
            <span
              style={{
                background: "linear-gradient(135deg, #00d4ff, #00ffcc)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Zero salary leakage.
            </span>
          </h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: "#7ba3bb" }}>
            Fhenix's Confidential FHE enables smart contracts to compute on
            encrypted data. PayShield uses this to keep salaries private while
            keeping payroll verifiable and trustless.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {solutions.map(({ icon: Icon, title, description }) => (
            <div
              key={title}
              className="glass p-6 rounded-2xl flex gap-4 group transition-all hover:border-cyan-300/30"
            >
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 mt-0.5 transition-all group-hover:scale-110"
                style={{
                  background: "rgba(0,212,255,0.1)",
                  border: "1px solid rgba(0,212,255,0.2)",
                }}
              >
                <Icon className="w-5 h-5" style={{ color: "#00d4ff" }} />
              </div>
              <div>
                <h3
                  className="font-semibold mb-2"
                  style={{ fontFamily: "Syne, sans-serif", color: "#e8f4f8" }}
                >
                  {title}
                </h3>
                <p className="text-sm leading-relaxed" style={{ color: "#7ba3bb" }}>
                  {description}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* Visual: encrypted tx */}
        <div
          className="mt-12 p-6 rounded-2xl overflow-x-auto"
          style={{
            background: "rgba(0,212,255,0.04)",
            border: "1px solid rgba(0,212,255,0.15)",
          }}
        >
          <p
            className="text-xs mb-3"
            style={{ color: "#00d4ff", fontFamily: "DM Mono, monospace", textTransform: "uppercase", letterSpacing: "0.05em" }}
          >
            ✓ What PayShield stores on-chain:
          </p>
          <div
            className="text-sm"
            style={{ fontFamily: "DM Mono, monospace", color: "#7ba3bb" }}
          >
            <span style={{ color: "#3d6480" }}>worker:&nbsp;</span>
            <span style={{ color: "#e8f4f8" }}>0xworker_alice</span>
            {"  "}
            <span style={{ color: "#3d6480" }}>salary(euint128):&nbsp;</span>
            <span
              style={{ color: "#00d4ff" }}
              className="encrypted-pulse"
            >
              0x7f3a9b2c...e4d1f8 [ENCRYPTED]
            </span>
            {"  "}
            <span style={{ color: "#3d6480" }}>access:&nbsp;</span>
            <span style={{ color: "#00ffcc" }}>worker_only</span>
          </div>
        </div>
      </div>
    </section>
  );
}

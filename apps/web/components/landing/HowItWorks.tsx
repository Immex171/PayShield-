"use client";

import { Building2, Lock, Coins, UserCheck, ArrowDown } from "lucide-react";

export function HowItWorks() {
  const steps = [
    {
      number: "01",
      icon: Building2,
      title: "Company Creates Payroll",
      description:
        "Admin deploys a PayShieldPayroll contract via the factory. A linked vault is created to hold payroll funds.",
      tag: "PayShieldFactory.createPayroll()",
    },
    {
      number: "02",
      icon: Lock,
      title: "Salary Encrypted Client-Side",
      description:
        "Before submitting a worker transaction, the admin encrypts the salary using CoFHE SDK in the browser. The plaintext never leaves the admin's device.",
      tag: "cofheClient.encrypt_uint128(amount)",
    },
    {
      number: "03",
      icon: Coins,
      title: "Payroll Funded",
      description:
        "Company admin approves and deposits tokens into the vault. The vault holds funds until workers claim.",
      tag: "PayShieldVault.deposit(amount)",
    },
    {
      number: "04",
      icon: UserCheck,
      title: "Worker Claims Privately",
      description:
        "Worker connects their wallet and calls claimSalary(). The FHE network decrypts the salary inside the computation and releases the correct amount from the vault.",
      tag: "PayShieldPayroll.claimSalary()",
    },
  ];

  return (
    <section
      className="py-24 px-4"
      style={{ background: "var(--bg-surface)" }}
    >
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-16">
          <div
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs mb-4"
            style={{
              background: "rgba(0,255,204,0.08)",
              border: "1px solid rgba(0,255,204,0.2)",
              color: "#00ffcc",
              fontFamily: "DM Mono, monospace",
              letterSpacing: "0.05em",
            }}
          >
            HOW IT WORKS
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Four steps to private payroll.
          </h2>
        </div>

        <div className="flex flex-col gap-0">
          {steps.map(({ number, icon: Icon, title, description, tag }, i) => (
            <div key={number} className="flex gap-6">
              {/* Left: number + line */}
              <div className="flex flex-col items-center">
                <div
                  className="w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 font-bold text-sm"
                  style={{
                    fontFamily: "DM Mono, monospace",
                    background: "rgba(0,212,255,0.1)",
                    border: "1px solid rgba(0,212,255,0.3)",
                    color: "#00d4ff",
                  }}
                >
                  {number}
                </div>
                {i < steps.length - 1 && (
                  <div
                    className="flex-1 w-px my-2"
                    style={{ background: "rgba(0,212,255,0.15)", minHeight: 40 }}
                  />
                )}
              </div>

              {/* Right: content */}
              <div
                className="pb-10 flex-1"
                style={{ paddingTop: "10px" }}
              >
                <div className="flex items-center gap-3 mb-2">
                  <Icon className="w-4 h-4" style={{ color: "#00d4ff" }} />
                  <h3
                    className="font-semibold text-lg"
                    style={{ fontFamily: "Syne, sans-serif", color: "#e8f4f8" }}
                  >
                    {title}
                  </h3>
                </div>
                <p className="text-sm mb-3 leading-relaxed" style={{ color: "#7ba3bb" }}>
                  {description}
                </p>
                <code
                  className="text-xs px-3 py-1.5 rounded-lg"
                  style={{
                    background: "rgba(0,212,255,0.06)",
                    border: "1px solid rgba(0,212,255,0.12)",
                    color: "#00ffcc",
                    fontFamily: "DM Mono, monospace",
                  }}
                >
                  {tag}
                </code>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

export function PrivacyArchitecture() {
  const layers = [
    {
      layer: "L1",
      name: "Client-Side Encryption",
      detail: "CoFHE SDK encrypts salary in browser. Plaintext is ephemeral.",
      color: "#00d4ff",
    },
    {
      layer: "L2",
      name: "FHE Contract Storage",
      detail: "euint128 ciphertext stored on Fhenix. No plaintext in contract state.",
      color: "#00ffcc",
    },
    {
      layer: "L3",
      name: "FHE Access Control",
      detail: "FHE.allow() gates who can call sealOutput(). Worker: self only. Auditor: if granted.",
      color: "#00b4cc",
    },
    {
      layer: "L4",
      name: "Threshold Decryption",
      detail: "FHE.decrypt() runs inside Fhenix's threshold network. Plaintext used in-circuit only.",
      color: "#7ba3bb",
    },
    {
      layer: "L5",
      name: "Event Privacy",
      detail: "SalaryClaimed events omit the amount. Transaction calldata contains only ciphertext.",
      color: "#3d6480",
    },
  ];

  return (
    <section
      className="py-24 px-4"
      style={{ background: "var(--bg-base)" }}
    >
      <div className="max-w-5xl mx-auto">
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
            PRIVACY ARCHITECTURE
          </div>
          <h2
            className="text-4xl md:text-5xl font-bold mb-4"
            style={{ fontFamily: "Syne, sans-serif" }}
          >
            Five layers of privacy.
          </h2>
          <p className="max-w-xl mx-auto" style={{ color: "#7ba3bb" }}>
            PayShield's privacy model is defense-in-depth. Even if one layer
            is bypassed, salary data remains protected.
          </p>
        </div>

        <div className="grid gap-3">
          {layers.map(({ layer, name, detail, color }) => (
            <div
              key={layer}
              className="flex gap-4 items-start p-5 rounded-xl transition-all hover:scale-[1.01]"
              style={{
                background: "rgba(10,21,32,0.6)",
                border: `1px solid ${color}22`,
              }}
            >
              <div
                className="text-xs font-bold px-2 py-1 rounded flex-shrink-0"
                style={{
                  fontFamily: "DM Mono, monospace",
                  background: `${color}15`,
                  border: `1px solid ${color}33`,
                  color,
                  letterSpacing: "0.05em",
                }}
              >
                {layer}
              </div>
              <div>
                <div
                  className="font-semibold mb-1"
                  style={{ color: "#e8f4f8", fontFamily: "Syne, sans-serif" }}
                >
                  {name}
                </div>
                <div className="text-sm" style={{ color: "#7ba3bb" }}>
                  {detail}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Privacy disclaimer */}
        <div
          className="mt-8 p-4 rounded-xl text-sm"
          style={{
            background: "rgba(245,158,11,0.06)",
            border: "1px solid rgba(245,158,11,0.15)",
            color: "#7ba3bb",
          }}
        >
          <span style={{ color: "#f59e0b" }}>Note: </span>
          Worker wallet addresses are still visible on-chain (as with all EVM
          transactions). Future versions will add stealth address support for
          full worker anonymity. See{" "}
          <a href="/docs" style={{ color: "#f59e0b", textDecoration: "underline" }}>
            ROADMAP.md
          </a>
          .
        </div>
      </div>
    </section>
  );
}

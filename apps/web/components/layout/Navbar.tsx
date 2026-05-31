"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Shield, Building2, User, Search, Menu, X } from "lucide-react";
import { useState } from "react";
import { WalletConnectButton } from "../shared/WalletConnectButton";

const NAV_LINKS = [
  { href: "/company", label: "Company", icon: Building2 },
  { href: "/worker", label: "Worker", icon: User },
  { href: "/auditor", label: "Auditor", icon: Search },
  { href: "/demo", label: "Demo", icon: null },
];

export function Navbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{
        background: "rgba(6, 13, 20, 0.85)",
        backdropFilter: "blur(20px)",
        borderBottom: "1px solid rgba(0,212,255,0.1)",
      }}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center transition-all group-hover:scale-105"
            style={{
              background: "linear-gradient(135deg, #00d4ff22 0%, #00ffcc22 100%)",
              border: "1px solid rgba(0,212,255,0.3)",
            }}
          >
            <Shield className="w-4 h-4 text-cyan-400" />
          </div>
          <span className="font-display font-700 text-lg tracking-tight" style={{ fontFamily: "Syne, sans-serif", fontWeight: 700 }}>
            Pay<span className="gradient-text">Shield</span>
          </span>
        </Link>

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-1">
          {NAV_LINKS.map(({ href, label }) => {
            const active = pathname.startsWith(href);
            return (
              <Link
                key={href}
                href={href}
                className="px-4 py-2 rounded-lg text-sm font-medium transition-all"
                style={{
                  color: active ? "#00d4ff" : "#7ba3bb",
                  background: active ? "rgba(0,212,255,0.08)" : "transparent",
                  border: active ? "1px solid rgba(0,212,255,0.2)" : "1px solid transparent",
                }}
              >
                {label}
              </Link>
            );
          })}
        </div>

        {/* Right side */}
        <div className="flex items-center gap-3">
          <WalletConnectButton />
          <button
            className="md:hidden p-2 rounded-lg"
            onClick={() => setMobileOpen(!mobileOpen)}
            style={{ color: "#7ba3bb" }}
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Nav */}
      {mobileOpen && (
        <div
          className="md:hidden border-t px-4 py-3 flex flex-col gap-1"
          style={{ borderColor: "rgba(0,212,255,0.1)", background: "rgba(6,13,20,0.98)" }}
        >
          {NAV_LINKS.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm"
              style={{ color: "#7ba3bb" }}
            >
              {Icon && <Icon className="w-4 h-4" />}
              {label}
            </Link>
          ))}
        </div>
      )}
    </nav>
  );
}

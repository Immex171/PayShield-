import Link from 'next/link';

export function Footer() {
  return (
    <footer className="border-t border-white/5 mt-20 py-12 px-6">
      <div className="max-w-6xl mx-auto">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          <div className="col-span-2 md:col-span-1">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-xl">🔐</span>
              <span className="font-bold font-display gradient-text">PayShield</span>
            </div>
            <p className="text-xs text-white/30 leading-relaxed">
              Private payroll for public blockchains. Built on Fhenix CoFHE.
            </p>
            <div className="mt-4 flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-xs text-white/30">Fhenix Helium Testnet</span>
            </div>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Product</p>
            <ul className="space-y-2">
              {[
                { label: 'Company', href: '/company' },
                { label: 'Worker', href: '/worker' },
                { label: 'Auditor', href: '/auditor' },
                { label: 'Demo', href: '/demo' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/30 hover:text-white/60 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Docs</p>
            <ul className="space-y-2">
              {[
                { label: 'Architecture', href: '/docs#architecture' },
                { label: 'Privacy Model', href: '/docs#privacy' },
                { label: 'Fhenix Integration', href: '/docs#fhenix' },
                { label: 'Testing', href: '/docs#testing' },
              ].map((l) => (
                <li key={l.href}>
                  <Link href={l.href} className="text-sm text-white/30 hover:text-white/60 transition-colors">
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className="text-xs font-semibold text-white/50 uppercase tracking-wider mb-3">Resources</p>
            <ul className="space-y-2">
              {[
                { label: 'Fhenix Docs', href: 'https://docs.fhenix.zone' },
                { label: 'CoFHE SDK', href: 'https://github.com/FhenixProtocol' },
                { label: 'GitHub', href: 'https://github.com/your-org/payshield' },
              ].map((l) => (
                <li key={l.href}>
                  <a
                    href={l.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-white/30 hover:text-white/60 transition-colors"
                  >
                    {l.label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-white/5 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-white/20">
            © 2025 PayShield. MIT License. Buildathon MVP — not for production use.
          </p>
          <p className="text-xs text-white/20">
            Built with Fhenix CoFHE · Encrypted by default
          </p>
        </div>
      </div>
    </footer>
  );
}

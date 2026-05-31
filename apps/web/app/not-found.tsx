import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-6">
      <div className="text-center space-y-6 max-w-sm">
        {/* Encrypted 404 visual */}
        <div className="space-y-2">
          <div className="text-6xl font-bold font-display font-mono">
            <span className="gradient-text">4</span>
            <span className="salary-redacted encrypted-pulse text-5xl">●</span>
            <span className="gradient-text">4</span>
          </div>
          <p className="text-white/20 text-xs font-mono">
            0x{Array.from({ length: 16 }, () => Math.floor(Math.random() * 16).toString(16)).join('')}
          </p>
        </div>

        <div>
          <h1 className="text-xl font-bold font-display text-white">Page Not Found</h1>
          <p className="text-white/40 text-sm mt-2">
            This route doesn&apos;t exist — or maybe it&apos;s encrypted.
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <Link href="/" className="btn-primary">
            Back to Home
          </Link>
          <Link href="/demo" className="btn-ghost text-sm">
            Try the Demo
          </Link>
        </div>
      </div>
    </div>
  );
}

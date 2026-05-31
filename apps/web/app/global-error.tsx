'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('PayShield error:', error);
  }, [error]);

  return (
    <html lang="en">
      <body className="bg-[#020408] text-white font-sans min-h-screen flex items-center justify-center px-6">
        <div className="text-center space-y-5 max-w-sm">
          <div className="text-5xl">⚠️</div>
          <h2 className="text-xl font-bold">Something went wrong</h2>
          <p className="text-white/40 text-sm">
            {error?.message ?? 'An unexpected error occurred.'}
          </p>
          {error?.digest && (
            <p className="text-xs text-white/20 font-mono">{error.digest}</p>
          )}
          <button
            onClick={reset}
            className="mt-4 px-6 py-2.5 rounded-xl bg-cyan-500/20 border border-cyan-500/30 text-cyan-400 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
          >
            Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

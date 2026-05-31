'use client';

import React from 'react';

interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({ title, description, icon, action, className = '' }: EmptyStateProps) {
  return (
    <div
      className={`glass rounded-xl p-12 flex flex-col items-center justify-center text-center gap-4 ${className}`}
    >
      {icon && <div className="text-white/20 text-5xl mb-2">{icon}</div>}
      <h3 className="text-lg font-semibold text-white/60">{title}</h3>
      {description && <p className="text-sm text-white/30 max-w-xs">{description}</p>}
      {action && <div className="mt-2">{action}</div>}
    </div>
  );
}

interface LoadingStateProps {
  message?: string;
  className?: string;
}

export function LoadingState({ message = 'Loading...', className = '' }: LoadingStateProps) {
  return (
    <div className={`flex flex-col items-center justify-center gap-4 py-16 ${className}`}>
      <div className="relative">
        <div className="w-10 h-10 rounded-full border-2 border-white/10 border-t-cyan-400 animate-spin" />
        <div className="absolute inset-0 w-10 h-10 rounded-full border-2 border-transparent border-b-mint/40 animate-spin [animation-duration:1.5s]" />
      </div>
      <p className="text-sm text-white/40 animate-pulse">{message}</p>
    </div>
  );
}

interface EncryptionProgressProps {
  step: 'idle' | 'encrypting' | 'signing' | 'submitting' | 'confirming' | 'done';
}

export function EncryptionProgress({ step }: EncryptionProgressProps) {
  const steps = [
    { id: 'encrypting', label: 'Encrypting salary with FHE' },
    { id: 'signing', label: 'Sign transaction' },
    { id: 'submitting', label: 'Submitting to blockchain' },
    { id: 'confirming', label: 'Confirming on-chain' },
  ];

  const currentIndex = steps.findIndex((s) => s.id === step);

  if (step === 'idle') return null;

  return (
    <div className="glass rounded-xl p-5 space-y-3">
      <p className="text-xs font-semibold text-cyan-400 uppercase tracking-widest">
        🔐 FHE Encryption in Progress
      </p>
      <div className="space-y-2">
        {steps.map((s, i) => {
          const isDone = i < currentIndex || step === 'done';
          const isActive = s.id === step;
          return (
            <div key={s.id} className="flex items-center gap-3">
              <div
                className={`w-5 h-5 rounded-full flex items-center justify-center text-xs flex-shrink-0 ${
                  isDone
                    ? 'bg-emerald-500 text-white'
                    : isActive
                    ? 'border-2 border-cyan-400 animate-pulse'
                    : 'border border-white/20'
                }`}
              >
                {isDone ? '✓' : isActive ? '' : ''}
              </div>
              <span
                className={`text-sm ${
                  isDone ? 'text-white/50 line-through' : isActive ? 'text-white' : 'text-white/30'
                }`}
              >
                {s.label}
              </span>
              {isActive && (
                <div className="w-3 h-3 rounded-full border border-t-cyan-400 animate-spin border-white/20 ml-auto" />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

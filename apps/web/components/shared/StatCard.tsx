'use client';

import React from 'react';

interface StatCardProps {
  label: string;
  value: string | React.ReactNode;
  subValue?: string;
  icon?: React.ReactNode;
  encrypted?: boolean;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
  className?: string;
}

export function StatCard({
  label,
  value,
  subValue,
  icon,
  encrypted = false,
  trend,
  trendValue,
  className = '',
}: StatCardProps) {
  return (
    <div className={`glass rounded-xl p-5 flex flex-col gap-3 ${className}`}>
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-white/40 uppercase tracking-widest">{label}</span>
        {icon && <span className="text-white/30">{icon}</span>}
      </div>

      <div className="flex items-end gap-2">
        <div className={`text-2xl font-bold font-display ${encrypted ? 'text-cyan-400' : 'text-white'}`}>
          {encrypted ? (
            <span className="salary-redacted encrypted-pulse">{value}</span>
          ) : (
            value
          )}
        </div>
        {trendValue && (
          <span
            className={`text-xs font-medium mb-1 ${
              trend === 'up'
                ? 'text-emerald-400'
                : trend === 'down'
                ? 'text-red-400'
                : 'text-white/40'
            }`}
          >
            {trend === 'up' ? '↑' : trend === 'down' ? '↓' : ''} {trendValue}
          </span>
        )}
      </div>

      {subValue && <p className="text-xs text-white/40">{subValue}</p>}
    </div>
  );
}

'use client';

import React from 'react';
import { LucideIcon, TrendingUp, TrendingDown } from 'lucide-react';

interface KpiCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    label?: string;
    isPositiveGood?: boolean; // default true
  };
  badge?: {
    text: string;
    variant: 'healthy' | 'watch' | 'action_needed' | 'neutral';
  };
  onClick?: () => void;
  accentColor?: 'emerald' | 'amber' | 'rose' | 'indigo' | 'blue' | 'slate';
}

export function KpiCard({
  title,
  value,
  subtitle,
  icon: Icon,
  trend,
  badge,
  onClick,
  accentColor = 'slate',
}: KpiCardProps) {
  const accentClasses = {
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/20',
    indigo: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20',
    blue: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    slate: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20',
  }[accentColor];

  const badgeClasses = {
    healthy: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800',
    watch: 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300 border-amber-200 dark:border-amber-800',
    action_needed: 'bg-rose-100 text-rose-800 dark:bg-rose-950/60 dark:text-rose-300 border-rose-200 dark:border-rose-800',
    neutral: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border-slate-200 dark:border-slate-700',
  }[badge?.variant || 'neutral'];

  return (
    <div
      onClick={onClick}
      className={`relative p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/90 dark:border-slate-800 shadow-xs transition-all hover:shadow-md ${
        onClick ? 'cursor-pointer hover:border-slate-300 dark:hover:border-slate-700' : ''
      }`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold text-slate-500 dark:text-slate-400 tracking-wide uppercase">
            {title}
          </p>
          <h3 className="mt-1.5 text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            {value}
          </h3>
        </div>

        <div className={`p-2.5 rounded-xl border ${accentClasses}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800/60">
        {trend !== undefined && (
          <div
            className={`inline-flex items-center gap-0.5 text-xs font-bold ${
              (trend.isPositiveGood ?? true)
                ? trend.value >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
                : trend.value <= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {trend.value >= 0 ? (
              <TrendingUp className="w-3.5 h-3.5" />
            ) : (
              <TrendingDown className="w-3.5 h-3.5" />
            )}
            <span>
              {trend.value > 0 ? '+' : ''}
              {trend.value.toFixed(1)}%
            </span>
            {trend.label && (
              <span className="text-slate-400 font-normal ml-0.5">({trend.label})</span>
            )}
          </div>
        )}

        {badge && (
          <span className={`px-2 py-0.5 text-[11px] font-bold rounded-full border ${badgeClasses}`}>
            {badge.text}
          </span>
        )}

        {subtitle && (
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {subtitle}
          </span>
        )}
      </div>
    </div>
  );
}

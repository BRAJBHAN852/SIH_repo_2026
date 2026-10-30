'use client';

import React from 'react';
import { Calendar } from 'lucide-react';
import { DateRangeKey } from '@/lib/types';

interface DateRangeFilterProps {
  currentRange: DateRangeKey;
  onRangeChange: (range: DateRangeKey) => void;
  subtitle?: string;
}

const RANGES: { key: DateRangeKey; label: string; periodLabel: string }[] = [
  { key: 'last_7_days', label: 'Last 7 Days', periodLabel: 'Past 1 week' },
  { key: 'last_30_days', label: 'Last 30 Days', periodLabel: 'Past 1 month' },
  { key: 'last_3_months', label: 'Last 3 Months', periodLabel: 'Past 90 days' },
  { key: 'last_6_months', label: 'Last 6 Months', periodLabel: 'Full 180-day history' },
];

export function DateRangeFilter({ currentRange, onRangeChange, subtitle }: DateRangeFilterProps) {
  const activeObj = RANGES.find(r => r.key === currentRange) || RANGES[1];

  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6 bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
      <div className="flex items-center gap-2 text-slate-700 dark:text-slate-300">
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <div>
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400">
            Analytics Window:
          </span>{' '}
          <span className="text-xs font-bold text-slate-900 dark:text-white">
            {activeObj.label} ({activeObj.periodLabel})
          </span>
          {subtitle && (
            <span className="block sm:inline sm:ml-2 text-xs text-slate-500 dark:text-slate-400">
              · {subtitle}
            </span>
          )}
        </div>
      </div>

      <div className="inline-flex rounded-lg bg-white dark:bg-slate-900 p-1 border border-slate-200 dark:border-slate-700 shadow-2xs">
        {RANGES.map((r) => {
          const isActive = currentRange === r.key;
          return (
            <button
              key={r.key}
              onClick={() => onRangeChange(r.key)}
              className={`px-3 py-1.2 text-xs font-medium rounded-md transition-all cursor-pointer whitespace-nowrap ${
                isActive
                  ? 'bg-emerald-600 text-white shadow-xs font-semibold'
                  : 'text-slate-600 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-200'
              }`}
            >
              {r.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

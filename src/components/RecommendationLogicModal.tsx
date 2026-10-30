'use client';

import React from 'react';
import { X, HelpCircle, CheckCircle2, AlertTriangle, AlertCircle, Sparkles } from 'lucide-react';

interface RecommendationLogicModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RecommendationLogicModal({ isOpen, onClose }: RecommendationLogicModalProps) {
  if (!isOpen) return null;

  const rules = [
    {
      category: 'Inventory',
      name: 'Critical Stockout Risk (High Sales + Low Stock)',
      formula: 'Current Stock ≤ Reorder Level AND (Units Sold Last 30d / 30) ≥ 0.4 units/day',
      example: 'Honey has 5 units remaining (reorder level: 18) and sells 2.1 units/day (~2 days left).',
      action: 'Emergency vendor restock order before stock completely runs out.',
      badge: 'Action Needed (Red)',
    },
    {
      category: 'Inventory',
      name: 'Reorder Level Breached',
      formula: 'Current Stock ≤ Reorder Level',
      example: 'Kumkumadi Serum has only 3 units in stock, which is ≤ reorder threshold of 14.',
      action: 'Create standard purchase replenishment order.',
      badge: 'Action Needed (Red)',
    },
    {
      category: 'Inventory',
      name: 'Slow-Moving Stock Trap (Capital Locked)',
      formula: 'Current Stock ≥ 2.5 × Reorder Level AND Units Sold Last 30d ≤ 3',
      example: 'Brass Peacock Diya has 42 units in stock (₹32,760 capital) with only 2 sold in 30 days.',
      action: 'Launch 10%-15% weekend bundle discount or promo to free up cash.',
      badge: 'Watch (Yellow)',
    },
    {
      category: 'Expenses',
      name: 'Marketing Inefficiency (Spend Rose while Revenue Fell)',
      formula: 'Marketing Expenses (Recent 30d) > Prior 30d by >5% AND Total Revenue (Recent 30d) < Prior 30d',
      example: 'Marketing spend spiked by 42% (₹24k → ₹34k), but sales revenue decreased by 6%.',
      action: 'Audit advertising campaigns and stop underperforming ad creatives.',
      badge: 'Action Needed (Red)',
    },
    {
      category: 'Profitability',
      name: 'Profit Margin Squeeze',
      formula: '((Total Revenue - Total Expenses) / Total Revenue) × 100 < 15%',
      example: 'Net Profit margin fell below 15% retail baseline buffer.',
      action: 'Review overhead waste, negotiate vendor bulk rates, or make minor retail price adjustments.',
      badge: 'Action Needed (Red)',
    },
    {
      category: 'Expenses',
      name: 'Single Expense Category Concentration Risk',
      formula: '(Category Amount / Total Operational Expenses) × 100 ≥ 30%',
      example: 'Rent or Salaries alone accounts for >30% of total expenses.',
      action: 'Review lease terms or optimize staff scheduling around peak retail footfall hours.',
      badge: 'Watch (Yellow)',
    },
    {
      category: 'Sales',
      name: 'Sales Momentum Dip (Declining Products)',
      formula: 'Prior 30d Units ≥ 8 AND Recent 30d Units < Prior 30d Units × 0.70 (>30% drop)',
      example: 'Product dropped from 24 units sold to 12 units sold month-over-month.',
      action: 'Reposition display on eye-level shelves or investigate competing market prices.',
      badge: 'Watch (Yellow)',
    },
    {
      category: 'Profitability',
      name: 'High-Margin Growth Star',
      formula: 'Gross Margin % ≥ 48% AND Units Sold Last 30d ≥ 8 AND Stock > Reorder Level',
      example: 'Chanderi Stole has 52% gross margin and steady demand.',
      action: 'Promote at counter checkout and WhatsApp customer broadcasts.',
      badge: 'Opportunity (Indigo/Green)',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-3xl w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="p-6 bg-gradient-to-r from-emerald-600 to-teal-700 text-white flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-2xl bg-white/15 backdrop-blur-xs text-white">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-lg font-bold">
                Small Business Brain: Recommendation Logic Guide
              </h3>
              <p className="text-xs text-emerald-100 mt-0.5">
                Transparent explanation of all rule triggers, mathematical formulas, and business thresholds
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto space-y-4 text-xs">
          <div className="p-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-emerald-900 dark:text-emerald-300">
            <h4 className="font-bold flex items-center gap-1.5 text-xs">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>100% Explainable & Rule-Based</span>
            </h4>
            <p className="text-[11px] mt-1 leading-relaxed text-emerald-800 dark:text-emerald-400">
              Unlike black-box AI models that can hallucinate advice, Small Business Brain operates strictly on deterministic business logic and retail industry thresholds. Every recommendation is traceable to exact database metrics.
            </p>
          </div>

          <div className="space-y-3">
            {rules.map((rule, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/80 space-y-2"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 text-[10px] font-bold uppercase rounded bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-300">
                      {rule.category}
                    </span>
                    <h5 className="font-bold text-slate-900 dark:text-white text-xs">
                      {rule.name}
                    </h5>
                  </div>
                  <span className="px-2 py-0.5 text-[10px] font-bold rounded-full bg-slate-900 text-white dark:bg-white dark:text-slate-900">
                    {rule.badge}
                  </span>
                </div>

                <div className="p-2.5 rounded-xl bg-white dark:bg-slate-900 font-mono text-[11px] text-slate-800 dark:text-slate-200 border border-slate-200/80 dark:border-slate-800">
                  <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rule: </span>
                  {rule.formula}
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600 dark:text-slate-400 pt-1">
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Scenario: </span>
                    {rule.example}
                  </div>
                  <div>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">Owner Action: </span>
                    {rule.action}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 bg-slate-50 dark:bg-slate-800/80 border-t border-slate-200 dark:border-slate-800 flex justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 dark:hover:bg-white transition-colors cursor-pointer"
          >
            Got It
          </button>
        </div>
      </div>
    </div>
  );
}

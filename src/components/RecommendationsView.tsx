'use client';

import React, { useEffect, useState } from 'react';
import { 
  Sparkles, 
  AlertTriangle, 
  AlertCircle, 
  TrendingUp, 
  ArrowRight, 
  CheckCircle2, 
  HelpCircle,
  Package,
  Receipt,
  Tag,
  Percent,
  Layers,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { Recommendation, RecommendationCategory, RecommendationSeverity } from '@/lib/types';
import { getStatusBadge } from '@/lib/formatters';

interface RecommendationsViewProps {
  onNavigateTab: (tab: string) => void;
  openLogicModal: () => void;
  openDataEntryModal: (type: 'sale' | 'product' | 'expense') => void;
}

interface RecommendationsResponse {
  recommendations: Recommendation[];
  counts: {
    total: number;
    actionNeeded: number;
    watch: number;
    opportunity: number;
  };
}

export function RecommendationsView({
  onNavigateTab,
  openLogicModal,
  openDataEntryModal,
}: RecommendationsViewProps) {
  const [data, setData] = useState<RecommendationsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [categoryFilter, setCategoryFilter] = useState<'all' | RecommendationCategory>('all');
  const [severityFilter, setSeverityFilter] = useState<'all' | RecommendationSeverity>('all');
  const [expandedCard, setExpandedCard] = useState<string | null>(null);

  const fetchRecommendations = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/recommendations');
      if (!res.ok) throw new Error('Failed to load recommendations');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const filteredRecs = (data?.recommendations || []).filter((r) => {
    const matchCat = categoryFilter === 'all' || r.category === categoryFilter;
    const matchSev = severityFilter === 'all' || r.severity === severityFilter;
    return matchCat && matchSev;
  });

  const toggleExpand = (id: string) => {
    setExpandedCard(prev => prev === id ? null : id);
  };

  const getCategoryIcon = (cat: RecommendationCategory) => {
    switch (cat) {
      case 'Inventory':
        return Package;
      case 'Expenses':
        return Receipt;
      case 'Sales':
        return TrendingUp;
      case 'Profitability':
        return Percent;
      default:
        return Sparkles;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-700 to-slate-900 text-white shadow-lg shadow-emerald-900/10">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/15 text-emerald-200 text-xs font-semibold backdrop-blur-xs">
              <Sparkles className="w-3.5 h-3.5 text-emerald-300" />
              <span>Deterministic Rule-Based Intelligence</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight">
              Actionable Business Brain
            </h2>
            <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl">
              Concrete operational recommendations calculated from live sales, inventory run-rates, and expense concentration ratios — zero AI hallucination or guesswork.
            </p>
          </div>

          <button
            onClick={openLogicModal}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-bold rounded-xl bg-white text-slate-900 hover:bg-emerald-50 transition-colors self-start md:self-center shadow-md cursor-pointer"
          >
            <HelpCircle className="w-4 h-4 text-emerald-600" />
            <span>How Each Rule is Calculated</span>
          </button>
        </div>

        {/* Counter Pills */}
        {data && (
          <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-4 border-t border-white/10">
            <div className="p-3 rounded-xl bg-white/10 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Total Insights
              </span>
              <p className="text-xl font-extrabold text-white mt-0.5">{data.counts.total}</p>
            </div>

            <div className="p-3 rounded-xl bg-rose-500/20 border border-rose-300/20 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-rose-200 tracking-wider">
                Action Needed (Red)
              </span>
              <p className="text-xl font-extrabold text-rose-100 mt-0.5">{data.counts.actionNeeded}</p>
            </div>

            <div className="p-3 rounded-xl bg-amber-500/20 border border-amber-300/20 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-amber-200 tracking-wider">
                Watch (Yellow)
              </span>
              <p className="text-xl font-extrabold text-amber-100 mt-0.5">{data.counts.watch}</p>
            </div>

            <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-300/20 backdrop-blur-xs">
              <span className="text-[10px] uppercase font-bold text-emerald-200 tracking-wider">
                Opportunities
              </span>
              <p className="text-xl font-extrabold text-emerald-100 mt-0.5">{data.counts.opportunity}</p>
            </div>
          </div>
        )}
      </div>

      {/* Filter Toolbar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Category Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Category:</span>
          {(['all', 'Inventory', 'Expenses', 'Sales', 'Profitability'] as const).map((cat) => {
            const isActive = categoryFilter === cat;
            return (
              <button
                key={cat}
                onClick={() => setCategoryFilter(cat)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {cat === 'all' ? 'All Categories' : cat}
              </button>
            );
          })}
        </div>

        {/* Severity Filters */}
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Severity:</span>
          {(['all', 'action_needed', 'watch', 'opportunity'] as const).map((sev) => {
            const isActive = severityFilter === sev;
            const labels = {
              all: 'All Status',
              action_needed: 'Action Needed',
              watch: 'Watch',
              opportunity: 'Opportunities',
            };
            return (
              <button
                key={sev}
                onClick={() => setSeverityFilter(sev)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-emerald-600 text-white font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {labels[sev]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Recommendations Cards Grid */}
      {loading ? (
        <div className="py-16 text-center text-xs text-slate-500">
          Generating rule-based recommendations from store database...
        </div>
      ) : filteredRecs.length === 0 ? (
        <div className="p-12 text-center bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800">
          <CheckCircle2 className="w-10 h-10 text-emerald-500 mx-auto mb-2" />
          <h4 className="text-sm font-bold text-slate-900 dark:text-white">All Clear!</h4>
          <p className="text-xs text-slate-500 mt-1">
            No active recommendations for the selected filter combination.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredRecs.map((rec) => {
            const badge = getStatusBadge(rec.severity);
            const Icon = getCategoryIcon(rec.category);
            const isExpanded = expandedCard === rec.id;

            return (
              <div
                key={rec.id}
                className={`p-5 rounded-2xl bg-white dark:bg-slate-900 border transition-all shadow-xs hover:shadow-md flex flex-col justify-between ${
                  rec.severity === 'action_needed'
                    ? 'border-rose-200 dark:border-rose-900/60'
                    : rec.severity === 'watch'
                    ? 'border-amber-200 dark:border-amber-900/60'
                    : 'border-slate-200 dark:border-slate-800'
                }`}
              >
                <div>
                  {/* Top Header */}
                  <div className="flex items-center justify-between gap-2 mb-3">
                    <div className="flex items-center gap-2">
                      <div className={`p-2 rounded-xl ${
                        rec.severity === 'action_needed'
                          ? 'bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-400'
                          : rec.severity === 'watch'
                          ? 'bg-amber-50 text-amber-600 dark:bg-amber-950/50 dark:text-amber-400'
                          : 'bg-emerald-50 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400'
                      }`}>
                        <Icon className="w-4 h-4" />
                      </div>
                      <div>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          {rec.category}
                        </span>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white leading-tight">
                          {rec.title}
                        </h3>
                      </div>
                    </div>

                    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${badge.bg}`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                      <span>{badge.label}</span>
                    </span>
                  </div>

                  {/* Core Recommendation Message */}
                  <p className="text-xs text-slate-700 dark:text-slate-300 font-medium leading-relaxed bg-slate-50 dark:bg-slate-800/40 p-3 rounded-xl border border-slate-100 dark:border-slate-800">
                    {rec.message}
                  </p>

                  {/* Action prompt */}
                  <div className="mt-3 flex items-start gap-2">
                    <span className="text-[11px] font-bold text-emerald-700 dark:text-emerald-400 shrink-0">
                      Recommended Action:
                    </span>
                    <span className="text-[11px] text-slate-600 dark:text-slate-400">
                      {rec.actionPrompt}
                    </span>
                  </div>
                </div>

                {/* Explanation accordion */}
                <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800/70">
                  <button
                    onClick={() => toggleExpand(rec.id)}
                    className="w-full flex items-center justify-between text-left text-xs font-semibold text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 cursor-pointer"
                  >
                    <span className="flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5 text-slate-400" />
                      <span>How this is calculated</span>
                    </span>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    )}
                  </button>

                  {isExpanded && (
                    <div className="mt-2.5 p-3 rounded-xl bg-slate-100/80 dark:bg-slate-800/80 text-[11px] text-slate-700 dark:text-slate-300 space-y-1.5 border border-slate-200/60 dark:border-slate-700/60 animate-in fade-in-50">
                      <p className="leading-relaxed">
                        <strong className="text-slate-900 dark:text-white">Underlying Rule: </strong>
                        {rec.calculationExplanation}
                      </p>
                      <div className="pt-1 flex items-center justify-between text-[10px] text-slate-500">
                        <span>Metric Trigger: <strong className="text-slate-700 dark:text-slate-200">{rec.metric}</strong></span>
                        <span>Evaluation: Real-time SQLite Query</span>
                      </div>
                    </div>
                  )}

                  {/* Quick Action Link */}
                  <div className="mt-3 flex items-center justify-between">
                    <span className="text-[10px] text-slate-400 font-mono">
                      {rec.relatedEntity ? `${rec.relatedEntity.type}: ${rec.relatedEntity.name}` : 'global metric'}
                    </span>

                    {rec.category === 'Inventory' ? (
                      <button
                        onClick={() => onNavigateTab('inventory')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 cursor-pointer"
                      >
                        <span>Manage Stock</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : rec.category === 'Expenses' ? (
                      <button
                        onClick={() => onNavigateTab('expenses')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-rose-600 hover:text-rose-700 dark:text-rose-400 cursor-pointer"
                      >
                        <span>Audit Expenses</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    ) : (
                      <button
                        onClick={() => onNavigateTab('sales')}
                        className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 cursor-pointer"
                      >
                        <span>View Sales</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

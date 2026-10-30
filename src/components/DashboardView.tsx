'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  Receipt, 
  Wallet, 
  Percent, 
  Package, 
  AlertTriangle,
  ArrowRight,
  Sparkles,
  ShoppingBag,
  PieChart as PieIcon
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend 
} from 'recharts';
import { DashboardMetrics, DateRangeKey } from '@/lib/types';
import { formatINR, formatNumber } from '@/lib/formatters';
import { KpiCard } from './KpiCard';
import { DateRangeFilter } from './DateRangeFilter';

interface DashboardViewProps {
  currentRange: DateRangeKey;
  onRangeChange: (range: DateRangeKey) => void;
  onNavigateTab: (tab: string) => void;
  actionNeededCount: number;
}

export function DashboardView({
  currentRange,
  onRangeChange,
  onNavigateTab,
  actionNeededCount,
}: DashboardViewProps) {
  const [data, setData] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`/api/dashboard?range=${currentRange}`);
      if (!res.ok) throw new Error('Failed to load dashboard metrics');
      const json = await res.json();
      setData(json);
    } catch (err: any) {
      setError(err.message || 'Error loading dashboard');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
  }, [currentRange]);

  if (loading && !data) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[420px] space-y-3">
        <div className="w-10 h-10 border-4 border-emerald-500/20 border-t-emerald-600 rounded-full animate-spin" />
        <p className="text-sm font-medium text-slate-500">Calculating small business metrics...</p>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="p-6 rounded-2xl bg-rose-50 border border-rose-200 text-rose-800 text-center my-6">
        <p className="font-semibold">Unable to load dashboard data</p>
        <p className="text-xs mt-1 text-rose-600">{error}</p>
        <button
          onClick={fetchMetrics}
          className="mt-3 px-4 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Determine profit margin health badge
  const marginBadgeVariant = data.profitMargin >= 20 ? 'healthy' : data.profitMargin >= 15 ? 'watch' : 'action_needed';
  const marginBadgeText = data.profitMargin >= 20 ? 'Healthy (≥20%)' : data.profitMargin >= 15 ? 'Moderate (15-20%)' : 'Low (<15%)';

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <DateRangeFilter
        currentRange={currentRange}
        onRangeChange={onRangeChange}
        subtitle="Real-time aggregation from SQLite database"
      />

      {/* Action banner if critical recommendations exist */}
      {actionNeededCount > 0 && (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-rose-500/10 via-amber-500/10 to-transparent border border-rose-200 dark:border-rose-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-rose-500 text-white shrink-0">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <span>The Brain generated {actionNeededCount} urgent action items</span>
                <span className="px-2 py-0.5 text-[11px] font-bold rounded-full bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                  Action Required
                </span>
              </h4>
              <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                Critical alerts detected for stock depletion, marketing efficiency, or expense concentration.
              </p>
            </div>
          </div>

          <button
            onClick={() => onNavigateTab('recommendations')}
            className="inline-flex items-center justify-center gap-1 px-4 py-2 text-xs font-bold rounded-xl bg-rose-600 hover:bg-rose-700 text-white shadow-xs transition-colors shrink-0 cursor-pointer"
          >
            <span>Review Insights</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* 1. Total Revenue */}
        <KpiCard
          title="Total Revenue"
          value={formatINR(data.totalRevenue)}
          icon={TrendingUp}
          accentColor="emerald"
          trend={{
            value: data.momGrowth.revenueGrowthPct,
            label: 'MoM',
            isPositiveGood: true,
          }}
          subtitle={`${formatNumber(data.totalUnitsSold)} units sold`}
        />

        {/* 2. Total Expenses */}
        <KpiCard
          title="Total Expenses"
          value={formatINR(data.totalExpenses)}
          icon={Receipt}
          accentColor="rose"
          subtitle={`Expense ratio: ${data.expenseToRevenueRatio}%`}
          badge={{
            text: data.expenseToRevenueRatio > 70 ? 'High Cost' : 'Controlled',
            variant: data.expenseToRevenueRatio > 70 ? 'watch' : 'healthy',
          }}
        />

        {/* 3. Net Profit */}
        <KpiCard
          title="Net Profit"
          value={formatINR(data.netProfit)}
          icon={Wallet}
          accentColor={data.netProfit >= 0 ? 'emerald' : 'rose'}
          badge={{
            text: data.netProfit >= 0 ? 'Profitable' : 'Loss',
            variant: data.netProfit >= 0 ? 'healthy' : 'action_needed',
          }}
          subtitle={`AOV: ${formatINR(data.averageOrderValue)}`}
        />

        {/* 4. Profit Margin */}
        <KpiCard
          title="Net Profit Margin"
          value={`${data.profitMargin}%`}
          icon={Percent}
          accentColor={data.profitMargin >= 15 ? 'emerald' : 'amber'}
          badge={{
            text: marginBadgeText,
            variant: marginBadgeVariant,
          }}
          subtitle="Net Profit / Total Revenue"
        />

        {/* 5. Inventory Valuation */}
        <KpiCard
          title="Inventory Asset Value"
          value={formatINR(data.inventoryValue)}
          icon={Package}
          accentColor="indigo"
          subtitle="At procurement cost price"
          onClick={() => onNavigateTab('inventory')}
        />

        {/* 6. Low Stock Count */}
        <KpiCard
          title="Low Stock Items"
          value={`${data.lowStockCount} Products`}
          icon={AlertTriangle}
          accentColor={data.lowStockCount > 0 ? 'amber' : 'emerald'}
          badge={{
            text: data.lowStockCount > 0 ? `${data.lowStockCount} Need Restock` : 'Optimal',
            variant: data.lowStockCount > 0 ? 'action_needed' : 'healthy',
          }}
          subtitle="At or below reorder threshold"
          onClick={() => onNavigateTab('inventory')}
        />
      </div>

      {/* Monthly Revenue vs Expenses Chart */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-4 gap-2">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <span>Monthly Financial Trajectory (Revenue vs. Expenses)</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Compare top-line sales with operational expenditures over the past 6 calendar months
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-emerald-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">Revenue (₹)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-sm bg-rose-500 inline-block" />
              <span className="text-slate-600 dark:text-slate-300">Expenses (₹)</span>
            </div>
          </div>
        </div>

        <div className="h-72 w-full">
          {mounted && data.monthlyTrends && data.monthlyTrends.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data.monthlyTrends}
                margin={{ top: 10, right: 10, left: 15, bottom: 20 }}
              >
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" vertical={false} />
                <XAxis 
                  dataKey="month" 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                />
                <YAxis 
                  tick={{ fontSize: 11, fill: '#64748b' }}
                  tickLine={false}
                  axisLine={{ stroke: '#cbd5e1' }}
                  tickFormatter={(val) => `₹${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(value: any, name: any) => [
                    formatINR(Number(value) || 0),
                    name === 'revenue' ? 'Revenue' : 'Expenses',
                  ]}
                  labelStyle={{ fontWeight: 'bold', color: '#0f172a' }}
                  contentStyle={{
                    backgroundColor: '#ffffff',
                    borderColor: '#cbd5e1',
                    borderRadius: '0.75rem',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
                    fontSize: '12px',
                  }}
                />
                <Legend 
                  verticalAlign="top" 
                  align="right"
                  wrapperStyle={{ fontSize: '11px', paddingBottom: '10px' }}
                />
                <Bar 
                  dataKey="revenue" 
                  name="Revenue" 
                  fill="#10b981" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
                <Bar 
                  dataKey="expenses" 
                  name="Expenses" 
                  fill="#f43f5e" 
                  radius={[4, 4, 0, 0]} 
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex items-center justify-center text-xs text-slate-400">
              No monthly trend data available
            </div>
          )}
        </div>
      </div>

      {/* Two Column Grid: Top 5 Best-Selling Products & Top 5 Expense Categories */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top 5 Products */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
                <ShoppingBag className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top 5 Best-Selling Products
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  By total sales revenue in selected period
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('sales')}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 dark:text-emerald-400 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {data.topProducts.map((prod, idx) => (
              <div key={prod.id} className="py-3 flex items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <span className="w-6 h-6 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold text-xs flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-slate-900 dark:text-white truncate">
                      {prod.name}
                    </p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[11px] text-slate-500 dark:text-slate-400">
                        {prod.category}
                      </span>
                      <span className="text-slate-300 dark:text-slate-700">·</span>
                      <span className="text-[11px] font-medium text-slate-600 dark:text-slate-300">
                        {prod.unitsSold} units sold
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0">
                  <p className="text-xs font-bold text-slate-900 dark:text-white">
                    {formatINR(prod.totalRevenue)}
                  </p>
                  <span className={`text-[10px] font-medium px-1.5 py-0.2 rounded-full inline-block mt-0.5 ${
                    prod.currentStock <= 10 
                      ? 'bg-rose-50 text-rose-700 border border-rose-200' 
                      : 'bg-slate-100 text-slate-600'
                  }`}>
                    {prod.currentStock} in stock
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Top 5 Expense Categories */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-lg bg-rose-500/10 text-rose-600 dark:text-rose-400">
                <PieIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Top 5 Expense Categories
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  Major operational cost drivers
                </p>
              </div>
            </div>

            <button
              onClick={() => onNavigateTab('expenses')}
              className="text-xs font-semibold text-rose-600 hover:text-rose-700 dark:text-rose-400 inline-flex items-center gap-1 cursor-pointer"
            >
              <span>View All</span>
              <ArrowRight className="w-3 h-3" />
            </button>
          </div>

          <div className="space-y-3.5">
            {data.topExpenseCategories.map((cat) => (
              <div key={cat.category} className="space-y-1.5">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-semibold text-slate-800 dark:text-slate-200">
                    {cat.category}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 dark:text-white">
                      {formatINR(cat.amount)}
                    </span>
                    <span className="text-[11px] font-semibold text-slate-500 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800">
                      {cat.percentage}%
                    </span>
                  </div>
                </div>

                <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all duration-500 ${
                      cat.percentage >= 30
                        ? 'bg-rose-500'
                        : cat.percentage >= 20
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                    style={{ width: `${Math.min(100, Math.max(3, cat.percentage))}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

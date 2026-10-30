'use client';

import React, { useEffect, useState } from 'react';
import { 
  Receipt, 
  TrendingUp, 
  PieChart as PieIcon, 
  Plus, 
  Search, 
  Filter, 
  Percent, 
  Calendar 
} from 'lucide-react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip, 
  Legend 
} from 'recharts';
import { DateRangeKey, Expense, ExpenseCategory } from '@/lib/types';
import { formatINR, formatDate } from '@/lib/formatters';
import { KpiCard } from './KpiCard';
import { DateRangeFilter } from './DateRangeFilter';

interface ExpensesViewProps {
  currentRange: DateRangeKey;
  onRangeChange: (range: DateRangeKey) => void;
  openDataEntryModal: (type: 'expense') => void;
}

const CATEGORY_COLORS: Record<string, string> = {
  'Rent': '#6366f1', // Indigo
  'Salaries': '#0ea5e9', // Sky blue
  'Marketing': '#f43f5e', // Rose
  'Utilities': '#f59e0b', // Amber
  'Inventory Purchase': '#10b981', // Emerald
  'Transport': '#8b5cf6', // Purple
  'Other': '#64748b', // Slate
};

interface ExpensesResponse {
  expenses: Expense[];
  summary: {
    totalExpenses: number;
    totalRevenue: number;
    expenseToRevenueRatio: number;
    categoryBreakdown: Array<{
      category: ExpenseCategory;
      amount: number;
      count: number;
      percentage: number;
    }>;
    largestCategories: Array<{
      category: ExpenseCategory;
      amount: number;
      percentage: number;
    }>;
  };
}

export function ExpensesView({
  currentRange,
  onRangeChange,
  openDataEntryModal,
}: ExpensesViewProps) {
  const [data, setData] = useState<ExpensesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [search, setSearch] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchExpenses = async () => {
    try {
      setLoading(true);
      const catParam = selectedCategory !== 'all' ? `&category=${encodeURIComponent(selectedCategory)}` : '';
      const searchParam = search.trim() ? `&search=${encodeURIComponent(search.trim())}` : '';
      const res = await fetch(`/api/expenses?range=${currentRange}${catParam}${searchParam}`);
      if (!res.ok) throw new Error('Failed to load expenses');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchExpenses();
  }, [currentRange, selectedCategory, search]);

  const categories: ExpenseCategory[] = [
    'Rent',
    'Salaries',
    'Marketing',
    'Utilities',
    'Inventory Purchase',
    'Transport',
    'Other',
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Expense Analytics & Cost Control
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Categorized overhead tracking, cost concentration warnings, and expense-to-revenue ratio
          </p>
        </div>

        <button
          onClick={() => openDataEntryModal('expense')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-800 dark:hover:bg-slate-700 shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record Expense</span>
        </button>
      </div>

      {/* Date Filter */}
      <DateRangeFilter currentRange={currentRange} onRangeChange={onRangeChange} />

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Expenses"
            value={formatINR(data.summary.totalExpenses)}
            icon={Receipt}
            accentColor="rose"
            subtitle={`Across ${data.expenses.length} recorded items`}
          />

          <KpiCard
            title="Expense-to-Revenue Ratio"
            value={`${data.summary.expenseToRevenueRatio}%`}
            icon={Percent}
            accentColor={data.summary.expenseToRevenueRatio > 70 ? 'rose' : 'emerald'}
            badge={{
              text: data.summary.expenseToRevenueRatio > 70 ? 'High Burn' : 'Healthy Target',
              variant: data.summary.expenseToRevenueRatio > 70 ? 'watch' : 'healthy',
            }}
            subtitle={`Total revenue: ${formatINR(data.summary.totalRevenue)}`}
          />

          <KpiCard
            title="Largest Cost Driver"
            value={data.summary.largestCategories[0]?.category || 'None'}
            icon={PieIcon}
            accentColor="indigo"
            subtitle={`${formatINR(data.summary.largestCategories[0]?.amount || 0)} (${data.summary.largestCategories[0]?.percentage || 0}%)`}
            badge={{
              text: (data.summary.largestCategories[0]?.percentage || 0) > 30 ? 'Concentration Alert' : 'Normal',
              variant: (data.summary.largestCategories[0]?.percentage || 0) > 30 ? 'watch' : 'healthy',
            }}
          />

          <KpiCard
            title="Active Categories"
            value={`${data.summary.categoryBreakdown.length} Categories`}
            icon={TrendingUp}
            accentColor="slate"
            subtitle="Operational expenditure heads"
          />
        </div>
      )}

      {/* Visual Expense Breakdown Section */}
      {data && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* Recharts Pie Chart (5 cols) */}
          <div className="lg:col-span-5 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Expense Distribution by Category
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Relative share of overheads in selected period
            </p>

            <div className="h-64 w-full flex-1">
              {mounted && data.summary.categoryBreakdown.length > 0 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data.summary.categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                    >
                      {data.summary.categoryBreakdown.map((entry) => (
                        <Cell
                          key={entry.category}
                          fill={CATEGORY_COLORS[entry.category] || '#64748b'}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: any) => [formatINR(Number(value) || 0), 'Amount']}
                      contentStyle={{
                        backgroundColor: '#ffffff',
                        borderColor: '#cbd5e1',
                        borderRadius: '0.75rem',
                        fontSize: '12px',
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-full flex items-center justify-center text-xs text-slate-400">
                  No expense records
                </div>
              )}
            </div>
          </div>

          {/* Category breakdown bar list (7 cols) */}
          <div className="lg:col-span-7 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              Category Cost Breakdown & Concentration
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Highlighted cost drivers exceeding 30% concentration threshold
            </p>

            <div className="space-y-3.5">
              {data.summary.categoryBreakdown.map((cat) => {
                const isOver30 = cat.percentage >= 30 && cat.category !== 'Inventory Purchase';
                const barColor = CATEGORY_COLORS[cat.category] || '#64748b';

                return (
                  <div key={cat.category} className="space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span
                          className="w-2.5 h-2.5 rounded-full"
                          style={{ backgroundColor: barColor }}
                        />
                        <span className="font-semibold text-slate-900 dark:text-white">
                          {cat.category}
                        </span>
                        <span className="text-[10px] text-slate-400">
                          ({cat.count} payments)
                        </span>
                        {isOver30 && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                            &gt;30% Concentration Risk
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(cat.amount)}
                        </span>
                        <span className="font-bold text-slate-600 dark:text-slate-300 px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-[11px]">
                          {cat.percentage}%
                        </span>
                      </div>
                    </div>

                    <div className="w-full bg-slate-100 dark:bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${Math.min(100, Math.max(3, cat.percentage))}%`,
                          backgroundColor: barColor,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Expense Ledger Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Expense Transactions Ledger
            </h3>
            <p className="text-xs text-slate-500">
              Filtered expense records and vendor disbursements
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 p-2 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>

            <div className="relative w-full sm:w-56">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search notes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading expenses...</div>
        ) : !data || data.expenses.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No expenses found matching the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Amount</th>
                  <th className="py-3 px-3">Description / Vendor Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.expenses.map((exp) => (
                  <tr key={exp.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatDate(exp.expense_date)}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold"
                        style={{
                          backgroundColor: `${CATEGORY_COLORS[exp.category] || '#64748b'}15`,
                          color: CATEGORY_COLORS[exp.category] || '#64748b',
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: CATEGORY_COLORS[exp.category] || '#64748b' }}
                        />
                        <span>{exp.category}</span>
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-rose-600 dark:text-rose-400">
                      {formatINR(exp.amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-600 dark:text-slate-300">
                      {exp.notes || '—'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

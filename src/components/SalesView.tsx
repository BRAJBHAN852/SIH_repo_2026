'use client';

import React, { useEffect, useState } from 'react';
import { 
  TrendingUp, 
  ShoppingBag, 
  DollarSign, 
  Search, 
  TrendingDown, 
  AlertCircle,
  Plus,
  Calendar,
  Layers
} from 'lucide-react';
import { DateRangeKey, Sale } from '@/lib/types';
import { formatINR, formatNumber, formatDate } from '@/lib/formatters';
import { KpiCard } from './KpiCard';
import { DateRangeFilter } from './DateRangeFilter';

interface SalesViewProps {
  currentRange: DateRangeKey;
  onRangeChange: (range: DateRangeKey) => void;
  openDataEntryModal: (type: 'sale') => void;
}

interface SalesResponse {
  sales: Sale[];
  metrics: {
    totalRevenue: number;
    totalUnitsSold: number;
    totalOrders: number;
    averageOrderValue: number;
    momRevenueGrowth: number;
    momUnitsGrowth: number;
  };
  decliningProducts: Array<{
    id: number;
    name: string;
    category: string;
    current_stock: number;
    current_30d_units: number;
    previous_30d_units: number;
    current_30d_revenue: number;
    previous_30d_revenue: number;
    declinePct: number;
  }>;
}

export function SalesView({
  currentRange,
  onRangeChange,
  openDataEntryModal,
}: SalesViewProps) {
  const [data, setData] = useState<SalesResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const fetchSales = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/sales?range=${currentRange}&search=${encodeURIComponent(search)}`);
      if (!res.ok) throw new Error('Failed to fetch sales');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSales();
  }, [currentRange, search]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Sales Performance & Transactions
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Track daily customer orders, average order values, and detect declining product lines
          </p>
        </div>

        <button
          onClick={() => openDataEntryModal('sale')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Record New Sale</span>
        </button>
      </div>

      {/* Date Filter */}
      <DateRangeFilter currentRange={currentRange} onRangeChange={onRangeChange} />

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Period Revenue"
            value={formatINR(data.metrics.totalRevenue)}
            icon={TrendingUp}
            accentColor="emerald"
            trend={{
              value: data.metrics.momRevenueGrowth,
              label: 'MoM',
              isPositiveGood: true,
            }}
          />

          <KpiCard
            title="Total Units Sold"
            value={`${formatNumber(data.metrics.totalUnitsSold)} items`}
            icon={ShoppingBag}
            accentColor="blue"
            trend={{
              value: data.metrics.momUnitsGrowth,
              label: 'MoM volume',
              isPositiveGood: true,
            }}
          />

          <KpiCard
            title="Average Order Value (AOV)"
            value={formatINR(data.metrics.averageOrderValue)}
            icon={DollarSign}
            accentColor="indigo"
            subtitle={`Across ${data.metrics.totalOrders} total orders`}
          />

          <KpiCard
            title="Declining Products Alert"
            value={`${data.decliningProducts.length} Products`}
            icon={TrendingDown}
            accentColor={data.decliningProducts.length > 0 ? 'amber' : 'emerald'}
            badge={{
              text: data.decliningProducts.length > 0 ? 'Watch List' : 'Steady',
              variant: data.decliningProducts.length > 0 ? 'watch' : 'healthy',
            }}
            subtitle="Drop in sales vs previous 30 days"
          />
        </div>
      )}

      {/* Products with Declining Sales Section */}
      {data && data.decliningProducts && data.decliningProducts.length > 0 && (
        <div className="p-5 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-amber-500 text-white">
              <TrendingDown className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-900 dark:text-amber-200">
                Products with Declining Sales (Last 30 Days vs Prior 30 Days)
              </h3>
              <p className="text-xs text-amber-700 dark:text-amber-400">
                Identified products that sold fewer units in the last 30 days than the preceding 30 days
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {data.decliningProducts.map((p) => (
              <div
                key={p.id}
                className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-amber-200/80 dark:border-amber-900/40 shadow-2xs"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h4 className="text-xs font-bold text-slate-900 dark:text-white">
                      {p.name}
                    </h4>
                    <span className="text-[10px] text-slate-500 dark:text-slate-400">
                      {p.category}
                    </span>
                  </div>
                  <span className="px-2 py-0.5 text-[11px] font-bold rounded-md bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-300">
                    -{p.declinePct}% drop
                  </span>
                </div>

                <div className="mt-3 flex items-center justify-between text-xs pt-2 border-t border-slate-100 dark:border-slate-800">
                  <div>
                    <span className="text-slate-400 text-[10px] block">Prior 30d</span>
                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                      {p.previous_30d_units} units ({formatINR(p.previous_30d_revenue)})
                    </span>
                  </div>
                  <div className="text-right">
                    <span className="text-slate-400 text-[10px] block">Recent 30d</span>
                    <span className="font-bold text-rose-600 dark:text-rose-400">
                      {p.current_30d_units} units ({formatINR(p.current_30d_revenue)})
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Sales Transactions Ledger */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-600" />
              <span>Sales Transactions Ledger</span>
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Showing recent sales records for the selected period
            </p>
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search product, category, notes..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
            />
          </div>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading sales records...</div>
        ) : !data || data.sales.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No sales transactions found matching criteria.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Date</th>
                  <th className="py-3 px-3">Product</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3 text-right">Qty</th>
                  <th className="py-3 px-3 text-right">Unit Price</th>
                  <th className="py-3 px-3 text-right">Total Amount</th>
                  <th className="py-3 px-3">Payment / Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {data.sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                    <td className="py-3 px-3 whitespace-nowrap text-slate-600 dark:text-slate-400">
                      {formatDate(sale.sale_date)}
                    </td>
                    <td className="py-3 px-3 font-semibold text-slate-900 dark:text-white">
                      {sale.product_name}
                    </td>
                    <td className="py-3 px-3">
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {sale.category}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-slate-800 dark:text-slate-200">
                      {sale.quantity}
                    </td>
                    <td className="py-3 px-3 text-right text-slate-600 dark:text-slate-400">
                      {formatINR(sale.unit_price)}
                    </td>
                    <td className="py-3 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                      {formatINR(sale.total_amount)}
                    </td>
                    <td className="py-3 px-3 text-slate-500 dark:text-slate-400 italic">
                      {sale.notes || '—'}
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

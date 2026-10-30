'use client';

import React, { useEffect, useState } from 'react';
import { 
  Package, 
  AlertTriangle, 
  Clock, 
  Layers, 
  Plus, 
  Search, 
  CheckCircle2,
  TrendingDown,
  Edit2
} from 'lucide-react';
import { Product } from '@/lib/types';
import { formatINR, formatPercent, getStatusBadge } from '@/lib/formatters';
import { KpiCard } from './KpiCard';

interface InventoryViewProps {
  openDataEntryModal: (type: 'product') => void;
  onRefreshData?: () => void;
}

interface InventoryResponse {
  products: Product[];
  summary: {
    totalProducts: number;
    totalInventoryValue: number;
    totalStockUnits: number;
    lowStockCount: number;
    slowMovingCount: number;
    categoryBreakdown: Array<{
      category: string;
      product_count: number;
      total_units: number;
      total_value: number;
    }>;
  };
}

export function InventoryView({ openDataEntryModal }: InventoryViewProps) {
  const [data, setData] = useState<InventoryResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'healthy' | 'watch' | 'action_needed'>('all');
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [newStockInput, setNewStockInput] = useState<number>(0);
  const [updating, setUpdating] = useState(false);

  const fetchInventory = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      if (!res.ok) throw new Error('Failed to fetch inventory');
      const json = await res.json();
      setData(json);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInventory();
  }, []);

  const handleUpdateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    try {
      setUpdating(true);
      const res = await fetch('/api/products', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingProduct.id,
          current_stock: newStockInput,
        }),
      });
      if (!res.ok) throw new Error('Failed to update stock');
      setEditingProduct(null);
      await fetchInventory();
    } catch (err) {
      console.error(err);
      alert('Error updating stock level');
    } finally {
      setUpdating(false);
    }
  };

  const filteredProducts = (data?.products || []).filter((p) => {
    const matchesSearch = 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = statusFilter === 'all' || p.stock_status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 dark:text-white">
            Inventory Health & Stock Velocity
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Real-time stock valuation, run-rate depletion forecasts, and low-stock replenishment alerts
          </p>
        </div>

        <button
          onClick={() => openDataEntryModal('product')}
          className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-xs transition-colors self-start sm:self-auto cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* KPI Cards */}
      {data && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <KpiCard
            title="Total Inventory Value"
            value={formatINR(data.summary.totalInventoryValue)}
            icon={Package}
            accentColor="emerald"
            subtitle={`${formatINR(data.summary.totalStockUnits)} total units in store`}
          />

          <KpiCard
            title="Low Stock / Stockout Risk"
            value={`${data.summary.lowStockCount} Products`}
            icon={AlertTriangle}
            accentColor={data.summary.lowStockCount > 0 ? 'rose' : 'emerald'}
            badge={{
              text: data.summary.lowStockCount > 0 ? 'Action Needed' : 'Safe',
              variant: data.summary.lowStockCount > 0 ? 'action_needed' : 'healthy',
            }}
            subtitle="Current stock ≤ reorder threshold"
          />

          <KpiCard
            title="Slow-Moving Inventory"
            value={`${data.summary.slowMovingCount} Products`}
            icon={Clock}
            accentColor={data.summary.slowMovingCount > 0 ? 'amber' : 'emerald'}
            badge={{
              text: data.summary.slowMovingCount > 0 ? 'Capital Trapped' : 'Fluid',
              variant: data.summary.slowMovingCount > 0 ? 'watch' : 'healthy',
            }}
            subtitle="≤ 2 units sold in 30 days"
          />

          <KpiCard
            title="Product Lines"
            value={`${data.summary.totalProducts} Items`}
            icon={Layers}
            accentColor="indigo"
            subtitle={`Across ${data.summary.categoryBreakdown.length} categories`}
          />
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          <span className="text-xs font-semibold text-slate-500 mr-2">Filter by Status:</span>
          {(['all', 'healthy', 'watch', 'action_needed'] as const).map((status) => {
            const isActive = statusFilter === status;
            const labels = {
              all: 'All Products',
              healthy: 'Healthy',
              watch: 'Watch (Slow)',
              action_needed: 'Action Needed (Low)',
            };
            return (
              <button
                key={status}
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 text-xs font-medium rounded-lg transition-all cursor-pointer ${
                  isActive
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 font-semibold'
                    : 'bg-slate-100 hover:bg-slate-200 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                }`}
              >
                {labels[status]}
              </button>
            );
          })}
        </div>

        <div className="relative w-full md:w-64">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-slate-400" />
          <input
            type="text"
            placeholder="Search product or category..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Product Catalog Table */}
      <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        {loading ? (
          <div className="py-12 text-center text-xs text-slate-500">Loading inventory catalog...</div>
        ) : filteredProducts.length === 0 ? (
          <div className="py-12 text-center text-xs text-slate-400">
            No products match the selected filters.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-slate-800/60 text-slate-600 dark:text-slate-300 uppercase tracking-wider font-semibold border-y border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="py-3 px-3">Product Name</th>
                  <th className="py-3 px-3">Category</th>
                  <th className="py-3 px-3">Stock Level / Reorder</th>
                  <th className="py-3 px-3 text-right">30-Day Sales</th>
                  <th className="py-3 px-3 text-right">Est. Days Remaining</th>
                  <th className="py-3 px-3 text-right">Cost / Selling</th>
                  <th className="py-3 px-3 text-right">Margin %</th>
                  <th className="py-3 px-3 text-center">Health Status</th>
                  <th className="py-3 px-3 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {filteredProducts.map((p) => {
                  const badge = getStatusBadge(p.stock_status || 'healthy');
                  const isStockCritical = p.current_stock <= p.reorder_level;
                  const stockFillPct = Math.min(100, Math.round((p.current_stock / (p.reorder_level * 2.5)) * 100));

                  return (
                    <tr key={p.id} className="hover:bg-slate-50/70 dark:hover:bg-slate-800/40">
                      <td className="py-3.5 px-3">
                        <div className="font-semibold text-slate-900 dark:text-white">
                          {p.name}
                        </div>
                        <div className="text-[10px] text-slate-400">
                          Total Value: {formatINR(p.inventory_value || 0)}
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-slate-600 dark:text-slate-400">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {p.category}
                        </span>
                      </td>

                      <td className="py-3.5 px-3">
                        <div className="flex items-center gap-2">
                          <span className={`font-bold ${isStockCritical ? 'text-rose-600 dark:text-rose-400' : 'text-slate-900 dark:text-white'}`}>
                            {p.current_stock}
                          </span>
                          <span className="text-slate-400">/ reorder at {p.reorder_level}</span>
                        </div>
                        <div className="w-24 bg-slate-100 dark:bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1">
                          <div
                            className={`h-full rounded-full ${
                              isStockCritical ? 'bg-rose-500' : 'bg-emerald-500'
                            }`}
                            style={{ width: `${Math.max(5, stockFillPct)}%` }}
                          />
                        </div>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="font-semibold text-slate-800 dark:text-slate-200">
                          {p.units_sold_30d || 0} units
                        </span>
                        <span className="block text-[10px] text-slate-400">
                          ~{(p.avg_daily_sales || 0).toFixed(1)}/day
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        {p.days_stock_remaining === null || p.days_stock_remaining === undefined ? (
                          <span className="text-slate-400 italic">No recent sales</span>
                        ) : (
                          <span className={`font-bold ${
                            p.days_stock_remaining <= 7 
                              ? 'text-rose-600 dark:text-rose-400' 
                              : p.days_stock_remaining <= 20
                              ? 'text-amber-600 dark:text-amber-400'
                              : 'text-slate-700 dark:text-slate-300'
                          }`}>
                            ~{p.days_stock_remaining} days
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <span className="text-slate-500 line-through mr-1 text-[11px]">
                          {formatINR(p.cost_price)}
                        </span>
                        <span className="font-bold text-slate-900 dark:text-white">
                          {formatINR(p.selling_price)}
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right font-bold text-emerald-600 dark:text-emerald-400">
                        {p.margin_percent}%
                      </td>

                      <td className="py-3.5 px-3 text-center">
                        <span
                          title={p.stock_status_reason}
                          className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border ${badge.bg}`}
                        >
                          <span className={`w-1.5 h-1.5 rounded-full ${badge.dot}`} />
                          <span>{badge.label}</span>
                        </span>
                      </td>

                      <td className="py-3.5 px-3 text-right">
                        <button
                          onClick={() => {
                            setEditingProduct(p);
                            setNewStockInput(p.current_stock);
                          }}
                          className="p-1 rounded-md text-slate-500 hover:text-emerald-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
                          title="Quick update stock"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Quick Stock Update Modal */}
      {editingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-xs p-4">
          <div className="bg-white dark:bg-slate-900 rounded-2xl p-6 max-w-sm w-full border border-slate-200 dark:border-slate-800 shadow-xl">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Update Stock Level
            </h3>
            <p className="text-xs text-slate-500 mt-1">
              Adjust current inventory for <span className="font-semibold text-slate-800 dark:text-slate-200">{editingProduct.name}</span>
            </p>

            <form onSubmit={handleUpdateStock} className="mt-4 space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Current Stock Units
                </label>
                <input
                  type="number"
                  min="0"
                  value={newStockInput}
                  onChange={(e) => setNewStockInput(parseInt(e.target.value, 10) || 0)}
                  className="mt-1 w-full p-2 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                  required
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Reorder threshold is {editingProduct.reorder_level} units.
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingProduct(null)}
                  className="px-3 py-1.5 text-xs font-semibold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={updating}
                  className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-emerald-600 text-white hover:bg-emerald-700 disabled:opacity-50 cursor-pointer"
                >
                  {updating ? 'Saving...' : 'Save Stock'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

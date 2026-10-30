'use client';

import React, { useState, useEffect } from 'react';
import { 
  X, 
  ShoppingBag, 
  Package, 
  Receipt, 
  CheckCircle2, 
  AlertCircle,
  Plus
} from 'lucide-react';
import { Product, ExpenseCategory } from '@/lib/types';
import { formatINR } from '@/lib/formatters';

interface DataEntryModalProps {
  isOpen: boolean;
  initialType: 'sale' | 'product' | 'expense';
  onClose: () => void;
  onSuccess: (message: string) => void;
}

export function DataEntryModal({
  isOpen,
  initialType,
  onClose,
  onSuccess,
}: DataEntryModalProps) {
  const [activeTab, setActiveTab] = useState<'sale' | 'product' | 'expense'>(initialType);
  const [products, setProducts] = useState<Product[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sale form state
  const [saleProductId, setSaleProductId] = useState<number | ''>('');
  const [saleQty, setSaleQty] = useState<number>(1);
  const [saleUnitPrice, setSaleUnitPrice] = useState<number | ''>('');
  const [saleDate, setSaleDate] = useState<string>('');
  const [saleNotes, setSaleNotes] = useState<string>('Walk-in store customer');

  // Product form state
  const [prodName, setProdName] = useState<string>('');
  const [prodCategory, setProdCategory] = useState<string>('Groceries & Foods');
  const [prodCost, setProdCost] = useState<string>('');
  const [prodSell, setProdSell] = useState<string>('');
  const [prodStock, setProdStock] = useState<string>('20');
  const [prodReorder, setProdReorder] = useState<string>('10');

  // Expense form state
  const [expCategory, setExpCategory] = useState<ExpenseCategory>('Marketing');
  const [expAmount, setExpAmount] = useState<string>('');
  const [expDate, setExpDate] = useState<string>('');
  const [expNotes, setExpNotes] = useState<string>('');

  useEffect(() => {
    setActiveTab(initialType);
    setErrorMsg(null);
    const today = new Date().toISOString().split('T')[0];
    setSaleDate(today);
    setExpDate(today);
  }, [initialType, isOpen]);

  // Load products list for the sale dropdown
  useEffect(() => {
    if (isOpen) {
      setLoadingProducts(true);
      fetch('/api/products')
        .then(res => res.json())
        .then(data => {
          if (data?.products) {
            setProducts(data.products);
            if (data.products.length > 0 && saleProductId === '') {
              setSaleProductId(data.products[0].id);
              setSaleUnitPrice(data.products[0].selling_price);
            }
          }
        })
        .catch(err => console.error(err))
        .finally(() => setLoadingProducts(false));
    }
  }, [isOpen]);

  // When selected product changes, prefill selling price
  const handleProductChange = (productId: number) => {
    setSaleProductId(productId);
    const p = products.find(prod => prod.id === productId);
    if (p) {
      setSaleUnitPrice(p.selling_price);
    }
  };

  const selectedProduct = products.find(p => p.id === saleProductId);

  // Submit Sale
  const handleSaleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!saleProductId) {
      setErrorMsg('Please select a product.');
      return;
    }

    if (saleQty <= 0) {
      setErrorMsg('Quantity must be at least 1.');
      return;
    }

    if (selectedProduct && selectedProduct.current_stock < saleQty) {
      setErrorMsg(`Insufficient stock! Only ${selectedProduct.current_stock} units available.`);
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          product_id: saleProductId,
          quantity: saleQty,
          unit_price: Number(saleUnitPrice),
          sale_date: saleDate,
          notes: saleNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record sale');

      onSuccess(json.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording sale');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Product
  const handleProductSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!prodName.trim()) {
      setErrorMsg('Product name is required.');
      return;
    }

    const cost = parseFloat(prodCost);
    const sell = parseFloat(prodSell);
    const stock = parseInt(prodStock, 10);
    const reorder = parseInt(prodReorder, 10);

    if (isNaN(cost) || cost <= 0 || isNaN(sell) || sell <= 0) {
      setErrorMsg('Please enter valid positive cost and selling prices.');
      return;
    }

    if (isNaN(stock) || stock < 0 || isNaN(reorder) || reorder < 0) {
      setErrorMsg('Stock and reorder level must be valid non-negative numbers.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: prodName.trim(),
          category: prodCategory,
          cost_price: cost,
          selling_price: sell,
          current_stock: stock,
          reorder_level: reorder,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to add product');

      onSuccess(json.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error adding product');
    } finally {
      setSubmitting(false);
    }
  };

  // Submit Expense
  const handleExpenseSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    const amt = parseFloat(expAmount);
    if (isNaN(amt) || amt <= 0) {
      setErrorMsg('Please enter a valid positive expense amount.');
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch('/api/expenses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: expCategory,
          amount: amt,
          expense_date: expDate,
          notes: expNotes,
        }),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Failed to record expense');

      onSuccess(json.message);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error recording expense');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="bg-white dark:bg-slate-900 rounded-3xl max-w-lg w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-6">
        {/* Modal Header */}
        <div className="p-5 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Data Entry & Transaction Center
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Instantly refreshes metrics, ratios, and recommendations
            </p>
          </div>

          <button
            onClick={onClose}
            className="p-1 rounded-full text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Selection */}
        <div className="p-3 bg-slate-50 dark:bg-slate-800/50 border-b border-slate-200 dark:border-slate-800 flex space-x-2">
          <button
            onClick={() => { setActiveTab('sale'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'sale'
                ? 'bg-emerald-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Record Sale</span>
          </button>

          <button
            onClick={() => { setActiveTab('expense'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'expense'
                ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
            }`}
          >
            <Receipt className="w-3.5 h-3.5" />
            <span>Log Expense</span>
          </button>

          <button
            onClick={() => { setActiveTab('product'); setErrorMsg(null); }}
            className={`flex-1 py-2 text-xs font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              activeTab === 'product'
                ? 'bg-indigo-600 text-white shadow-xs'
                : 'text-slate-600 hover:bg-slate-200/60 dark:text-slate-400'
            }`}
          >
            <Package className="w-3.5 h-3.5" />
            <span>Add Product</span>
          </button>
        </div>

        {/* Error Alert */}
        {errorMsg && (
          <div className="m-4 p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Form Body */}
        <div className="p-6">
          {/* 1. RECORD SALE FORM */}
          {activeTab === 'sale' && (
            <form onSubmit={handleSaleSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Select Product *
                </label>
                {loadingProducts ? (
                  <div className="p-2 text-xs text-slate-400">Loading catalog...</div>
                ) : (
                  <select
                    value={saleProductId}
                    onChange={(e) => handleProductChange(Number(e.target.value))}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  >
                    <option value="">-- Choose Product --</option>
                    {products.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} ({p.current_stock} in stock) — {formatINR(p.selling_price)}
                      </option>
                    ))}
                  </select>
                )}
                {selectedProduct && (
                  <div className="mt-1 flex items-center justify-between text-[11px] text-slate-500">
                    <span>Available stock: <strong className={selectedProduct.current_stock <= selectedProduct.reorder_level ? 'text-rose-600' : 'text-slate-700 dark:text-slate-200'}>{selectedProduct.current_stock} units</strong></span>
                    <span>Reorder level: {selectedProduct.reorder_level}</span>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Quantity Sold *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={selectedProduct?.current_stock || 9999}
                    value={saleQty}
                    onChange={(e) => setSaleQty(parseInt(e.target.value, 10) || 1)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Unit Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    value={saleUnitPrice}
                    onChange={(e) => setSaleUnitPrice(parseFloat(e.target.value) || '')}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              {/* Total preview pill */}
              <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-800 flex items-center justify-between text-xs">
                <span className="text-emerald-800 dark:text-emerald-300 font-semibold">Total Sale Amount:</span>
                <span className="text-base font-extrabold text-emerald-700 dark:text-emerald-400">
                  {formatINR((typeof saleUnitPrice === 'number' ? saleUnitPrice : 0) * saleQty)}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Sale Date
                  </label>
                  <input
                    type="date"
                    value={saleDate}
                    onChange={(e) => setSaleDate(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Payment / Channel
                  </label>
                  <input
                    type="text"
                    value={saleNotes}
                    onChange={(e) => setSaleNotes(e.target.value)}
                    placeholder="e.g. UPI Scan, Walk-in, Card"
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording & Decrementing Stock...' : 'Confirm & Record Sale'}
                </button>
              </div>
            </form>
          )}

          {/* 2. RECORD EXPENSE FORM */}
          {activeTab === 'expense' && (
            <form onSubmit={handleExpenseSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Expense Category *
                </label>
                <select
                  value={expCategory}
                  onChange={(e) => setExpCategory(e.target.value as ExpenseCategory)}
                  className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="Rent">Rent (Showroom / Warehouse)</option>
                  <option value="Salaries">Salaries & Staff Wages</option>
                  <option value="Marketing">Marketing & Advertising</option>
                  <option value="Utilities">Utilities (Electricity, Internet, Water)</option>
                  <option value="Inventory Purchase">Inventory Purchase (Vendor restock)</option>
                  <option value="Transport">Transport, Freight & Shipping</option>
                  <option value="Other">Other / Packaging / Maintenance</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Amount (₹ INR) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 15000"
                    value={expAmount}
                    onChange={(e) => setExpAmount(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 font-bold text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Date *
                  </label>
                  <input
                    type="date"
                    value={expDate}
                    onChange={(e) => setExpDate(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Notes / Vendor Description
                </label>
                <input
                  type="text"
                  placeholder="e.g. Monthly Meta ads, Store electricity bill, courier freight"
                  value={expNotes}
                  onChange={(e) => setExpNotes(e.target.value)}
                  className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                />
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-slate-900 hover:bg-black text-white dark:bg-slate-100 dark:text-slate-900 shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Recording Expense...' : 'Record Expense'}
                </button>
              </div>
            </form>
          )}

          {/* 3. ADD PRODUCT FORM */}
          {activeTab === 'product' && (
            <form onSubmit={handleProductSubmit} className="space-y-4">
              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Kashmiri Almond Oil (200ml)"
                  value={prodName}
                  onChange={(e) => setProdName(e.target.value)}
                  className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                />
              </div>

              <div>
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Category *
                </label>
                <select
                  value={prodCategory}
                  onChange={(e) => setProdCategory(e.target.value)}
                  className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                  required
                >
                  <option value="Groceries & Foods">Groceries & Foods</option>
                  <option value="Handlooms & Apparel">Handlooms & Apparel</option>
                  <option value="Wellness & Beauty">Wellness & Beauty</option>
                  <option value="Artisanal Home">Artisanal Home</option>
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Cost Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 250"
                    value={prodCost}
                    onChange={(e) => setProdCost(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    min="1"
                    step="0.01"
                    placeholder="e.g. 499"
                    value={prodSell}
                    onChange={(e) => setProdSell(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Initial Stock Units *
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>

                <div>
                  <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                    Reorder Alert Level *
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={prodReorder}
                    onChange={(e) => setProdReorder(e.target.value)}
                    className="mt-1 w-full p-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
                    required
                  />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full py-2.5 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white shadow-md transition-colors disabled:opacity-50 cursor-pointer"
                >
                  {submitting ? 'Adding Product...' : 'Add to Inventory'}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

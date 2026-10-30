'use client';

import React, { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { DashboardView } from '@/components/DashboardView';
import { SalesView } from '@/components/SalesView';
import { InventoryView } from '@/components/InventoryView';
import { ExpensesView } from '@/components/ExpensesView';
import { RecommendationsView } from '@/components/RecommendationsView';
import { DataEntryModal } from '@/components/DataEntryModal';
import { RecommendationLogicModal } from '@/components/RecommendationLogicModal';
import { DateRangeKey } from '@/lib/types';
import { CheckCircle2, AlertTriangle, Sparkles, Store, ShieldCheck } from 'lucide-react';

export default function Home() {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [currentRange, setCurrentRange] = useState<DateRangeKey>('last_30_days');
  const [actionNeededCount, setActionNeededCount] = useState<number>(0);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Modal states
  const [dataEntryOpen, setDataEntryOpen] = useState(false);
  const [dataEntryType, setDataEntryType] = useState<'sale' | 'product' | 'expense'>('sale');
  const [logicModalOpen, setLogicModalOpen] = useState(false);
  const [isReseeding, setIsReseeding] = useState(false);

  // Refresh trigger counter to force child components to refetch when data changes
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch recommendation badge counts
  const updateCounts = async () => {
    try {
      const res = await fetch('/api/recommendations');
      if (res.ok) {
        const json = await res.json();
        setActionNeededCount(json.counts?.actionNeeded || 0);
      }
    } catch (err) {
      console.error('Failed to load recommendation counts:', err);
    }
  };

  useEffect(() => {
    updateCounts();
  }, [refreshKey]);

  // Handle toast notification
  const showToast = (message: string) => {
    setToastMessage(message);
    setRefreshKey((prev) => prev + 1);
    setTimeout(() => {
      setToastMessage(null);
    }, 4500);
  };

  // Open data entry modal with specific tab
  const handleOpenDataEntry = (type: 'sale' | 'product' | 'expense') => {
    setDataEntryType(type);
    setDataEntryOpen(true);
  };

  // Reseed database
  const handleReseed = async () => {
    if (!window.confirm('Reset database with 6 months of fresh realistic Indian retail demo data?')) {
      return;
    }

    try {
      setIsReseeding(true);
      const res = await fetch('/api/seed', { method: 'POST' });
      if (!res.ok) throw new Error('Reseed failed');
      const json = await res.json();
      showToast(json.message || 'Database successfully reseeded!');
    } catch (err: any) {
      alert(err.message || 'Error reseeding database');
    } finally {
      setIsReseeding(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-100/70 dark:bg-slate-950">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed top-5 right-5 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl bg-slate-900 text-white shadow-xl border border-slate-700 animate-in slide-in-from-top-4 fade-in duration-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span className="text-xs font-semibold">{toastMessage}</span>
        </div>
      )}

      {/* Main Header with navigation and action buttons */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        openDataEntryModal={handleOpenDataEntry}
        openLogicModal={() => setLogicModalOpen(true)}
        onReseed={handleReseed}
        isReseeding={isReseeding}
        actionNeededCount={actionNeededCount}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'dashboard' && (
          <DashboardView
            key={`dash-${refreshKey}-${currentRange}`}
            currentRange={currentRange}
            onRangeChange={setCurrentRange}
            onNavigateTab={setActiveTab}
            actionNeededCount={actionNeededCount}
          />
        )}

        {activeTab === 'sales' && (
          <SalesView
            key={`sales-${refreshKey}-${currentRange}`}
            currentRange={currentRange}
            onRangeChange={setCurrentRange}
            openDataEntryModal={handleOpenDataEntry}
          />
        )}

        {activeTab === 'inventory' && (
          <InventoryView
            key={`inv-${refreshKey}`}
            openDataEntryModal={handleOpenDataEntry}
            onRefreshData={() => setRefreshKey((prev) => prev + 1)}
          />
        )}

        {activeTab === 'expenses' && (
          <ExpensesView
            key={`exp-${refreshKey}-${currentRange}`}
            currentRange={currentRange}
            onRangeChange={setCurrentRange}
            openDataEntryModal={handleOpenDataEntry}
          />
        )}

        {activeTab === 'recommendations' && (
          <RecommendationsView
            key={`recs-${refreshKey}`}
            onNavigateTab={setActiveTab}
            openLogicModal={() => setLogicModalOpen(true)}
            openDataEntryModal={handleOpenDataEntry}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="mt-auto py-6 border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 text-slate-500 text-xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Store className="w-4 h-4 text-emerald-600" />
            <span className="font-semibold text-slate-800 dark:text-slate-200">
              Small Business Brain
            </span>
            <span>· Indian Retail Prototype (INR ₹)</span>
          </div>

          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setLogicModalOpen(true)}
              className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline cursor-pointer"
            >
              Formula & Calculation Guide
            </button>
            <span>·</span>
            <span className="text-slate-400">SQLite + Next.js App Router + Recharts</span>
            <span>·</span>
            <span className="text-slate-400">Zero External AI Dependency</span>
          </div>
        </div>
      </footer>

      {/* Data Entry Modal */}
      <DataEntryModal
        isOpen={dataEntryOpen}
        initialType={dataEntryType}
        onClose={() => setDataEntryOpen(false)}
        onSuccess={showToast}
      />

      {/* Recommendation Logic / Formula Guide Modal */}
      <RecommendationLogicModal
        isOpen={logicModalOpen}
        onClose={() => setLogicModalOpen(false)}
      />
    </div>
  );
}

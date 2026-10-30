export interface Product {
  id: number;
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  created_at?: string;
  // Computed analytics fields:
  units_sold_30d?: number;
  revenue_30d?: number;
  avg_daily_sales?: number;
  days_stock_remaining?: number | null; // null if 0 sales
  stock_status?: 'healthy' | 'watch' | 'action_needed';
  stock_status_reason?: string;
  inventory_value?: number; // current_stock * cost_price
  margin_percent?: number; // ((selling - cost) / selling) * 100
}

export interface Sale {
  id: number;
  product_id: number;
  product_name?: string;
  category?: string;
  quantity: number;
  unit_price: number;
  total_amount: number;
  sale_date: string;
  notes?: string;
}

export type ExpenseCategory = 
  | 'Rent'
  | 'Salaries'
  | 'Marketing'
  | 'Utilities'
  | 'Inventory Purchase'
  | 'Transport'
  | 'Other';

export interface Expense {
  id: number;
  category: ExpenseCategory;
  amount: number;
  expense_date: string;
  notes?: string;
  created_at?: string;
}

export type DateRangeKey = 'last_7_days' | 'last_30_days' | 'last_3_months' | 'last_6_months';

export interface DashboardMetrics {
  totalRevenue: number;
  totalExpenses: number;
  netProfit: number;
  profitMargin: number; // percentage
  inventoryValue: number;
  lowStockCount: number;
  totalUnitsSold: number;
  averageOrderValue: number;
  expenseToRevenueRatio: number;
  momGrowth: {
    revenueGrowthPct: number;
    unitsGrowthPct: number;
    prevRevenue: number;
    prevExpenses: number;
  };
  monthlyTrends: Array<{
    month: string;
    monthKey: string;
    revenue: number;
    expenses: number;
    profit: number;
  }>;
  topProducts: Array<{
    id: number;
    name: string;
    category: string;
    unitsSold: number;
    totalRevenue: number;
    currentStock: number;
  }>;
  topExpenseCategories: Array<{
    category: ExpenseCategory;
    amount: number;
    percentage: number;
  }>;
}

export type RecommendationSeverity = 'action_needed' | 'watch' | 'opportunity' | 'healthy';
export type RecommendationCategory = 'Inventory' | 'Sales' | 'Expenses' | 'Profitability';

export interface Recommendation {
  id: string;
  category: RecommendationCategory;
  severity: RecommendationSeverity;
  title: string;
  message: string;
  metric: string;
  actionPrompt: string;
  calculationExplanation: string;
  relatedEntity?: {
    type: 'product' | 'expense_category' | 'overall';
    name: string;
    id?: number;
  };
}

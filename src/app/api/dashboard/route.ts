import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DateRangeKey, ExpenseCategory } from '@/lib/types';
export const dynamic = 'force-dynamic';

function getDateBoundary(range: DateRangeKey): string {
  const d = new Date();
  switch (range) {
    case 'last_7_days':
      d.setDate(d.getDate() - 7);
      break;
    case 'last_30_days':
      d.setDate(d.getDate() - 30);
      break;
    case 'last_3_months':
      d.setDate(d.getDate() - 90);
      break;
    case 'last_6_months':
    default:
      d.setDate(d.getDate() - 180);
      break;
  }
  return d.toISOString().split('T')[0];
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRangeKey) || 'last_30_days';

    const db = getDb();
    const startDate = getDateBoundary(range);
    const today = new Date().toISOString().split('T')[0];

    // 1. Core period totals
    const salesAgg = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COALESCE(SUM(quantity), 0) as totalUnitsSold,
        COALESCE(COUNT(id), 0) as totalOrders
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `).get(startDate, today) as { totalRevenue: number; totalUnitsSold: number; totalOrders: number };

    const expensesAgg = db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as totalExpenses
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `).get(startDate, today) as { totalExpenses: number };

    const inventoryAgg = db.prepare(`
      SELECT 
        COALESCE(SUM(current_stock * cost_price), 0) as inventoryValue,
        COALESCE(COUNT(CASE WHEN current_stock <= reorder_level THEN 1 END), 0) as lowStockCount
      FROM products
    `).get() as { inventoryValue: number; lowStockCount: number };

    const totalRevenue = salesAgg.totalRevenue;
    const totalExpenses = expensesAgg.totalExpenses;
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? (netProfit / totalRevenue) * 100 : 0;
    const averageOrderValue = salesAgg.totalOrders > 0 ? totalRevenue / salesAgg.totalOrders : 0;
    const expenseToRevenueRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

    // 2. Month-over-Month calculation (comparing last 30 days vs prior 30 days)
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const d60 = new Date();
    d60.setDate(d60.getDate() - 60);
    const d30Str = d30.toISOString().split('T')[0];
    const d60Str = d60.toISOString().split('T')[0];

    const prevPeriodSales = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(quantity), 0) as units
      FROM sales
      WHERE sale_date >= ? AND sale_date < ?
    `).get(d60Str, d30Str) as { revenue: number; units: number };

    const currPeriodSales = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as revenue,
        COALESCE(SUM(quantity), 0) as units
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `).get(d30Str, today) as { revenue: number; units: number };

    const prevExpenses = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as expenses
      FROM expenses
      WHERE expense_date >= ? AND expense_date < ?
    `).get(d60Str, d30Str) as { expenses: number }).expenses;

    const revenueGrowthPct = prevPeriodSales.revenue > 0
      ? ((currPeriodSales.revenue - prevPeriodSales.revenue) / prevPeriodSales.revenue) * 100
      : 0;

    const unitsGrowthPct = prevPeriodSales.units > 0
      ? ((currPeriodSales.units - prevPeriodSales.units) / prevPeriodSales.units) * 100
      : 0;

    // 3. Monthly Trends (last 6 months)
    const monthlySales = db.prepare(`
      SELECT 
        strftime('%Y-%m', sale_date) as monthKey,
        SUM(total_amount) as revenue
      FROM sales
      GROUP BY monthKey
      ORDER BY monthKey ASC
    `).all() as Array<{ monthKey: string; revenue: number }>;

    const monthlyExpenses = db.prepare(`
      SELECT 
        strftime('%Y-%m', expense_date) as monthKey,
        SUM(amount) as expenses
      FROM expenses
      GROUP BY monthKey
      ORDER BY monthKey ASC
    `).all() as Array<{ monthKey: string; expenses: number }>;

    const monthMap = new Map<string, { revenue: number; expenses: number }>();

    for (const s of monthlySales) {
      if (!monthMap.has(s.monthKey)) {
        monthMap.set(s.monthKey, { revenue: 0, expenses: 0 });
      }
      monthMap.get(s.monthKey)!.revenue = s.revenue;
    }

    for (const e of monthlyExpenses) {
      if (!monthMap.has(e.monthKey)) {
        monthMap.set(e.monthKey, { revenue: 0, expenses: 0 });
      }
      monthMap.get(e.monthKey)!.expenses = e.expenses;
    }

    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthlyTrends = Array.from(monthMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-6)
      .map(([key, data]) => {
        const [year, month] = key.split('-');
        const monthIndex = parseInt(month, 10) - 1;
        const label = `${monthNames[monthIndex]} '${year.slice(2)}`;
        const profit = data.revenue - data.expenses;
        return {
          month: label,
          monthKey: key,
          revenue: Math.round(data.revenue),
          expenses: Math.round(data.expenses),
          profit: Math.round(profit),
        };
      });

    // 4. Top 5 Best-Selling Products in period
    const topProducts = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.current_stock as currentStock,
        SUM(s.quantity) as unitsSold,
        SUM(s.total_amount) as totalRevenue
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.sale_date >= ? AND s.sale_date <= ?
      GROUP BY p.id
      ORDER BY totalRevenue DESC
      LIMIT 5
    `).all(startDate, today) as Array<{
      id: number;
      name: string;
      category: string;
      currentStock: number;
      unitsSold: number;
      totalRevenue: number;
    }>;

    // 5. Top 5 Highest Expense Categories in period
    const expenseCats = db.prepare(`
      SELECT 
        category,
        SUM(amount) as amount
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
      GROUP BY category
      ORDER BY amount DESC
      LIMIT 5
    `).all(startDate, today) as Array<{ category: ExpenseCategory; amount: number }>;

    const topExpenseCategories = expenseCats.map(cat => ({
      category: cat.category,
      amount: Math.round(cat.amount),
      percentage: totalExpenses > 0 ? Math.round((cat.amount / totalExpenses) * 100) : 0,
    }));

    return NextResponse.json({
      totalRevenue: Math.round(totalRevenue),
      totalExpenses: Math.round(totalExpenses),
      netProfit: Math.round(netProfit),
      profitMargin: Number(profitMargin.toFixed(1)),
      inventoryValue: Math.round(inventoryAgg.inventoryValue),
      lowStockCount: inventoryAgg.lowStockCount,
      totalUnitsSold: salesAgg.totalUnitsSold,
      averageOrderValue: Math.round(averageOrderValue),
      expenseToRevenueRatio: Number(expenseToRevenueRatio.toFixed(1)),
      momGrowth: {
        revenueGrowthPct: Number(revenueGrowthPct.toFixed(1)),
        unitsGrowthPct: Number(unitsGrowthPct.toFixed(1)),
        prevRevenue: Math.round(prevPeriodSales.revenue),
        prevExpenses: Math.round(prevExpenses),
      },
      monthlyTrends,
      topProducts,
      topExpenseCategories,
    });
  } catch (error) {
    console.error('Error fetching dashboard metrics:', error);
    return NextResponse.json({ error: 'Failed to fetch dashboard metrics' }, { status: 500 });
  }
}

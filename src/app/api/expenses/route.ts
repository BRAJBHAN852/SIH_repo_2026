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

const VALID_CATEGORIES: ExpenseCategory[] = [
  'Rent',
  'Salaries',
  'Marketing',
  'Utilities',
  'Inventory Purchase',
  'Transport',
  'Other',
];

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const range = (searchParams.get('range') as DateRangeKey) || 'last_30_days';
    const category = searchParams.get('category') || '';
    const search = searchParams.get('search') || '';

    const db = getDb();
    const startDate = getDateBoundary(range);
    const today = new Date().toISOString().split('T')[0];

    // 1. Fetch expenses list
    let query = `
      SELECT id, category, amount, expense_date, notes, created_at
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `;
    const params: (string | number)[] = [startDate, today];

    if (category.trim()) {
      query += ` AND category = ?`;
      params.push(category.trim());
    }

    if (search.trim()) {
      query += ` AND (notes LIKE ? OR category LIKE ?)`;
      params.push(`%${search.trim()}%`, `%${search.trim()}%`);
    }

    query += ` ORDER BY expense_date DESC, id DESC`;
    const expenses = db.prepare(query).all(...params);

    // 2. Total expenses in period
    const totalExpenses = (db.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
    `).get(startDate, today) as { total: number }).total;

    // 3. Total revenue in period for expense-to-revenue ratio
    const totalRevenue = (db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as total
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `).get(startDate, today) as { total: number }).total;

    const expenseToRevenueRatio = totalRevenue > 0 ? (totalExpenses / totalRevenue) * 100 : 0;

    // 4. Breakdown by category
    const categoryRows = db.prepare(`
      SELECT category, SUM(amount) as amount, COUNT(id) as count
      FROM expenses
      WHERE expense_date >= ? AND expense_date <= ?
      GROUP BY category
      ORDER BY amount DESC
    `).all(startDate, today) as Array<{ category: ExpenseCategory; amount: number; count: number }>;

    const categoryBreakdown = categoryRows.map(row => ({
      category: row.category,
      amount: Math.round(row.amount),
      count: row.count,
      percentage: totalExpenses > 0 ? Number(((row.amount / totalExpenses) * 100).toFixed(1)) : 0,
    }));

    // Largest expense categories (top 3)
    const largestCategories = categoryBreakdown.slice(0, 3);

    // 5. Monthly trend of expenses by category (for stacked bar chart or area chart)
    const monthlyCategoryTrends = db.prepare(`
      SELECT 
        strftime('%Y-%m', expense_date) as monthKey,
        category,
        SUM(amount) as amount
      FROM expenses
      GROUP BY monthKey, category
      ORDER BY monthKey ASC
    `).all() as Array<{ monthKey: string; category: ExpenseCategory; amount: number }>;

    return NextResponse.json({
      expenses,
      summary: {
        totalExpenses: Math.round(totalExpenses),
        totalRevenue: Math.round(totalRevenue),
        expenseToRevenueRatio: Number(expenseToRevenueRatio.toFixed(1)),
        categoryBreakdown,
        largestCategories,
        monthlyCategoryTrends,
      },
    });
  } catch (error) {
    console.error('Error fetching expenses:', error);
    return NextResponse.json({ error: 'Failed to fetch expenses' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { category, amount, expense_date, notes } = body;

    if (!category || !VALID_CATEGORIES.includes(category as ExpenseCategory)) {
      return NextResponse.json(
        { error: `Invalid category. Must be one of: ${VALID_CATEGORIES.join(', ')}` },
        { status: 400 }
      );
    }

    const amt = parseFloat(amount);
    if (isNaN(amt) || amt <= 0) {
      return NextResponse.json({ error: 'Valid positive expense amount is required.' }, { status: 400 });
    }

    const date = expense_date || new Date().toISOString().split('T')[0];
    const now = new Date().toISOString();

    const db = getDb();
    const insert = db.prepare(`
      INSERT INTO expenses (category, amount, expense_date, notes, created_at)
      VALUES (?, ?, ?, ?, ?)
    `).run(category, amt, date, notes?.trim() || null, now);

    return NextResponse.json({
      success: true,
      message: `Recorded expense of ₹${amt.toLocaleString('en-IN')} for ${category}.`,
      expense: {
        id: Number(insert.lastInsertRowid),
        category,
        amount: amt,
        expense_date: date,
        notes: notes?.trim() || null,
      },
    });
  } catch (error) {
    console.error('Error recording expense:', error);
    return NextResponse.json({ error: 'Failed to record expense' }, { status: 500 });
  }
}

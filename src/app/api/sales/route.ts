import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { DateRangeKey } from '@/lib/types';
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
    const search = searchParams.get('search') || '';
    const limit = parseInt(searchParams.get('limit') || '100', 10);

    const db = getDb();
    const startDate = getDateBoundary(range);
    const today = new Date().toISOString().split('T')[0];

    // 1. Sales list with product info
    let query = `
      SELECT 
        s.id,
        s.product_id,
        p.name as product_name,
        p.category,
        s.quantity,
        s.unit_price,
        s.total_amount,
        s.sale_date,
        s.notes
      FROM sales s
      JOIN products p ON s.product_id = p.id
      WHERE s.sale_date >= ? AND s.sale_date <= ?
    `;
    const params: (string | number)[] = [startDate, today];

    if (search.trim()) {
      query += ` AND (p.name LIKE ? OR p.category LIKE ? OR s.notes LIKE ?)`;
      const term = `%${search.trim()}%`;
      params.push(term, term, term);
    }

    query += ` ORDER BY s.sale_date DESC, s.id DESC LIMIT ?`;
    params.push(limit);

    const sales = db.prepare(query).all(...params);

    // 2. Aggregate metrics for sales
    const agg = db.prepare(`
      SELECT 
        COALESCE(SUM(total_amount), 0) as totalRevenue,
        COALESCE(SUM(quantity), 0) as totalUnitsSold,
        COALESCE(COUNT(id), 0) as totalOrders
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `).get(startDate, today) as { totalRevenue: number; totalUnitsSold: number; totalOrders: number };

    const averageOrderValue = agg.totalOrders > 0 ? agg.totalRevenue / agg.totalOrders : 0;

    // 3. Month-over-Month calculation (last 30d vs prior 30d)
    const d30 = new Date();
    d30.setDate(d30.getDate() - 30);
    const d60 = new Date();
    d60.setDate(d60.getDate() - 60);
    const d30Str = d30.toISOString().split('T')[0];
    const d60Str = d60.toISOString().split('T')[0];

    const prev30d = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as rev, COALESCE(SUM(quantity), 0) as units
      FROM sales
      WHERE sale_date >= ? AND sale_date < ?
    `).get(d60Str, d30Str) as { rev: number; units: number };

    const curr30d = db.prepare(`
      SELECT COALESCE(SUM(total_amount), 0) as rev, COALESCE(SUM(quantity), 0) as units
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
    `).get(d30Str, today) as { rev: number; units: number };

    const momRevenueGrowth = prev30d.rev > 0 ? ((curr30d.rev - prev30d.rev) / prev30d.rev) * 100 : 0;
    const momUnitsGrowth = prev30d.units > 0 ? ((curr30d.units - prev30d.units) / prev30d.units) * 100 : 0;

    // 4. Identify products with declining sales over the last 30 days vs preceding 30 days
    const decliningProducts = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.current_stock,
        COALESCE(curr.units, 0) as current_30d_units,
        COALESCE(prev.units, 0) as previous_30d_units,
        COALESCE(curr.rev, 0) as current_30d_revenue,
        COALESCE(prev.rev, 0) as previous_30d_revenue
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as units, SUM(total_amount) as rev
        FROM sales
        WHERE sale_date >= ? AND sale_date <= ?
        GROUP BY product_id
      ) curr ON p.id = curr.product_id
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as units, SUM(total_amount) as rev
        FROM sales
        WHERE sale_date >= ? AND sale_date < ?
        GROUP BY product_id
      ) prev ON p.id = prev.product_id
      WHERE prev.units > 0 AND COALESCE(curr.units, 0) < prev.units
      ORDER BY (prev.units - COALESCE(curr.units, 0)) DESC
    `).all(d30Str, today, d60Str, d30Str) as Array<{
      id: number;
      name: string;
      category: string;
      current_stock: number;
      current_30d_units: number;
      previous_30d_units: number;
      current_30d_revenue: number;
      previous_30d_revenue: number;
    }>;

    const decliningWithPct = decliningProducts.map(p => {
      const declinePct = Math.round(((p.previous_30d_units - p.current_30d_units) / p.previous_30d_units) * 100);
      return {
        ...p,
        declinePct,
      };
    });

    return NextResponse.json({
      sales,
      metrics: {
        totalRevenue: Math.round(agg.totalRevenue),
        totalUnitsSold: agg.totalUnitsSold,
        totalOrders: agg.totalOrders,
        averageOrderValue: Math.round(averageOrderValue),
        momRevenueGrowth: Number(momRevenueGrowth.toFixed(1)),
        momUnitsGrowth: Number(momUnitsGrowth.toFixed(1)),
      },
      decliningProducts: decliningWithPct,
    });
  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { product_id, quantity, unit_price, sale_date, notes } = body;

    if (!product_id || !quantity || quantity <= 0) {
      return NextResponse.json(
        { error: 'Valid product_id and positive quantity are required.' },
        { status: 400 }
      );
    }

    const db = getDb();

    // Check product exists and has stock
    const product = db.prepare('SELECT * FROM products WHERE id = ?').get(product_id) as {
      id: number;
      name: string;
      current_stock: number;
      selling_price: number;
    } | undefined;

    if (!product) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    if (product.current_stock < quantity) {
      return NextResponse.json(
        {
          error: `Insufficient stock for ${product.name}. Available: ${product.current_stock} units, requested: ${quantity}.`,
        },
        { status: 400 }
      );
    }

    const price = typeof unit_price === 'number' && unit_price > 0 ? unit_price : product.selling_price;
    const totalAmount = price * quantity;
    const date = sale_date || new Date().toISOString().split('T')[0];

    // Transaction to insert sale and decrement stock
    const result = db.transaction(() => {
      const insert = db.prepare(`
        INSERT INTO sales (product_id, quantity, unit_price, total_amount, sale_date, notes)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(product_id, quantity, price, totalAmount, date, notes || 'Direct sale recorded');

      db.prepare(`
        UPDATE products 
        SET current_stock = current_stock - ? 
        WHERE id = ?
      `).run(quantity, product_id);

      const updatedProduct = db.prepare('SELECT current_stock, reorder_level FROM products WHERE id = ?').get(product_id);

      return {
        saleId: Number(insert.lastInsertRowid),
        productName: product.name,
        quantity,
        totalAmount,
        updatedProduct,
      };
    })();

    return NextResponse.json({
      success: true,
      message: `Successfully recorded sale of ${quantity} unit(s) of ${product.name} for ₹${totalAmount.toLocaleString('en-IN')}`,
      data: result,
    });
  } catch (error) {
    console.error('Error creating sale:', error);
    return NextResponse.json({ error: 'Failed to record sale' }, { status: 500 });
  }
}

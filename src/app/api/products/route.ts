import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { Product } from '@/lib/types';
export const dynamic = 'force-dynamic';


export async function GET() {
  try {
    const db = getDb();
    const now = new Date();
    const d30 = new Date(now);
    d30.setDate(d30.getDate() - 30);
    const d30Str = d30.toISOString().split('T')[0];
    const todayStr = now.toISOString().split('T')[0];

    // Fetch all products joined with 30-day sales stats
    const rows = db.prepare(`
      SELECT 
        p.id,
        p.name,
        p.category,
        p.cost_price,
        p.selling_price,
        p.current_stock,
        p.reorder_level,
        p.created_at,
        COALESCE(s.units_sold_30d, 0) as units_sold_30d,
        COALESCE(s.revenue_30d, 0) as revenue_30d
      FROM products p
      LEFT JOIN (
        SELECT product_id, SUM(quantity) as units_sold_30d, SUM(total_amount) as revenue_30d
        FROM sales
        WHERE sale_date >= ? AND sale_date <= ?
        GROUP BY product_id
      ) s ON p.id = s.product_id
      ORDER BY p.category ASC, p.name ASC
    `).all(d30Str, todayStr) as Array<Product & { units_sold_30d: number; revenue_30d: number }>;

    let totalInventoryValue = 0;
    let lowStockCount = 0;
    let slowMovingCount = 0;
    let totalStockUnits = 0;

    const products: Product[] = rows.map(r => {
      const inventory_value = r.current_stock * r.cost_price;
      const margin_percent = ((r.selling_price - r.cost_price) / r.selling_price) * 100;
      const avg_daily_sales = r.units_sold_30d / 30;
      const days_stock_remaining = avg_daily_sales > 0 ? Math.round(r.current_stock / avg_daily_sales) : null;

      totalInventoryValue += inventory_value;
      totalStockUnits += r.current_stock;

      let stock_status: 'healthy' | 'watch' | 'action_needed' = 'healthy';
      let stock_status_reason = 'Stock levels healthy';

      const isLowStock = r.current_stock <= r.reorder_level;
      const isSlowMover = r.current_stock >= 15 && r.units_sold_30d <= 2;

      if (isLowStock) {
        lowStockCount++;
        stock_status = 'action_needed';
        stock_status_reason = `At or below reorder level (${r.current_stock}/${r.reorder_level})`;
      } else if (days_stock_remaining !== null && days_stock_remaining <= 7) {
        stock_status = 'action_needed';
        stock_status_reason = `Depleting rapidly (~${days_stock_remaining} days left)`;
      } else if (isSlowMover) {
        slowMovingCount++;
        stock_status = 'watch';
        stock_status_reason = `Slow moving (${r.units_sold_30d} sold in 30d, ${r.current_stock} in stock)`;
      } else if (r.current_stock <= r.reorder_level * 1.4) {
        stock_status = 'watch';
        stock_status_reason = `Approaching reorder threshold (${r.current_stock} left)`;
      }

      return {
        ...r,
        inventory_value: Math.round(inventory_value),
        margin_percent: Number(margin_percent.toFixed(1)),
        avg_daily_sales: Number(avg_daily_sales.toFixed(2)),
        days_stock_remaining,
        stock_status,
        stock_status_reason,
      };
    });

    // Breakdown by category
    const categoryBreakdown = db.prepare(`
      SELECT 
        p.category,
        COUNT(p.id) as product_count,
        SUM(p.current_stock) as total_units,
        SUM(p.current_stock * p.cost_price) as total_value
      FROM products p
      GROUP BY p.category
      ORDER BY total_value DESC
    `).all();

    return NextResponse.json({
      products,
      summary: {
        totalProducts: products.length,
        totalInventoryValue: Math.round(totalInventoryValue),
        totalStockUnits,
        lowStockCount,
        slowMovingCount,
        categoryBreakdown,
      },
    });
  } catch (error) {
    console.error('Error fetching products:', error);
    return NextResponse.json({ error: 'Failed to fetch products' }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, category, cost_price, selling_price, current_stock, reorder_level } = body;

    if (!name?.trim() || !category?.trim()) {
      return NextResponse.json({ error: 'Product name and category are required.' }, { status: 400 });
    }

    const cost = parseFloat(cost_price);
    const sell = parseFloat(selling_price);
    const stock = parseInt(current_stock, 10);
    const reorder = parseInt(reorder_level, 10);

    if (isNaN(cost) || cost < 0 || isNaN(sell) || sell < 0) {
      return NextResponse.json({ error: 'Valid positive cost and selling prices are required.' }, { status: 400 });
    }

    if (isNaN(stock) || stock < 0 || isNaN(reorder) || reorder < 0) {
      return NextResponse.json({ error: 'Valid stock and reorder numbers are required.' }, { status: 400 });
    }

    const db = getDb();
    const now = new Date().toISOString();

    const insert = db.prepare(`
      INSERT INTO products (name, category, cost_price, selling_price, current_stock, reorder_level, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(name.trim(), category.trim(), cost, sell, stock, reorder, now);

    return NextResponse.json({
      success: true,
      message: `Product "${name.trim()}" added successfully.`,
      product: {
        id: Number(insert.lastInsertRowid),
        name: name.trim(),
        category: category.trim(),
        cost_price: cost,
        selling_price: sell,
        current_stock: stock,
        reorder_level: reorder,
      },
    });
  } catch (error) {
    console.error('Error adding product:', error);
    return NextResponse.json({ error: 'Failed to add product' }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, current_stock, reorder_level, cost_price, selling_price } = body;

    if (!id) {
      return NextResponse.json({ error: 'Product ID is required for update.' }, { status: 400 });
    }

    const db = getDb();
    const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id) as Product | undefined;
    if (!existing) {
      return NextResponse.json({ error: 'Product not found.' }, { status: 404 });
    }

    const newStock = current_stock !== undefined ? parseInt(current_stock, 10) : existing.current_stock;
    const newReorder = reorder_level !== undefined ? parseInt(reorder_level, 10) : existing.reorder_level;
    const newCost = cost_price !== undefined ? parseFloat(cost_price) : existing.cost_price;
    const newSell = selling_price !== undefined ? parseFloat(selling_price) : existing.selling_price;

    db.prepare(`
      UPDATE products
      SET current_stock = ?, reorder_level = ?, cost_price = ?, selling_price = ?
      WHERE id = ?
    `).run(newStock, newReorder, newCost, newSell, id);

    return NextResponse.json({
      success: true,
      message: `Updated ${existing.name} stock to ${newStock} units.`,
    });
  } catch (error) {
    console.error('Error updating product:', error);
    return NextResponse.json({ error: 'Failed to update product' }, { status: 500 });
  }
}

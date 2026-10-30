import Database from 'better-sqlite3';
import { Recommendation, DateRangeKey } from './types';
import { formatINR, formatPercent } from './formatters';

export function generateRecommendations(
  db: Database.Database,
  dateRange: DateRangeKey = 'last_30_days'
): Recommendation[] {
  const recommendations: Recommendation[] = [];

  // Helper date calculators
  const now = new Date();
  const d30Ago = new Date(now);
  d30Ago.setDate(d30Ago.getDate() - 30);
  const d60Ago = new Date(now);
  d60Ago.setDate(d60Ago.getDate() - 60);

  const date30AgoStr = d30Ago.toISOString().split('T')[0];
  const date60AgoStr = d60Ago.toISOString().split('T')[0];
  const todayStr = now.toISOString().split('T')[0];

  // 1. Fetch all products with 30-day sales velocity and stock
  const productStats = db.prepare(`
    SELECT 
      p.id,
      p.name,
      p.category,
      p.cost_price,
      p.selling_price,
      p.current_stock,
      p.reorder_level,
      COALESCE(s30.units_30d, 0) as units_30d,
      COALESCE(s30.revenue_30d, 0) as revenue_30d,
      COALESCE(s_prev.units_prev_30d, 0) as units_prev_30d
    FROM products p
    LEFT JOIN (
      SELECT product_id, SUM(quantity) as units_30d, SUM(total_amount) as revenue_30d
      FROM sales
      WHERE sale_date >= ? AND sale_date <= ?
      GROUP BY product_id
    ) s30 ON p.id = s30.product_id
    LEFT JOIN (
      SELECT product_id, SUM(quantity) as units_prev_30d
      FROM sales
      WHERE sale_date >= ? AND sale_date < ?
      GROUP BY product_id
    ) s_prev ON p.id = s_prev.product_id
  `).all(date30AgoStr, todayStr, date60AgoStr, date30AgoStr) as Array<{
    id: number;
    name: string;
    category: string;
    cost_price: number;
    selling_price: number;
    current_stock: number;
    reorder_level: number;
    units_30d: number;
    revenue_30d: number;
    units_prev_30d: number;
  }>;

  // RULE 1 & 2: Inventory low stock & fast seller running out
  for (const prod of productStats) {
    const avgDailySales = prod.units_30d / 30;
    const daysRemaining = avgDailySales > 0 ? Math.round(prod.current_stock / avgDailySales) : null;
    const marginPct = ((prod.selling_price - prod.cost_price) / prod.selling_price) * 100;

    // Check if stock is at or below reorder level
    if (prod.current_stock <= prod.reorder_level) {
      if (avgDailySales >= 0.4) {
        // High velocity + low stock
        recommendations.push({
          id: `rec-high-vel-low-stock-${prod.id}`,
          category: 'Inventory',
          severity: 'action_needed',
          title: `Critical Stockout Risk: ${prod.name}`,
          message: `Increase stock for ${prod.name}; it is selling quickly at ${avgDailySales.toFixed(1)} units/day with only ${prod.current_stock} units remain (${daysRemaining ?? 0} days of stock left).`,
          metric: `${prod.current_stock} units left (${daysRemaining ?? 0} days buffer)`,
          actionPrompt: 'Contact supplier to place an emergency expedited purchase order.',
          calculationExplanation: `Product sells ~${avgDailySales.toFixed(1)} units/day (30-day sales: ${prod.units_30d} units). Current stock of ${prod.current_stock} is ≤ reorder threshold of ${prod.reorder_level}. At this sales velocity, inventory will deplete in ${daysRemaining ?? 0} days.`,
          relatedEntity: { type: 'product', name: prod.name, id: prod.id },
        });
      } else {
        // Standard low stock
        recommendations.push({
          id: `rec-low-stock-${prod.id}`,
          category: 'Inventory',
          severity: 'action_needed',
          title: `Reorder Required: ${prod.name}`,
          message: `Reorder ${prod.name}; only ${prod.current_stock} units remain.`,
          metric: `Stock: ${prod.current_stock} / Reorder Level: ${prod.reorder_level}`,
          actionPrompt: 'Create a replenishment purchase order for this item.',
          calculationExplanation: `Current stock (${prod.current_stock} units) is at or below the defined reorder threshold of ${prod.reorder_level} units. Reorder buffer has been breached.`,
          relatedEntity: { type: 'product', name: prod.name, id: prod.id },
        });
      }
    }

    // RULE 3: Slow-moving inventory with high capital tied up
    // Stock is high (> 2.5x reorder level), but sales in 30 days is low (<= 3 units)
    if (prod.current_stock >= prod.reorder_level * 2.5 && prod.units_30d <= 3) {
      const tiedCapital = prod.current_stock * prod.cost_price;
      const daysBuffer = avgDailySales > 0 ? Math.round(prod.current_stock / avgDailySales) : 365;

      recommendations.push({
        id: `rec-slow-mover-${prod.id}`,
        category: 'Inventory',
        severity: 'watch',
        title: `Slow-Moving Stock Trap: ${prod.name}`,
        message: `Consider a discount or promotion for ${prod.name}; ${prod.current_stock} units in stock with only ${prod.units_30d} sold in the last 30 days.`,
        metric: `${formatINR(tiedCapital)} locked in inventory (${daysBuffer}+ days of supply)`,
        actionPrompt: 'Launch a 10%-15% bundle discount or weekend clearance promo to liquidate stock.',
        calculationExplanation: `Current stock of ${prod.current_stock} units exceeds 2.5x the reorder level (${prod.reorder_level}), while 30-day sales were only ${prod.units_30d} units. Working capital of ${formatINR(tiedCapital)} is immobilized.`,
        relatedEntity: { type: 'product', name: prod.name, id: prod.id },
      });
    }

    // RULE: Declining sales trend over last 30 days vs prior 30 days
    if (prod.units_prev_30d >= 8 && prod.units_30d < prod.units_prev_30d * 0.7) {
      const dropPct = Math.round(((prod.units_prev_30d - prod.units_30d) / prod.units_prev_30d) * 100);
      recommendations.push({
        id: `rec-declining-sales-${prod.id}`,
        category: 'Sales',
        severity: 'watch',
        title: `Sales Momentum Dip: ${prod.name}`,
        message: `Sales for ${prod.name} declined by ${dropPct}% over the last 30 days (${prod.units_prev_30d} units → ${prod.units_30d} units).`,
        metric: `-${dropPct}% sales volume drop`,
        actionPrompt: 'Check front-of-store placement, shelf visibility, or customer pricing feedback.',
        calculationExplanation: `Prior 30-day sales volume was ${prod.units_prev_30d} units, compared to ${prod.units_30d} units in the most recent 30 days, representing a ${dropPct}% drop.`,
        relatedEntity: { type: 'product', name: prod.name, id: prod.id },
      });
    }

    // RULE: High margin star product opportunity
    if (marginPct >= 48 && prod.units_30d >= 8 && prod.current_stock > prod.reorder_level) {
      recommendations.push({
        id: `rec-high-margin-${prod.id}`,
        category: 'Profitability',
        severity: 'opportunity',
        title: `High-Margin Growth Star: ${prod.name}`,
        message: `Spotlight ${prod.name} in primary store displays and online WhatsApp broadcasts; it delivers a healthy ${marginPct.toFixed(0)}% gross margin with steady sales.`,
        metric: `${marginPct.toFixed(0)}% margin (${formatINR(prod.selling_price - prod.cost_price)}/unit profit)`,
        actionPrompt: 'Feature at checkout counter displays or recommend as gift item.',
        calculationExplanation: `Unit selling price of ${formatINR(prod.selling_price)} vs cost ${formatINR(prod.cost_price)} generates ${formatINR(prod.selling_price - prod.cost_price)} profit per item (${marginPct.toFixed(1)}% margin). Healthy stock buffer of ${prod.current_stock} units.`,
        relatedEntity: { type: 'product', name: prod.name, id: prod.id },
      });
    }
  }

  // 2. Fetch Comparative Financials (Last 30 days vs Prior 30 days)
  const currentFin = db.prepare(`
    SELECT 
      COALESCE((SELECT SUM(total_amount) FROM sales WHERE sale_date >= ? AND sale_date <= ?), 0) as revenue,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date >= ? AND expense_date <= ?), 0) as expenses,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE category = 'Marketing' AND expense_date >= ? AND expense_date <= ?), 0) as marketing
  `).get(date30AgoStr, todayStr, date30AgoStr, todayStr, date30AgoStr, todayStr) as {
    revenue: number;
    expenses: number;
    marketing: number;
  };

  const priorFin = db.prepare(`
    SELECT 
      COALESCE((SELECT SUM(total_amount) FROM sales WHERE sale_date >= ? AND sale_date < ?), 0) as revenue,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE expense_date >= ? AND expense_date < ?), 0) as expenses,
      COALESCE((SELECT SUM(amount) FROM expenses WHERE category = 'Marketing' AND expense_date >= ? AND expense_date < ?), 0) as marketing
  `).get(date60AgoStr, date30AgoStr, date60AgoStr, date30AgoStr, date60AgoStr, date30AgoStr) as {
    revenue: number;
    expenses: number;
    marketing: number;
  };

  // RULE 4: Marketing expenses increased while revenue decreased
  if (priorFin.marketing > 0 && currentFin.marketing > priorFin.marketing * 1.05) {
    const mktGrowthPct = ((currentFin.marketing - priorFin.marketing) / priorFin.marketing) * 100;
    if (currentFin.revenue < priorFin.revenue) {
      const revDropPct = ((priorFin.revenue - currentFin.revenue) / priorFin.revenue) * 100;
      recommendations.push({
        id: 'rec-marketing-divergence',
        category: 'Expenses',
        severity: 'action_needed',
        title: 'Marketing Inefficiency Detected',
        message: `Review marketing spend; marketing expenses rose by ${mktGrowthPct.toFixed(1)}% (${formatINR(priorFin.marketing)} → ${formatINR(currentFin.marketing)}) while revenue fell by ${revDropPct.toFixed(1)}%.`,
        metric: `Marketing: +${mktGrowthPct.toFixed(0)}% | Revenue: -${revDropPct.toFixed(0)}%`,
        actionPrompt: 'Audit active ad campaigns, flyers, or agency spend to eliminate underperforming marketing channels.',
        calculationExplanation: `Comparing the last 30 days to the preceding 30 days: Marketing outlay increased from ${formatINR(priorFin.marketing)} to ${formatINR(currentFin.marketing)} (+${mktGrowthPct.toFixed(1)}%), but top-line sales contracted from ${formatINR(priorFin.revenue)} to ${formatINR(currentFin.revenue)} (-${revDropPct.toFixed(1)}%).`,
        relatedEntity: { type: 'expense_category', name: 'Marketing' },
      });
    }
  }

  // RULE 5: Profit Margin Below 15% Check
  const currentNetProfit = currentFin.revenue - currentFin.expenses;
  const currentProfitMargin = currentFin.revenue > 0 ? (currentNetProfit / currentFin.revenue) * 100 : 0;

  if (currentProfitMargin < 15 && currentFin.revenue > 0) {
    recommendations.push({
      id: 'rec-low-profit-margin',
      category: 'Profitability',
      severity: 'action_needed',
      title: 'Net Profit Margin Below 15% Target',
      message: `Reduce overhead costs or review pricing; current 30-day profit margin is ${currentProfitMargin.toFixed(1)}% (healthy target benchmark: ≥ 15%).`,
      metric: `${currentProfitMargin.toFixed(1)}% Net Margin`,
      actionPrompt: 'Evaluate utility waste, optimize vendor purchasing discounts, or make selective 3%-5% price adjustments on low-margin items.',
      calculationExplanation: `Formula: ((Total Revenue ${formatINR(currentFin.revenue)} - Total Expenses ${formatINR(currentFin.expenses)}) / Total Revenue) * 100 = ${currentProfitMargin.toFixed(1)}%. Retail cushion below 15% increases vulnerability to cashflow crunches.`,
      relatedEntity: { type: 'overall', name: 'Store Finances' },
    });
  }

  // RULE 6: Single expense category concentration exceeding 30% of total expenses
  const expenseBreakdown = db.prepare(`
    SELECT category, SUM(amount) as total_cat
    FROM expenses
    WHERE expense_date >= ? AND expense_date <= ?
    GROUP BY category
    ORDER BY total_cat DESC
  `).all(date30AgoStr, todayStr) as Array<{ category: string; total_cat: number }>;

  if (currentFin.expenses > 0) {
    for (const exp of expenseBreakdown) {
      // Exclude inventory purchases as inventory is an asset procurement rather than operational overhead
      if (exp.category === 'Inventory Purchase') continue;

      const catPct = (exp.total_cat / currentFin.expenses) * 100;
      if (catPct >= 30) {
        recommendations.push({
          id: `rec-high-expense-concentration-${exp.category}`,
          category: 'Expenses',
          severity: 'watch',
          title: `Cost Driver Alert: ${exp.category}`,
          message: `${exp.category} is a major cost driver, consuming ${catPct.toFixed(1)}% of all operational expenses (${formatINR(exp.total_cat)}).`,
          metric: `${catPct.toFixed(1)}% of total expenses`,
          actionPrompt: exp.category === 'Rent'
            ? 'Consider optimizing retail floor space utilization or negotiating festive lease concessions.'
            : exp.category === 'Salaries'
            ? 'Align staff shift schedules with peak footfall hours (evenings and weekends).'
            : 'Audit suppliers and negotiate recurring vendor discounts.',
          calculationExplanation: `Total spend on ${exp.category} is ${formatINR(exp.total_cat)} out of total expenses ${formatINR(currentFin.expenses)} (${catPct.toFixed(1)}%), exceeding the 30% concentration risk guideline.`,
          relatedEntity: { type: 'expense_category', name: exp.category },
        });
      }
    }
  }

  // Sort recommendations: 'action_needed' first, then 'watch', then 'opportunity', then 'healthy'
  const severityOrder: Record<string, number> = {
    action_needed: 1,
    watch: 2,
    opportunity: 3,
    healthy: 4,
  };

  recommendations.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return recommendations;
}

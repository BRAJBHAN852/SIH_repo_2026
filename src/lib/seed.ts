import Database from 'better-sqlite3';

export interface SeedProduct {
  name: string;
  category: string;
  cost_price: number;
  selling_price: number;
  current_stock: number;
  reorder_level: number;
  salesVelocity: 'high' | 'medium' | 'low';
}

export const INITIAL_PRODUCTS: SeedProduct[] = [
  // Groceries & Foods
  {
    name: 'A2 Gir Cow Desi Ghee (1L)',
    category: 'Groceries & Foods',
    cost_price: 1200,
    selling_price: 1750,
    current_stock: 22,
    reorder_level: 15,
    salesVelocity: 'high',
  },
  {
    name: 'Wild Multiflora Forest Honey (500g)',
    category: 'Groceries & Foods',
    cost_price: 320,
    selling_price: 580,
    current_stock: 5, // LOW STOCK + HIGH SALES VELOCITY -> CRITICAL ALERT
    reorder_level: 18,
    salesVelocity: 'high',
  },
  {
    name: 'Salem Organic Lakadong Turmeric (250g)',
    category: 'Groceries & Foods',
    cost_price: 85,
    selling_price: 165,
    current_stock: 35,
    reorder_level: 15,
    salesVelocity: 'high',
  },
  {
    name: 'Kashmiri Mogra Saffron (1g)',
    category: 'Groceries & Foods',
    cost_price: 270,
    selling_price: 490,
    current_stock: 14,
    reorder_level: 8,
    salesVelocity: 'medium',
  },
  {
    name: 'Organic Roasted Chia & Flax Mix (350g)',
    category: 'Groceries & Foods',
    cost_price: 130,
    selling_price: 275,
    current_stock: 28,
    reorder_level: 12,
    salesVelocity: 'medium',
  },

  // Handlooms & Apparel
  {
    name: 'Chanderi Pure Silk Floral Dupatta',
    category: 'Handlooms & Apparel',
    cost_price: 1450,
    selling_price: 2850,
    current_stock: 26, // SLOW MOVER WITH HIGH CAPITAL TIED UP (₹37,700) -> PROMOTION ALERT
    reorder_level: 6,
    salesVelocity: 'low',
  },
  {
    name: 'Handspun Organic Khadi Short Kurta',
    category: 'Handlooms & Apparel',
    cost_price: 650,
    selling_price: 1390,
    current_stock: 18,
    reorder_level: 10,
    salesVelocity: 'medium',
  },
  {
    name: 'Bagru Handblock Print Cotton Bedspread',
    category: 'Handlooms & Apparel',
    cost_price: 880,
    selling_price: 1750,
    current_stock: 24, // SLOW MOVER
    reorder_level: 8,
    salesVelocity: 'low',
  },
  {
    name: 'Indigo Dabu Print Cotton Stole',
    category: 'Handlooms & Apparel',
    cost_price: 220,
    selling_price: 540,
    current_stock: 32,
    reorder_level: 14,
    salesVelocity: 'medium',
  },

  // Wellness & Beauty
  {
    name: 'Kumkumadi Miraculous Night Serum (30ml)',
    category: 'Wellness & Beauty',
    cost_price: 480,
    selling_price: 999,
    current_stock: 3, // CRITICALLY LOW STOCK -> IMMEDIATE REORDER
    reorder_level: 14,
    salesVelocity: 'high',
  },
  {
    name: 'Cold-Pressed Wood Chekku Coconut Oil (500ml)',
    category: 'Wellness & Beauty',
    cost_price: 160,
    selling_price: 310,
    current_stock: 24,
    reorder_level: 15,
    salesVelocity: 'high',
  },
  {
    name: 'Bhringraj & Amla Hair Revitalizer (200ml)',
    category: 'Wellness & Beauty',
    cost_price: 210,
    selling_price: 440,
    current_stock: 19,
    reorder_level: 10,
    salesVelocity: 'medium',
  },
  {
    name: 'Sandalwood & Saffron Radiant Ubtan (120g)',
    category: 'Wellness & Beauty',
    cost_price: 140,
    selling_price: 320,
    current_stock: 7, // LOW STOCK
    reorder_level: 10,
    salesVelocity: 'medium',
  },

  // Artisanal Home
  {
    name: 'Handcrafted Brass Mayur Peacock Diya Set',
    category: 'Artisanal Home',
    cost_price: 780,
    selling_price: 1599,
    current_stock: 42, // HIGH STOCK (₹32,760 locked) & LOW SALES (only 2-3 in 30 days) -> DISCOUNT PROMOTION
    reorder_level: 8,
    salesVelocity: 'low',
  },
  {
    name: 'Pure Soy Wax Oudh & Rose Candle (250g)',
    category: 'Artisanal Home',
    cost_price: 290,
    selling_price: 680,
    current_stock: 25,
    reorder_level: 12,
    salesVelocity: 'medium',
  },
  {
    name: 'Terracotta Glazed Chai Kulhar Set (Set of 6)',
    category: 'Artisanal Home',
    cost_price: 280,
    selling_price: 620,
    current_stock: 16,
    reorder_level: 10,
    salesVelocity: 'medium',
  },
];

export function seedDatabase(db: Database.Database, forceReset = false) {
  if (forceReset) {
    db.exec(`
      DROP TABLE IF EXISTS sales;
      DROP TABLE IF EXISTS expenses;
      DROP TABLE IF EXISTS products;
    `);
  }

  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      category TEXT NOT NULL,
      cost_price REAL NOT NULL,
      selling_price REAL NOT NULL,
      current_stock INTEGER NOT NULL,
      reorder_level INTEGER NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS sales (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      unit_price REAL NOT NULL,
      total_amount REAL NOT NULL,
      sale_date TEXT NOT NULL,
      notes TEXT,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS expenses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      category TEXT NOT NULL,
      amount REAL NOT NULL,
      expense_date TEXT NOT NULL,
      notes TEXT,
      created_at TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_sales_date ON sales(sale_date);
    CREATE INDEX IF NOT EXISTS idx_sales_product ON sales(product_id);
    CREATE INDEX IF NOT EXISTS idx_expenses_date ON expenses(expense_date);
    CREATE INDEX IF NOT EXISTS idx_expenses_category ON expenses(category);
  `);

  const existingProductsCount = db.prepare('SELECT COUNT(*) as count FROM products').get() as { count: number };
  if (existingProductsCount.count > 0 && !forceReset) {
    return;
  }

  const now = new Date();
  const insertProduct = db.prepare(`
    INSERT INTO products (name, category, cost_price, selling_price, current_stock, reorder_level, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const productIds: { id: number; product: SeedProduct }[] = [];

  for (const prod of INITIAL_PRODUCTS) {
    const res = insertProduct.run(
      prod.name,
      prod.category,
      prod.cost_price,
      prod.selling_price,
      prod.current_stock,
      prod.reorder_level,
      now.toISOString()
    );
    productIds.push({ id: Number(res.lastInsertRowid), product: prod });
  }

  const insertSale = db.prepare(`
    INSERT INTO sales (product_id, quantity, unit_price, total_amount, sale_date, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const insertExpense = db.prepare(`
    INSERT INTO expenses (category, amount, expense_date, notes, created_at)
    VALUES (?, ?, ?, ?, ?)
  `);

  const totalDays = 180;
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - totalDays);

  const notesPool = [
    'Store walk-in customer',
    'UPI Scan & Pay',
    'WhatsApp phone order delivery',
    'Loyal repeat customer',
    'Weekend walk-in family',
    'Festive gifting bundle purchase',
    'Evening retail walk-in',
    'Debit card at POS counter',
  ];

  let seed = 42;
  function random() {
    seed = (seed * 9301 + 49297) % 233280;
    return seed / 233280;
  }

  db.transaction(() => {
    // 1. Generate Sales day by day
    for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
      const currentDay = new Date(startDate);
      currentDay.setDate(currentDay.getDate() + dayOffset);
      const dayOfWeek = currentDay.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;
      const dateStr = currentDay.toISOString().split('T')[0];

      // Realistic transaction counts: 7-15 on weekdays, 12-24 on weekends
      const baseCount = isWeekend ? 14 + Math.floor(random() * 9) : 8 + Math.floor(random() * 6);

      // Simulate a realistic dip 20-45 days ago to reflect marketing vs revenue divergence
      const daysAgo = totalDays - dayOffset;
      const dipFactor = (daysAgo >= 15 && daysAgo <= 45) ? 0.78 : 1.0;

      const txCount = Math.max(4, Math.round(baseCount * dipFactor));

      for (let tx = 0; tx < txCount; tx++) {
        const candidates = productIds.filter(p => {
          if (p.product.salesVelocity === 'high') return true;
          if (p.product.salesVelocity === 'medium') return random() > 0.28;
          // low velocity items sell occasionally
          return random() > 0.88;
        });

        if (candidates.length === 0) continue;
        const picked = candidates[Math.floor(random() * candidates.length)];

        let qty = 1;
        if (picked.product.category === 'Groceries & Foods') {
          qty = random() > 0.5 ? (random() > 0.8 ? 3 : 2) : 1;
        } else if (random() > 0.82) {
          qty = 2;
        }

        const totalAmount = qty * picked.product.selling_price;
        const note = notesPool[Math.floor(random() * notesPool.length)];

        insertSale.run(
          picked.id,
          qty,
          picked.product.selling_price,
          totalAmount,
          dateStr,
          note
        );
      }
    }

    // 2. Generate Expenses month by month over the 6 months
    const months: { year: number; month: number }[] = [];
    for (let m = 5; m >= 0; m--) {
      const d = new Date();
      d.setMonth(d.getMonth() - m);
      months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
    }

    for (let i = 0; i < months.length; i++) {
      const mInfo = months[i];
      const monthStr = `${mInfo.year}-${String(mInfo.month).padStart(2, '0')}`;
      const isPenultimateMonth = i === months.length - 2;

      // Rent: ₹45,000
      insertExpense.run('Rent', 45000, `${monthStr}-01`, 'Showroom commercial rent - Prime MG Road', now.toISOString());

      // Salaries: ₹65,000 (Store Manager + 2 Sales Assistants)
      insertExpense.run('Salaries', 65000, `${monthStr}-05`, 'Staff payroll (Store Manager & 2 Assistants)', now.toISOString());

      // Utilities: ₹8,000 - ₹11,000
      const utilityAmt = Math.round(8500 + random() * 2500);
      insertExpense.run('Utilities', utilityAmt, `${monthStr}-10`, 'Electricity, Air Conditioning & Fiber Internet', now.toISOString());

      // Marketing:
      // Penultimate month had an expensive digital ad push (₹36,000) during a footfall dip
      let marketingAmt = 12000 + Math.round(random() * 3500);
      let marketingNote = 'Instagram sponsored ads & local weekend promotional banners';
      if (isPenultimateMonth) {
        marketingAmt = 36000;
        marketingNote = 'Expanded Meta ads & print flyer inserts campaign';
      }
      insertExpense.run('Marketing', marketingAmt, `${monthStr}-12`, marketingNote, now.toISOString());

      // Inventory Purchase (Stock procurement: ~₹45k - ₹75k)
      const invAmt1 = Math.round(48000 + random() * 22000);
      insertExpense.run('Inventory Purchase', invAmt1, `${monthStr}-08`, 'Vendor procurement: Desi Ghee, Raw Honey & Spices batch', now.toISOString());

      if (random() > 0.4) {
        const invAmt2 = Math.round(28000 + random() * 15000);
        insertExpense.run('Inventory Purchase', invAmt2, `${monthStr}-22`, 'Stock restock: Handloom fabrics & Ayurvedic personal care', now.toISOString());
      }

      // Transport: Courier & Vendor Freight
      const transportAmt1 = Math.round(2800 + random() * 1200);
      insertExpense.run('Transport', transportAmt1, `${monthStr}-14`, 'Interstate cargo logistics & vendor delivery freight', now.toISOString());

      const transportAmt2 = Math.round(2200 + random() * 900);
      insertExpense.run('Transport', transportAmt2, `${monthStr}-26`, 'Local courier shipping for home delivery orders', now.toISOString());

      // Other: Packaging & Maintenance
      const otherAmt = Math.round(3500 + random() * 1500);
      insertExpense.run('Other', otherAmt, `${monthStr}-18`, 'Kraft paper bags, bubble wrap, POS machine paper rolls', now.toISOString());
    }
  })();
}

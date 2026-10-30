import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const dataDir = path.join(rootDir, 'data');

if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const dbPath = path.join(dataDir, 'small_business_brain.db');
console.log(`\x1b[36mInitializing Small Business Brain SQLite database at:\x1b[0m ${dbPath}`);

const db = new Database(dbPath);
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

db.exec(`
  DROP TABLE IF EXISTS sales;
  DROP TABLE IF EXISTS expenses;
  DROP TABLE IF EXISTS products;

  CREATE TABLE products (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    category TEXT NOT NULL,
    cost_price REAL NOT NULL,
    selling_price REAL NOT NULL,
    current_stock INTEGER NOT NULL,
    reorder_level INTEGER NOT NULL,
    created_at TEXT NOT NULL
  );

  CREATE TABLE sales (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    product_id INTEGER NOT NULL,
    quantity INTEGER NOT NULL,
    unit_price REAL NOT NULL,
    total_amount REAL NOT NULL,
    sale_date TEXT NOT NULL,
    notes TEXT,
    FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
  );

  CREATE TABLE expenses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    amount REAL NOT NULL,
    expense_date TEXT NOT NULL,
    notes TEXT,
    created_at TEXT NOT NULL
  );

  CREATE INDEX idx_sales_date ON sales(sale_date);
  CREATE INDEX idx_sales_product ON sales(product_id);
  CREATE INDEX idx_expenses_date ON expenses(expense_date);
  CREATE INDEX idx_expenses_category ON expenses(category);
`);

const INITIAL_PRODUCTS = [
  { name: 'A2 Gir Cow Desi Ghee (1L)', category: 'Groceries & Foods', cost_price: 1200, selling_price: 1750, current_stock: 22, reorder_level: 15, salesVelocity: 'high' },
  { name: 'Wild Multiflora Forest Honey (500g)', category: 'Groceries & Foods', cost_price: 320, selling_price: 580, current_stock: 5, reorder_level: 18, salesVelocity: 'high' },
  { name: 'Salem Organic Lakadong Turmeric (250g)', category: 'Groceries & Foods', cost_price: 85, selling_price: 165, current_stock: 35, reorder_level: 15, salesVelocity: 'high' },
  { name: 'Kashmiri Mogra Saffron (1g)', category: 'Groceries & Foods', cost_price: 270, selling_price: 490, current_stock: 14, reorder_level: 8, salesVelocity: 'medium' },
  { name: 'Organic Roasted Chia & Flax Mix (350g)', category: 'Groceries & Foods', cost_price: 130, selling_price: 275, current_stock: 28, reorder_level: 12, salesVelocity: 'medium' },
  { name: 'Chanderi Pure Silk Floral Dupatta', category: 'Handlooms & Apparel', cost_price: 1450, selling_price: 2850, current_stock: 26, reorder_level: 6, salesVelocity: 'low' },
  { name: 'Handspun Organic Khadi Short Kurta', category: 'Handlooms & Apparel', cost_price: 650, selling_price: 1390, current_stock: 18, reorder_level: 10, salesVelocity: 'medium' },
  { name: 'Bagru Handblock Print Cotton Bedspread', category: 'Handlooms & Apparel', cost_price: 880, selling_price: 1750, current_stock: 24, reorder_level: 8, salesVelocity: 'low' },
  { name: 'Indigo Dabu Print Cotton Stole', category: 'Handlooms & Apparel', cost_price: 220, selling_price: 540, current_stock: 32, reorder_level: 14, salesVelocity: 'medium' },
  { name: 'Kumkumadi Miraculous Night Serum (30ml)', category: 'Wellness & Beauty', cost_price: 480, selling_price: 999, current_stock: 3, reorder_level: 14, salesVelocity: 'high' },
  { name: 'Cold-Pressed Wood Chekku Coconut Oil (500ml)', category: 'Wellness & Beauty', cost_price: 160, selling_price: 310, current_stock: 24, reorder_level: 15, salesVelocity: 'high' },
  { name: 'Bhringraj & Amla Hair Revitalizer (200ml)', category: 'Wellness & Beauty', cost_price: 210, selling_price: 440, current_stock: 19, reorder_level: 10, salesVelocity: 'medium' },
  { name: 'Sandalwood & Saffron Radiant Ubtan (120g)', category: 'Wellness & Beauty', cost_price: 140, selling_price: 320, current_stock: 7, reorder_level: 10, salesVelocity: 'medium' },
  { name: 'Handcrafted Brass Mayur Peacock Diya Set', category: 'Artisanal Home', cost_price: 780, selling_price: 1599, current_stock: 42, reorder_level: 8, salesVelocity: 'low' },
  { name: 'Pure Soy Wax Oudh & Rose Candle (250g)', category: 'Artisanal Home', cost_price: 290, selling_price: 680, current_stock: 25, reorder_level: 12, salesVelocity: 'medium' },
  { name: 'Terracotta Glazed Chai Kulhar Set (Set of 6)', category: 'Artisanal Home', cost_price: 280, selling_price: 620, current_stock: 16, reorder_level: 10, salesVelocity: 'medium' },
];

const now = new Date();
const insertProduct = db.prepare(`
  INSERT INTO products (name, category, cost_price, selling_price, current_stock, reorder_level, created_at)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`);

const productIds = [];
for (const p of INITIAL_PRODUCTS) {
  const res = insertProduct.run(p.name, p.category, p.cost_price, p.selling_price, p.current_stock, p.reorder_level, now.toISOString());
  productIds.push({ id: Number(res.lastInsertRowid), product: p });
}

const insertSale = db.prepare(`
  INSERT INTO sales (product_id, quantity, unit_price, total_amount, sale_date, notes)
  VALUES (?, ?, ?, ?, ?, ?)
`);

const insertExpense = db.prepare(`
  INSERT INTO expenses (category, amount, expense_date, notes, created_at)
  VALUES (?, ?, ?, ?, ?)
`);

let seed = 42;
function random() {
  seed = (seed * 9301 + 49297) % 233280;
  return seed / 233280;
}

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

const totalDays = 180;
const startDate = new Date();
startDate.setDate(startDate.getDate() - totalDays);

db.transaction(() => {
  for (let dayOffset = 0; dayOffset <= totalDays; dayOffset++) {
    const currentDay = new Date(startDate);
    currentDay.setDate(currentDay.getDate() + dayOffset);
    const dayOfWeek = currentDay.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6 || dayOfWeek === 5;
    const dateStr = currentDay.toISOString().split('T')[0];

    const baseCount = isWeekend ? 14 + Math.floor(random() * 9) : 8 + Math.floor(random() * 6);
    const daysAgo = totalDays - dayOffset;
    const dipFactor = (daysAgo >= 15 && daysAgo <= 45) ? 0.78 : 1.0;
    const txCount = Math.max(4, Math.round(baseCount * dipFactor));

    for (let tx = 0; tx < txCount; tx++) {
      const candidates = productIds.filter(p => {
        if (p.product.salesVelocity === 'high') return true;
        if (p.product.salesVelocity === 'medium') return random() > 0.28;
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

      insertSale.run(
        picked.id,
        qty,
        picked.product.selling_price,
        qty * picked.product.selling_price,
        dateStr,
        notesPool[Math.floor(random() * notesPool.length)]
      );
    }
  }

  const months = [];
  for (let m = 5; m >= 0; m--) {
    const d = new Date();
    d.setMonth(d.getMonth() - m);
    months.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }

  for (let i = 0; i < months.length; i++) {
    const mInfo = months[i];
    const monthStr = `${mInfo.year}-${String(mInfo.month).padStart(2, '0')}`;
    const isPenultimateMonth = i === months.length - 2;

    insertExpense.run('Rent', 45000, `${monthStr}-01`, 'Showroom commercial rent - Prime MG Road', now.toISOString());
    insertExpense.run('Salaries', 65000, `${monthStr}-05`, 'Staff payroll (Store Manager & 2 Assistants)', now.toISOString());
    insertExpense.run('Utilities', Math.round(8500 + random() * 2500), `${monthStr}-10`, 'Electricity, Air Conditioning & Fiber Internet', now.toISOString());

    let marketingAmt = 12000 + Math.round(random() * 3500);
    let marketingNote = 'Instagram sponsored ads & local weekend promotional banners';
    if (isPenultimateMonth) {
      marketingAmt = 36000;
      marketingNote = 'Expanded Meta ads & print flyer inserts campaign';
    }
    insertExpense.run('Marketing', marketingAmt, `${monthStr}-12`, marketingNote, now.toISOString());

    insertExpense.run('Inventory Purchase', Math.round(48000 + random() * 22000), `${monthStr}-08`, 'Vendor procurement: Desi Ghee, Raw Honey & Spices batch', now.toISOString());
    if (random() > 0.4) {
      insertExpense.run('Inventory Purchase', Math.round(28000 + random() * 15000), `${monthStr}-22`, 'Stock restock: Handloom fabrics & Ayurvedic personal care', now.toISOString());
    }

    insertExpense.run('Transport', Math.round(2800 + random() * 1200), `${monthStr}-14`, 'Interstate cargo logistics & vendor delivery freight', now.toISOString());
    insertExpense.run('Transport', Math.round(2200 + random() * 900), `${monthStr}-26`, 'Local courier shipping for home delivery orders', now.toISOString());
    insertExpense.run('Other', Math.round(3500 + random() * 1500), `${monthStr}-18`, 'Kraft paper bags, bubble wrap, POS machine paper rolls', now.toISOString());
  }
})();

const stats = {
  products: db.prepare('SELECT COUNT(*) as count FROM products').get().count,
  sales: db.prepare('SELECT COUNT(*) as count, SUM(total_amount) as total FROM sales').get(),
  expenses: db.prepare('SELECT COUNT(*) as count, SUM(amount) as total FROM expenses').get(),
};

console.log(`\x1b[32m✔ Seeding complete!\x1b[0m`);
console.log(`- Products: ${stats.products}`);
console.log(`- Sales Transactions: ${stats.sales.count} (Total Revenue: ₹${Math.round(stats.sales.total).toLocaleString('en-IN')})`);
console.log(`- Expenses Logged: ${stats.expenses.count} (Total Expenses: ₹${Math.round(stats.expenses.total).toLocaleString('en-IN')})`);

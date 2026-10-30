# 🧠 Small Business Brain

> **A simple, explainable analytics & decision-support system for small retail businesses.**  
> Analyzes sales, inventory, and expenses to deliver clear, actionable recommendations instead of relying only on intuition.

Built with **Next.js (App Router)**, **Tailwind CSS**, **SQLite (`better-sqlite3`)**, and **Recharts**. Pre-seeded with 6 months of realistic Indian retail business sample data (**₹ INR**).

---

## 🚀 Quick Start Guide

### 1. Prerequisites
- **Node.js**: v18+ (tested on Node v20/v24)
- **npm**: v9+

### 2. Installation
Clone or navigate to the repository directory and install dependencies:
```bash
npm install
```

### 3. Database Setup & Seeding
The application uses a local SQLite database stored in `data/small_business_brain.db`.  
To populate 6 months of realistic retail business transactions (1,000+ sales and historical expenses):
```bash
npm run seed
```
*(Note: If you run `npm run dev` on a fresh clone without seeding, the database will also auto-initialize on first request).*

### 4. Running Locally
Start the Next.js development server:
```bash
npm run dev
```
Open your browser at **[http://localhost:3000](http://localhost:3000)**.

To build and run in production mode:
```bash
npm run build
npm run start
```

---

## 🏬 Business Scenario: "Vedic Roots Artisanal Retail"
The prototype simulates a thriving artisanal retail shop located in Pune / Bengaluru specializing in:
- **Groceries & Superfoods**: A2 Gir Cow Ghee, Wild Multiflora Honey, Organic Lakadong Turmeric, Kashmiri Saffron.
- **Handlooms & Apparel**: Chanderi Silk Dupattas, Khadi Kurtas, Bagru Handblock Bedspreads, Dabu Stoles.
- **Wellness & Beauty**: Kumkumadi Night Serum, Cold-Pressed Virgin Coconut Oil, Bhringraj Hair Cleanser.
- **Artisanal Home & Living**: Brass Peacock Diya Sets, Soy Wax Oudh Candles, Glazed Chai Kulhar Sets.

---

## 🌟 Core Features & Modules

### 1. 📊 Executive Dashboard
- **Key Performance Indicators (KPIs)**:
  - **Total Revenue**: Period sales volume with month-over-month (MoM) % growth pill.
  - **Total Expenses**: Operational expenditures with expense-to-revenue ratio health badge.
  - **Net Profit**: Revenue minus Expenses with profitability status.
  - **Net Profit Margin %**: Color-coded buffer health (Green ≥20%, Amber 15–20%, Red <15%).
  - **Inventory Asset Value**: Real-time total inventory valuation at procurement cost.
  - **Low Stock Count**: Instant alert for items at or below reorder thresholds.
- **Dynamic Date Range Filtering**:
  - `Last 7 Days` · `Last 30 Days` · `Last 3 Months` · `Last 6 Months`
- **Monthly Revenue vs. Expenses Trajectory**: Interactive Recharts bar chart tracking monthly performance.
- **Top 5 Best-Selling Products**: Ranked by sales volume and revenue.
- **Top 5 Highest Expense Categories**: Visual progress bars showing relative cost share.

### 2. 📈 Sales Analytics
- **Sales Metrics**: Total Revenue, Units Sold, Average Order Value (AOV), MoM Revenue & Unit Growth.
- **Declining Sales Detection**: Automatically flags products where sales dropped over the last 30 days compared to the preceding 30 days (showing drop %, prior vs. current units).
- **Sales Ledger**: Searchable transaction ledger with product name, category, quantity, unit price, total amount, and customer notes.

### 3. 📦 Inventory Analytics & Stock Run-Rate
- **Catalog Management**: Name, category, current stock, reorder level, cost price, selling price, and profit margin %.
- **Stock Depletion Run-Rate**: Calculates **Estimated Days of Stock Remaining** using average daily sales over the last 30 days (`current_stock / (units_sold_30d / 30)`).
- **Color-Coded Status Badges**:
  - 🟢 **Healthy**: Optimal buffer (>20 days supply, stock > reorder level).
  - 🟡 **Watch**: Approaching reorder level or slow-moving stock with capital tied up.
  - 🔴 **Action Needed**: Current stock is at/below reorder level or stockout imminent (<7 days left).
- **Inline Quick Stock Adjustment**: Update stock counts directly from the table.

### 4. 💳 Expense Analytics & Cost Concentration
- **Categorized Tracking**: `Rent`, `Salaries`, `Marketing`, `Utilities`, `Inventory Purchase`, `Transport`, `Other`.
- **Expense-to-Revenue Ratio**: `(Total Expenses / Total Revenue) * 100` with warning thresholds.
- **Concentration Risk Alert**: Automatically highlights any operational category consuming **>30%** of total expenses.
- **Visual Breakdown**: Interactive donut chart & category distribution bars.
- **Expense Ledger**: Filter by category and search vendor notes.

### 5. 💡 Actionable Recommendations Engine
Unlike opaque AI models that can hallucinate advice, Small Business Brain employs a **100% explainable, deterministic rule engine**. Every card displays the exact formula and database values that triggered it:

| Rule Name | Severity | Condition / Formula | Example In-App Action |
| :--- | :--- | :--- | :--- |
| **Critical Stockout Risk** | 🔴 Action Needed | `Current Stock ≤ Reorder Level` AND `Daily Sales ≥ 0.4 units/day` | *"Increase stock for Wild Multiflora Forest Honey; selling at 1.8 units/day with only 5 units remaining (3 days left)."* |
| **Reorder Required** | 🔴 Action Needed | `Current Stock ≤ Reorder Level` | *"Reorder Kumkumadi Night Serum; only 3 units remain (Reorder threshold: 14)."* |
| **Slow-Moving Stock Trap** | 🟡 Watch | `Current Stock ≥ 2.5 × Reorder Level` AND `30-Day Sales ≤ 3 units` | *"Consider a discount or promo for Brass Peacock Diya; 42 units in stock with only 2 sold in 30 days (₹32,760 capital locked)."* |
| **Marketing Inefficiency** | 🔴 Action Needed | `Marketing Expenses rose > 5%` while `Revenue fell < 0%` (vs prior 30d) | *"Review marketing spend; marketing expenses rose by 42% while revenue fell by 6%."* |
| **Profit Margin Squeeze** | 🔴 Action Needed | `Profit Margin < 15%` | *"Reduce costs or review pricing; current profit margin is 11.2% (Target: ≥ 15%)."* |
| **Expense Concentration** | 🟡 Watch | `(Category Spend / Total Expenses) ≥ 30%` (excl. Inventory) | *"Rent is a major cost driver (32.4% of total expenses); review floor space utilization."* |
| **Sales Momentum Drop** | 🟡 Watch | `Prior 30d Units ≥ 8` AND `Recent 30d Units < Prior Units × 0.70` | *"Sales momentum for Khadi Kurta dropped by 35% over last 30 days."* |
| **High-Margin Star** | 🟢 Opportunity | `Gross Margin % ≥ 48%` AND `30-Day Sales ≥ 8` | *"Spotlight Salem Turmeric at checkout displays; delivers 49% margin with steady sales."* |

> **In-App Formula Guide**: Click the **"Formula Guide"** button in the top navigation bar at any time to open a detailed breakdown of all formulas, thresholds, and business rationales.

### 6. 📝 Live Data Entry Center
- **Record Sale Modal**: Select product (with live stock count and pricing preview), quantity, unit price, date, and payment note. Recording a sale **automatically decrements product stock** in SQLite!
- **Add Product Modal**: Name, category, cost price, selling price, initial stock, and reorder threshold with validation.
- **Log Expense Modal**: Category, amount, date, and vendor description.
- **Instant Refresh**: Adding any transaction immediately updates dashboard KPIs, stock health badges, and recommendation alerts without a full page reload.

---

## 📁 Project Folder Structure

```
vivek_hackthon/
├── data/
│   └── small_business_brain.db   # SQLite database file (WAL mode)
├── scripts/
│   └── seed.mjs                  # Standalone CLI seeding script (npm run seed)
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── dashboard/        # GET /api/dashboard (KPIs, monthly trends, top products)
│   │   │   ├── sales/            # GET /api/sales, POST /api/sales (auto-decrements stock)
│   │   │   ├── products/         # GET /api/products, POST /api/products, PUT /api/products
│   │   │   ├── expenses/         # GET /api/expenses, POST /api/expenses
│   │   │   ├── recommendations/  # GET /api/recommendations (rule-based intelligence)
│   │   │   └── seed/             # POST /api/seed (in-app one-click re-seed)
│   │   ├── globals.css           # Tailwind CSS imports & base styles
│   │   ├── layout.tsx            # Root HTML layout with responsive typography
│   │   └── page.tsx              # Unified single-page reactive dashboard container
│   ├── components/
│   │   ├── Header.tsx            # Top bar, branding, quick actions, tab navigation
│   │   ├── DateRangeFilter.tsx   # 7d / 30d / 3m / 6m date selector
│   │   ├── KpiCard.tsx           # Stat card with MoM trends & status badges
│   │   ├── DashboardView.tsx     # Executive overview, Recharts bar chart & top lists
│   │   ├── SalesView.tsx         # Sales metrics, declining items alert & sales ledger
│   │   ├── InventoryView.tsx     # Stock table, run-rate forecast & inline stock editor
│   │   ├── ExpensesView.tsx      # Expense distribution donut chart & ledger
│   │   ├── RecommendationsView.tsx # Actionable insights cards with explainable logic
│   │   ├── DataEntryModal.tsx    # Multi-tab modal for Sale, Product, and Expense entry
│   │   └── RecommendationLogicModal.tsx # Formula and rule transparency modal
│   └── lib/
│       ├── db.ts                 # SQLite singleton with WAL mode and schema auto-creation
│       ├── formatters.ts         # Indian Rupee (₹), numbers, dates, and status badges
│       ├── recommendationEngine.ts # Rule evaluation algorithms & explanation generator
│       ├── seed.ts               # 6-month retail data generator module
│       └── types.ts              # TypeScript domain interfaces
├── next.config.ts                # Next.js configuration (serverExternalPackages for better-sqlite3)
├── package.json                  # Scripts & dependencies
└── tsconfig.json                 # TypeScript compiler configuration
```

---

## 🛠️ Verification & Testing Commands

To verify the installation and data pipeline at any time:

1. **Re-seed sample data**:
   ```bash
   npm run seed
   ```
2. **Type-check & production build**:
   ```bash
   npm run build
   ```
3. **Start production server**:
   ```bash
   npm run start
   ```

---

## 💡 Design & Architecture Highlights
- **Local Sovereignty**: All data is stored in a zero-configuration SQLite database on your local disk.
- **Indian Retail Context**: Formatted natively in Indian Rupees (`₹1,54,060` with Lakhs / Thousands conventions).
- **Zero Hallucination**: No external AI API key or network call is required; decisions are auditable, explainable, and deterministic.
- **Instant Mutation & Reactivity**: Adding a sale immediately updates inventory stock levels and triggers real-time recalculations across all dashboard KPIs and recommendations.


npm run seed

npm run dev



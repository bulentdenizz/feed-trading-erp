# 🏗️ Feed Trading ERP — Complete Architecture & Development Roadmap
### Production-Ready Design From Scratch
**Prepared for:** Yem Dükkanı Desktop ERP  
**Stack:** Electron + React + Node.js + SQLite  
**Standard:** Business-critical, tax-compliant, immutable ledger

---

## Table of Contents
1. [🧠 System Architecture](#1--system-architecture)
2. [🧱 Data Model Design](#2--data-model-design)
3. [🚀 Development Roadmap](#3--development-roadmap)
4. [⚙️ Backend Design](#4--backend-design)
5. [🎨 Frontend Strategy](#5--frontend-strategy)
6. [⚠️ Risk Analysis](#6--risk-analysis)
7. [📌 Golden Rules](#7--golden-rules)

---

# 1. 🧠 System Architecture

## 1.1 — The Foundational Philosophy (Read This First)

The previous system failed because it mixed two incompatible approaches:
- It tried to be a **cached balance system** (fast reads via stored `balance` field)  
- But had **no guaranteed write path** to keep that cache consistent

The new system is built on three non-negotiable principles:

> **Principle 1 — The Transaction Log is the only source of truth.**  
> Balances are never stored — they are always computed from the log.  
>
> **Principle 2 — Records are immutable. Corrections create new records.**  
> Nothing is ever deleted. Wrong entries are cancelled with a reversal.  
>
> **Principle 3 — Every money value is an integer (kuruş).**  
> There is no floating-point arithmetic on any financial data.  

---

## 1.2 — Electron Process Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  MAIN PROCESS (Node.js)                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐   │
│  │   DB     │  │Services  │  │Handlers  │  │  Auth    │   │
│  │ (SQLite) │◄─│ Layer    │◄─│ (IPC)    │◄─│ Session  │   │
│  └──────────┘  └──────────┘  └──────────┘  └──────────┘   │
│                                    ▲                        │
│  Secure IPC Bridge (contextBridge) │                        │
│  ────────────────────────────────────────────────────────  │
│                                    │                        │
│  RENDERER PROCESS (React)          │                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                  │
│  │  Pages   │  │  State   │  │  API     │                  │
│  │          │◄─│  (Zustand│◄─│  Layer   │                  │
│  └──────────┘  │  +Query) │  └──────────┘                  │
│                └──────────┘                                 │
└─────────────────────────────────────────────────────────────┘
```

**Why this separation matters:**  
- The renderer process has zero direct database access — everything goes through named IPC channels  
- `contextIsolation: true` and `nodeIntegration: false` on the renderer — no renderer code can call `require()`  
- Session tokens are validated in the main process on **every single IPC call** — not just at login  

---

## 1.3 — Folder Structure

```
project-root/
├── src/
│   ├── main/                          ← Node.js main process
│   │   ├── db/
│   │   │   ├── index.js               ← DB init, WAL config, FK enforcement
│   │   │   ├── schema.js              ← All CREATE TABLE statements
│   │   │   └── migrations/            ← Versioned, numbered migration files
│   │   │       ├── 001_initial.js
│   │   │       └── 002_add_sku.js
│   │   ├── services/                  ← PURE BUSINESS LOGIC (no IPC here)
│   │   │   ├── StockService.js        ← All stock read/write
│   │   │   ├── LedgerService.js       ← Balance computation, entity queries
│   │   │   ├── TransactionService.js  ← Create, cancel transactions
│   │   │   ├── PaymentService.js      ← Allocations, open invoice queries
│   │   │   ├── ReportService.js       ← Reporting queries
│   │   │   ├── InvoiceNumberService.js
│   │   │   ├── BackupService.js
│   │   │   └── AuthService.js
│   │   ├── handlers/                  ← IPC wiring ONLY (thin layer)
│   │   │   ├── transactions.handler.js
│   │   │   ├── inventory.handler.js
│   │   │   ├── entities.handler.js
│   │   │   ├── payments.handler.js
│   │   │   ├── reports.handler.js
│   │   │   ├── settings.handler.js
│   │   │   └── auth.handler.js
│   │   ├── utils/
│   │   │   ├── money.js               ← Integer kuruş ↔ display string
│   │   │   ├── validation.js          ← Input validators
│   │   │   ├── logger.js              ← Structured logging (file + console)
│   │   │   └── sessionStore.js        ← In-memory session map
│   │   └── index.js                   ← Electron app entry
│   │
│   ├── preload/
│   │   └── index.js                   ← contextBridge API surface
│   │
│   └── renderer/                      ← React app
│       ├── api/                       ← All IPC calls are here, nowhere else
│       │   ├── index.js
│       │   ├── transactions.api.js
│       │   ├── inventory.api.js
│       │   ├── entities.api.js
│       │   ├── payments.api.js
│       │   └── reports.api.js
│       ├── components/
│       │   ├── ui/                    ← Buttons, inputs, cards (design system)
│       │   ├── forms/                 ← TransactionForm, PaymentForm etc.
│       │   ├── tables/                ← DataTable, sortable columns
│       │   └── modals/                ← Modal wrappers
│       ├── pages/
│       │   ├── Dashboard/
│       │   ├── Sales/
│       │   ├── Purchases/
│       │   ├── Customers/
│       │   ├── Suppliers/
│       │   ├── Inventory/
│       │   ├── Payments/
│       │   ├── Reports/
│       │   └── Settings/
│       ├── hooks/                     ← useQuery wrappers per domain
│       ├── store/                     ← Zustand global state (auth, UI)
│       └── utils/
│           ├── formatters.js          ← formatMoney, formatDate
│           └── constants.js
```

---

# 2. 🧱 Data Model Design

## 2.1 — The Core Design Decisions

### Decision A: All Money is Stored as INTEGER (kuruş)
```
25.50 TL → stored as 2550 (integer)
1,500.00 TL → stored as 150000 (integer)
```
This eliminates floating-point arithmetic entirely. Every financial comparison is an exact integer comparison.

### Decision B: No `balance` Column on entities
The `entities` table has no `balance` field. Balance is always computed:
```sql
SELECT COALESCE(SUM(
  CASE
    WHEN transaction_type IN ('sale','purchase')          THEN amount_kurus
    WHEN transaction_type IN ('payment_in','payment_out') THEN -amount_kurus
    WHEN transaction_type IN ('sale_return','purchase_return') THEN -amount_kurus
    ELSE 0
  END
), 0)
FROM transactions
WHERE entity_id = ? AND status = 'active'
```
This is slightly slower on large datasets but **cannot drift**. It will be fast enough for any single-shop operation (< 100,000 transactions = sub-millisecond query).

### Decision C: No `stock_quantity` Column on items (or a strictly controlled cache)
Stock is always computed from `stock_movements`. If a performance cache is needed later, it is written **only** by `StockService` and **never** by `ItemService`.

### Decision D: Cancellation Creates a Reversal Record, Never Deletes
```
Original Sale #47:  +2000 TL, status='active'
Cancellation of #47 → creates new Sale Return #63: -2000 TL, cancels_id=47
Sale #47: status='cancelled', cancelled_by=#63
```

---

## 2.2 — Complete SQL Schema

```sql
-- ============================================================
-- USERS & AUTH
-- ============================================================
CREATE TABLE users (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  username          TEXT    NOT NULL UNIQUE COLLATE NOCASE,
  password_hash     TEXT    NOT NULL,
  role              TEXT    NOT NULL CHECK(role IN ('admin','staff')),
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_login_at     TEXT
);

-- ============================================================
-- ENTITIES (Customers & Suppliers)
-- No balance column — always computed from transactions
-- ============================================================
CREATE TABLE entities (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  title             TEXT    NOT NULL CHECK(length(trim(title)) > 0),
  entity_type       TEXT    NOT NULL CHECK(entity_type IN ('customer','supplier')),
  phone             TEXT,
  address           TEXT,
  notes             TEXT,
  tax_number        TEXT,
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by        INTEGER REFERENCES users(id)
);

-- ============================================================
-- ITEMS (Products)
-- No stock_quantity column — always computed from stock_movements
-- ============================================================
CREATE TABLE items (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  name              TEXT    NOT NULL CHECK(length(trim(name)) > 0),
  sku               TEXT    UNIQUE,
  unit              TEXT    NOT NULL DEFAULT 'kg',
  category          TEXT,
  default_sale_price_kurus   INTEGER NOT NULL DEFAULT 0 CHECK(default_sale_price_kurus >= 0),
  default_buy_price_kurus    INTEGER NOT NULL DEFAULT 0 CHECK(default_buy_price_kurus >= 0),
  tax_rate_bps      INTEGER NOT NULL DEFAULT 0 CHECK(tax_rate_bps >= 0),
  -- 800 = 8%, 1000 = 10%, 2000 = 20%
  is_active         INTEGER NOT NULL DEFAULT 1,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by        INTEGER REFERENCES users(id)
);

-- ============================================================
-- TRANSACTIONS (Immutable Journal)
-- This is the financial ledger. Records are NEVER deleted.
-- Errors are corrected by creating a cancellation/reversal.
-- ============================================================
CREATE TABLE transactions (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  invoice_number        TEXT    UNIQUE,
  transaction_type      TEXT    NOT NULL CHECK(transaction_type IN (
                          'sale','purchase',
                          'payment_in','payment_out',
                          'sale_return','purchase_return'
                        )),
  entity_id             INTEGER NOT NULL REFERENCES entities(id),
  -- All monetary values stored in INTEGER kuruş (1 TL = 100 kuruş)
  amount_kurus          INTEGER NOT NULL CHECK(amount_kurus > 0),
  tax_amount_kurus      INTEGER NOT NULL DEFAULT 0 CHECK(tax_amount_kurus >= 0),
  amount_excl_tax_kurus INTEGER NOT NULL DEFAULT 0,
  transaction_date      TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  due_date              TEXT,
  description           TEXT,
  -- status: 'active' | 'cancelled'
  -- Cancelled means a reversal record exists. Never truly deleted.
  status                TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),
  -- If this record cancels another, point to it
  cancels_transaction_id INTEGER REFERENCES transactions(id),
  -- If this record was cancelled, point to the cancellation record
  cancelled_by_transaction_id INTEGER REFERENCES transactions(id),
  cancelled_at          TEXT,
  cancel_reason         TEXT,
  created_by            INTEGER REFERENCES users(id),
  created_at            TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- TRANSACTION LINE ITEMS
-- Snapshots product name/price at time of transaction.
-- item_name_snapshot ensures history survives item renames.
-- ============================================================
CREATE TABLE transaction_items (
  id                    INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id        INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
  item_id               INTEGER REFERENCES items(id),
  -- Snapshot fields — these never change after insert
  item_name_snapshot    TEXT    NOT NULL,
  unit_snapshot         TEXT    NOT NULL DEFAULT 'kg',
  quantity              REAL    NOT NULL CHECK(quantity > 0),
  unit_price_kurus      INTEGER NOT NULL CHECK(unit_price_kurus >= 0),
  tax_rate_bps          INTEGER NOT NULL DEFAULT 0,
  subtotal_kurus        INTEGER NOT NULL CHECK(subtotal_kurus >= 0),
  -- Average cost at time of sale — for COGS / profit reporting
  -- NULL for purchases (cost IS the unit_price)
  cost_price_kurus_snapshot INTEGER
);

-- ============================================================
-- STOCK MOVEMENTS (Immutable Inventory Ledger)
-- Every single stock change creates a row here.
-- items.stock_quantity is computed: SUM(quantity_change) WHERE item_id=?
-- ============================================================
CREATE TABLE stock_movements (
  id                INTEGER PRIMARY KEY AUTOINCREMENT,
  transaction_id    INTEGER REFERENCES transactions(id),
  item_id           INTEGER NOT NULL REFERENCES items(id),
  movement_type     TEXT    NOT NULL CHECK(movement_type IN (
                      'opening',            -- initial stock entry
                      'purchase_in',        -- stock received from supplier
                      'sale_out',           -- stock shipped to customer
                      'return_in',          -- customer returned goods
                      'return_out',         -- goods returned to supplier
                      'manual_increase',    -- physical count correction (positive)
                      'manual_decrease',    -- physical count correction (negative)
                      'cancellation'        -- automatic reversal of a cancelled transaction
                    )),
  -- Positive = stock increased. Negative = stock decreased.
  quantity_change   REAL    NOT NULL,
  -- Running balance AFTER this movement (for fast history display)
  -- Computed and stored — but can always be recomputed from the full movement log
  balance_after     REAL    NOT NULL,
  unit_cost_kurus   INTEGER,              -- for inventory valuation
  notes             TEXT,
  created_at        TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  created_by        INTEGER REFERENCES users(id)
);

-- ============================================================
-- PAYMENT ALLOCATIONS
-- Links a payment to specific invoices.
-- This is what drives the per-invoice "remaining" calculation.
-- ============================================================
CREATE TABLE payment_allocations (
  id                        INTEGER PRIMARY KEY AUTOINCREMENT,
  payment_transaction_id    INTEGER NOT NULL REFERENCES transactions(id),
  invoice_transaction_id    INTEGER NOT NULL REFERENCES transactions(id),
  amount_kurus              INTEGER NOT NULL CHECK(amount_kurus > 0),
  created_at                TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  -- Prevent duplicate allocations between the same payment and invoice
  UNIQUE(payment_transaction_id, invoice_transaction_id)
);

-- ============================================================
-- INVOICE NUMBER SEQUENCES
-- ============================================================
CREATE TABLE invoice_sequences (
  type          TEXT    PRIMARY KEY CHECK(type IN ('sale','purchase','payment_in','payment_out')),
  prefix        TEXT    NOT NULL,
  last_number   INTEGER NOT NULL DEFAULT 0,
  year          INTEGER NOT NULL
);

-- ============================================================
-- SETTINGS
-- ============================================================
CREATE TABLE settings (
  key           TEXT    PRIMARY KEY,
  value         TEXT    NOT NULL,
  updated_at    TEXT    DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_by    INTEGER REFERENCES users(id)
);

-- ============================================================
-- AUDIT LOG (Append-only — no updates or deletes ever)
-- Captures every sensitive change for forensic reconstruction
-- ============================================================
CREATE TABLE audit_log (
  id            INTEGER PRIMARY KEY AUTOINCREMENT,
  table_name    TEXT    NOT NULL,
  record_id     INTEGER,
  action        TEXT    NOT NULL CHECK(action IN ('INSERT','UPDATE','CANCEL','LOGIN','BACKUP','RECONCILE')),
  summary       TEXT,               -- human-readable: "Sale #47 cancelled. Reason: wrong qty"
  payload_json  TEXT,               -- JSON snapshot of relevant fields
  user_id       INTEGER REFERENCES users(id),
  created_at    TEXT    NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX idx_transactions_entity_date    ON transactions(entity_id, transaction_date DESC);
CREATE INDEX idx_transactions_type_status    ON transactions(transaction_type, status);
CREATE INDEX idx_transactions_invoice_no     ON transactions(invoice_number);
CREATE INDEX idx_transactions_due_date       ON transactions(due_date) WHERE due_date IS NOT NULL;
CREATE INDEX idx_transaction_items_tx        ON transaction_items(transaction_id);
CREATE INDEX idx_transaction_items_item      ON transaction_items(item_id);
CREATE INDEX idx_stock_movements_item_date   ON stock_movements(item_id, created_at DESC);
CREATE INDEX idx_stock_movements_tx          ON stock_movements(transaction_id);
CREATE INDEX idx_payment_alloc_payment       ON payment_allocations(payment_transaction_id);
CREATE INDEX idx_payment_alloc_invoice       ON payment_allocations(invoice_transaction_id);
CREATE INDEX idx_audit_log_table_record      ON audit_log(table_name, record_id);

-- ============================================================
-- COMPUTED VIEWS (read-only, always correct)
-- ============================================================

-- Current stock per item (always derived from movements)
CREATE VIEW v_stock AS
SELECT
  i.id           AS item_id,
  i.name,
  i.unit,
  i.is_active,
  COALESCE(SUM(sm.quantity_change), 0) AS current_stock
FROM items i
LEFT JOIN stock_movements sm ON sm.item_id = i.id
GROUP BY i.id;

-- Entity balances (always derived from transactions)
CREATE VIEW v_entity_balances AS
SELECT
  e.id           AS entity_id,
  e.title,
  e.entity_type,
  COALESCE(SUM(
    CASE
      WHEN t.transaction_type IN ('sale','purchase')              THEN  t.amount_kurus
      WHEN t.transaction_type IN ('payment_in','payment_out')     THEN -t.amount_kurus
      WHEN t.transaction_type IN ('sale_return','purchase_return') THEN -t.amount_kurus
      ELSE 0
    END
  ), 0)          AS balance_kurus
FROM entities e
LEFT JOIN transactions t ON t.entity_id = e.id AND t.status = 'active'
GROUP BY e.id;

-- Open invoices with computed remaining (always derived from allocations)
CREATE VIEW v_open_invoices AS
SELECT
  t.id,
  t.invoice_number,
  t.transaction_type,
  t.entity_id,
  t.amount_kurus,
  t.due_date,
  t.transaction_date,
  COALESCE(SUM(pa.amount_kurus), 0)              AS paid_kurus,
  t.amount_kurus - COALESCE(SUM(pa.amount_kurus),0) AS remaining_kurus
FROM transactions t
LEFT JOIN payment_allocations pa ON pa.invoice_transaction_id = t.id
WHERE t.transaction_type IN ('sale','purchase')
  AND t.status = 'active'
GROUP BY t.id
HAVING remaining_kurus > 0;
```

---

## 2.3 — Data Flow Diagrams

### Creating a Credit Sale:
```
User submits sale form
        │
        ▼
[Validation Layer]
  - amount > 0 ✓
  - entity exists & is customer ✓
  - all line items have valid item_id ✓
  - stock available for each item ✓
        │
        ▼
[db.transaction() BEGIN]
  │
  ├─ INSERT INTO transactions (type='sale', amount, status='active')
  │
  ├─ INSERT INTO transaction_items (one row per product line)
  │    └─ Snapshot: item_name, unit, price, tax_rate, cost_price at this moment
  │
  ├─ For each line item:
  │    └─ INSERT INTO stock_movements (type='sale_out', qty_change=-qty, balance_after=computed)
  │
  ├─ INSERT INTO audit_log (action='INSERT', summary='Sale #SAT-2026-0042 created')
  │
[db.transaction() COMMIT]
        │
        ▼
Return { success: true, transactionId, invoiceNumber }
```

### Cancelling a Sale (with prior payments):
```
User requests cancellation of Sale #42
        │
        ▼
[Pre-cancellation checks]
  - Transaction exists and is 'active'
  - If it has payment_allocations:
      → BLOCK. User must cancel the payment first.
        (Or allow cascade: see risk analysis)
        │
        ▼
[db.transaction() BEGIN]
  │
  ├─ FETCH original line items (for stock reversal)
  │
  ├─ INSERT INTO transactions (
  │     type='sale_return',
  │     amount=original_amount,    ← same amount, reverses balance
  │     cancels_transaction_id=42,
  │     status='active'
  │   )
  │   → This is the "reversal invoice" — it is a real record in the ledger
  │
  ├─ For each original line item:
  │    └─ INSERT INTO stock_movements (type='cancellation', qty_change=+original_qty)
  │
  ├─ UPDATE transactions SET
  │      status='cancelled',
  │      cancelled_by_transaction_id = new_reversal_id,
  │      cancelled_at = now(),
  │      cancel_reason = ?
  │    WHERE id = 42
  │
  ├─ INSERT INTO audit_log (action='CANCEL', summary='Sale #42 cancelled. Reversal #87 created.')
  │
[db.transaction() COMMIT]
```

### Payment with Allocation:
```
User pays 800 TL against customer Ahmet's open invoices
        │
        ▼
[db.transaction() BEGIN]
  │
  ├─ INSERT INTO transactions (type='payment_in', amount=800_kurus * 100)
  │
  ├─ Compute auto-allocations (oldest due_date first):
  │    Open Invoice #42: remaining=2000 TL → allocate 800 TL
  │    
  ├─ INSERT INTO payment_allocations (payment_id=new, invoice_id=42, amount=80000 kuruş)
  │
  ├─ INSERT INTO audit_log
  │
[db.transaction() COMMIT]
        │
        ▼
Invoice #42 remaining: computed from allocations = 2000 - 800 = 1200 TL
Entity balance: computed from transactions = 2000 (sale) - 800 (payment) = 1200 TL
✓ Both sources agree — no drift possible
```

---

# 3. 🚀 Development Roadmap

## PHASE 1 — Foundation (Week 1–2)
**Goal:** A running Electron app with database, auth, and IPC skeleton.

### Build List:
- [ ] Electron app scaffold (`electron-vite`, `contextIsolation: true`, `nodeIntegration: false`)
- [ ] SQLite setup with WAL mode, FK enforcement
- [ ] Full schema creation (all tables from Section 2.2)
- [ ] Migration runner (run numbered migration files on startup, track in `schema_version` table)
- [ ] `AuthService` — scrypt password hashing, session token map in main process memory
- [ ] Session middleware — every IPC handler checks token before executing
- [ ] `BackupService` — uses `db.backup()` (not `fs.copyFileSync`)
- [ ] `money.js` utility — `toKurus(string) → integer`, `fromKurus(integer) → "1.234,56 ₺"`
- [ ] `logger.js` — writes structured JSON log to `userData/app.log`
- [ ] `validation.js` — reusable validators (non-empty string, positive integer, valid date, etc.)
- [ ] Login page (React) wired to auth IPC

**Why this matters:**  
Foundation bugs are the hardest to fix later. A wrong money representation discovered in Phase 4 requires touching every table. Establish the correct primitives now.

**What can go wrong:**  
- Forgetting `db.pragma('foreign_keys = ON')` on every new connection — wrap DB init so it's impossible to open a connection without it
- Session tokens stored in renderer state — the renderer can be inspected; tokens must live in main-process memory only

---

## PHASE 2 — Inventory System (Week 3–4)
**Goal:** Complete, auditable stock tracking that cannot be corrupted.

### Build List:
- [ ] `StockService.js`:
  - `createItem(data, userId)` — inserts item + optional `opening` stock movement
  - `recordMovement(itemId, type, qty, txId, userId, notes)` — the ONE function that writes to `stock_movements`
  - `getCurrentStock(itemId)` — queries `v_stock` view
  - `getStockHistory(itemId, limit, offset)` — paginated movement log
  - `setOpeningStock(itemId, qty, userId)` — inserts `opening` movement (allowed once per item only)
  - `performManualAdjustment(itemId, newQty, reason, userId)` — creates `manual_increase` or `manual_decrease`
- [ ] Rule enforced in code: **`items` table has no `stock_quantity` column.** If it did, there would be a temptation to update it directly. It does not exist.
- [ ] Inventory pages: item list, item detail with full movement history
- [ ] Manual adjustment UI (with mandatory reason text)
- [ ] Low-stock alerts (configurable threshold in settings)

**Why this matters:**  
If `recordMovement` is the only path to change stock, it is impossible to have an untracked change. The previous system had 3 different paths — this system has exactly 1.

**What can go wrong:**  
- Developer adds a convenience shortcut: `db.prepare('UPDATE items SET qty=?')` somewhere in a handler. This must be a code review hard rule: **no direct stock writes anywhere except `StockService.recordMovement`**.
- Opening stock for items with prior history — log it as `opening` but make it clear this is "as of system adoption date", not a new purchase.

---

## PHASE 3 — Entity & Ledger System (Week 5–6)
**Goal:** Customers, suppliers, and their complete financial history.

### Build List:
- [ ] `LedgerService.js`:
  - `getBalance(entityId)` — queries `v_entity_balances` (always computed, never stored)
  - `getStatement(entityId, fromDate, toDate)` — full transaction history with running balance
  - `getOpenInvoices(entityId)` — queries `v_open_invoices`
  - `getAgingReport()` — 0-30, 31-60, 61-90, 90+ days overdue buckets
- [ ] Entity CRUD with validation (title required, type immutable after creation)
- [ ] Customer detail page: balance (computed), open invoices, payment history, full statement
- [ ] Supplier detail page: same structure
- [ ] Due list page (sorted by due_date, color-coded overdue)

**Why this matters:**  
The balance computed from `v_entity_balances` will always match the statement total. There is no `entities.balance` field to go out of sync. The aging report gives the business owner an actionable view of who owes what.

**What can go wrong:**  
- Performance on the balance view for entities with thousands of transactions. Solution: add `created_at` index on transactions and filter by date range for statement, use the full query only for current balance (no date filter needed, it's always fast for < 50,000 rows per entity).

---

## PHASE 4 — Transactions & Payments (Week 7–9)
**Goal:** Full sales/purchase cycle with correct payment allocation.

### Build List:
- [ ] `TransactionService.js`:
  - `createSale(data, userId)` — full atomic creation
  - `createPurchase(data, userId)` — full atomic creation
  - `cancelTransaction(txId, reason, userId)` — creates reversal record
  - `getTransaction(txId)` — with line items
  - Immutability rule: `sale` and `purchase` records cannot be updated, only cancelled
- [ ] `PaymentService.js`:
  - `recordPayment(data, userId)` — creates payment_in or payment_out, handles allocations
  - `allocatePayment(paymentTxId, invoiceTxId, amountKurus)` — explicit allocation
  - `autoAllocate(paymentTxId, entityId, amountKurus)` — fills oldest invoices first
  - `getUnallocatedPayments(entityId)` — payments not fully applied to invoices
  - `cancelPayment(txId, reason, userId)` — reverses allocations, creates reversal record
- [ ] `InvoiceNumberService.js` — atomic: `UPDATE ... SET last_number=last_number+1 WHERE type=? RETURNING last_number, prefix, year`
- [ ] Sales page: create sale, view invoice, print PDF
- [ ] Purchases page: create purchase, view receipt
- [ ] Payment modal: show open invoices for entity, auto-allocate or manual allocation
- [ ] PDF generation with HTML-escaped values (use a templating function, never string interpolation)

**Why this matters:**  
This is the financial core. Every line of `TransactionService` and `PaymentService` must be inside a `db.transaction()`. No exceptions.

**What can go wrong:**  
- The classic: payment created, `payment_allocations` insert fails, entity balance is now wrong. This cannot happen if the entire payment creation — including all allocations — is in a single `db.transaction()` block.
- Overpayment: customer pays 3000 on a 2000 invoice. The extra 1000 should be recorded as an "advance" — a payment with no invoice allocation. The `v_entity_balances` view correctly shows the balance as -1000 (credit). Future invoices will be auto-allocated against this credit.

---

## PHASE 5 — Reporting & Tax (Week 10–11)
**Goal:** Actionable reports for business decisions and tax compliance.

### Build List:
- [ ] `ReportService.js`:
  - `getSalesSummary(fromDate, toDate)` — total, by product, by customer
  - `getPurchaseSummary(fromDate, toDate)`
  - `getProfitReport(fromDate, toDate)` — revenue vs COGS (using `cost_price_kurus_snapshot`)
  - `getKdvReport(fromDate, toDate)` — KDV by rate (8%, 10%, 20%), matrah, KDV tutarı
  - `getCashFlowReport(fromDate, toDate)` — only `payment_in` and `payment_out` (not sales!)
  - `getInventoryValuationReport()` — current stock × average cost
- [ ] Reports page with date range picker, export to PDF / CSV
- [ ] Dashboard: computed stats (never cached), last 7 days chart, top customers, low stock
- [ ] KDV Report explicitly separates accrual (when sale was made) vs cash (when payment received)

**What can go wrong:**  
- COGS is wrong for items that were never purchased through the system (initial stock). These items have no purchase records so `cost_price_kurus_snapshot` is 0. Solution: require cost price input when creating opening stock.
- Confusing "daily revenue" with "daily cash collected". The dashboard must show both clearly labeled.

---

## PHASE 6 — Polish & Resilience (Week 12–13)
**Goal:** Harden the system for real-world use.

### Build List:
- [ ] Database health check on startup: verify FK integrity, verify `v_stock` matches expected values
- [ ] Auto-backup on app close (max 10 backups, rotate oldest)
- [ ] Import tool: CSV import for opening stock and initial entity balances
- [ ] UI polish: keyboard shortcuts, print formatting, confirmation dialogs for destructive actions
- [ ] Stress test: generate 10,000 transactions via script and verify all balance/stock queries return in under 500ms
- [ ] Error boundary: any unhandled error in renderer shows a friendly message, not a crash

---

# 4. ⚙️ Backend Design

## 4.1 — Service Layer Rules

Each service follows these rules:

1. **Services receive a `db` instance as a parameter** — they do not call `getDb()` internally. This makes them testable without Electron.
2. **Services return plain objects** — no IPC-specific structures.
3. **Services throw typed errors** — `class InsufficientStockError extends Error {}` — handlers catch and translate to user messages.
4. **All multi-table operations are in a single `db.transaction()`** — the transaction function is a pure synchronous function passed to `db.transaction()`.

### StockService.js structure:
```javascript
export class StockService {
  constructor(db) { this.db = db; }

  // The only function that writes to stock_movements
  recordMovement({ itemId, type, quantityChange, transactionId = null, unitCostKurus = null, notes = null, userId }) {
    if (quantityChange === 0) throw new Error('quantity_change cannot be zero');

    const item = this.db.prepare('SELECT id FROM items WHERE id = ?').get(itemId);
    if (!item) throw new Error(`Item ${itemId} not found`);

    const currentStock = this._computeCurrentStock(itemId);
    const balanceAfter = currentStock + quantityChange;

    if (balanceAfter < 0) {
      throw new InsufficientStockError(`Stock would go negative for item ${itemId}`);
    }

    return this.db.prepare(`
      INSERT INTO stock_movements
        (transaction_id, item_id, movement_type, quantity_change, balance_after, unit_cost_kurus, notes, created_by)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(transactionId, itemId, type, quantityChange, balanceAfter, unitCostKurus, notes, userId);
  }

  _computeCurrentStock(itemId) {
    const result = this.db.prepare(
      'SELECT COALESCE(SUM(quantity_change), 0) AS stock FROM stock_movements WHERE item_id = ?'
    ).get(itemId);
    return result.stock;
  }

  getCurrentStock(itemId) {
    return this._computeCurrentStock(itemId);
  }

  setOpeningStock(itemId, quantity, costKurus, userId) {
    const existing = this.db.prepare(
      "SELECT id FROM stock_movements WHERE item_id = ? AND movement_type = 'opening'"
    ).get(itemId);
    if (existing) throw new Error('Opening stock already set for this item');
    if (quantity < 0) throw new Error('Opening stock cannot be negative');
    if (quantity === 0) return null; // No movement needed
    
    return this.recordMovement({
      itemId, type: 'opening',
      quantityChange: quantity,
      unitCostKurus: costKurus,
      notes: 'Açılış stoğu',
      userId
    });
  }
}
```

### TransactionService.js — createSale:
```javascript
export class TransactionService {
  constructor(db, stockService, invoiceService, auditService) {
    this.db = db;
    this.stockService = stockService;
    this.invoiceService = invoiceService;
    this.auditService = auditService;
  }

  createSale(data, userId) {
    // Validate BEFORE entering the transaction
    this._validateSaleData(data);

    const doCreate = this.db.transaction(() => {
      const invoiceNumber = this.invoiceService.next('sale');

      // Compute totals (all in kuruş integers)
      const { totalKurus, taxKurus, lineItems } = this._computeSaleTotals(data.items);

      const txResult = this.db.prepare(`
        INSERT INTO transactions
          (invoice_number, transaction_type, entity_id, amount_kurus, tax_amount_kurus,
           amount_excl_tax_kurus, transaction_date, due_date, description, status, created_by)
        VALUES (?, 'sale', ?, ?, ?, ?, ?, ?, ?, 'active', ?)
      `).run(
        invoiceNumber, data.entityId, totalKurus, taxKurus,
        totalKurus - taxKurus, data.date, data.dueDate ?? null,
        data.description ?? null, userId
      );
      const txId = txResult.lastInsertRowid;

      for (const li of lineItems) {
        // Snapshot current average cost for COGS tracking
        const avgCost = this._getAverageCost(li.itemId);

        this.db.prepare(`
          INSERT INTO transaction_items
            (transaction_id, item_id, item_name_snapshot, unit_snapshot,
             quantity, unit_price_kurus, tax_rate_bps, subtotal_kurus, cost_price_kurus_snapshot)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).run(txId, li.itemId, li.nameSn, li.unitSn, li.qty,
               li.priceKurus, li.taxBps, li.subtotalKurus, avgCost);

        this.stockService.recordMovement({
          itemId: li.itemId,
          type: 'sale_out',
          quantityChange: -li.qty,   // negative = stock decreases
          transactionId: txId,
          unitCostKurus: avgCost,
          userId
        });
      }

      this.auditService.log({
        tableName: 'transactions',
        recordId: txId,
        action: 'INSERT',
        summary: `Sale ${invoiceNumber} created. Amount: ${fromKurus(totalKurus)}`,
        userId
      });

      return txId;
    });

    return doCreate();
  }
}
```

---

## 4.2 — IPC Handler Pattern (Thin Layer)

Handlers do three things only: validate session, call service, return result.

```javascript
// transactions.handler.js
export function registerTransactionHandlers(ipcMain, db) {
  const transactionService = new TransactionService(db, ...);

  ipcMain.handle('transactions:createSale', async (event, { sessionToken, data }) => {
    // 1. Validate session — throws if invalid
    const user = sessionStore.validate(sessionToken);

    // 2. Call service — throws typed errors if validation fails
    try {
      const txId = transactionService.createSale(data, user.id);
      return { ok: true, data: { id: txId } };
    } catch (err) {
      // 3. Translate typed errors to user-friendly messages
      if (err instanceof InsufficientStockError) {
        return { ok: false, code: 'INSUFFICIENT_STOCK', message: err.message };
      }
      if (err instanceof ValidationError) {
        return { ok: false, code: 'VALIDATION', message: err.message };
      }
      logger.error('Unhandled error in transactions:createSale', err);
      return { ok: false, code: 'INTERNAL', message: 'Beklenmeyen bir hata oluştu.' };
    }
  });
}
```

---

## 4.3 — Money Utility (money.js)

```javascript
// NEVER use floating-point for money. This is the only place conversion happens.

/**
 * Convert a display string to kuruş integer
 * "25.50" → 2550
 * "1,234.56" → 123456
 * "1.234,56" (Turkish format) → 123456
 */
export function toKurus(input) {
  if (typeof input === 'number') {
    if (!Number.isFinite(input)) throw new Error('Invalid money value');
    // Round to 2 decimal places BEFORE converting to avoid floating point drift
    return Math.round(input * 100);
  }
  if (typeof input === 'string') {
    // Normalize: remove thousands separators, convert comma-decimal to dot-decimal
    const normalized = input
      .replace(/\s/g, '')
      .replace(/\.(?=\d{3}(?:[,\s]|$))/g, '')  // remove thousands dots
      .replace(',', '.');
    const num = parseFloat(normalized);
    if (!Number.isFinite(num)) throw new Error(`Cannot parse money value: "${input}"`);
    return Math.round(num * 100);
  }
  throw new Error('toKurus requires string or number');
}

/**
 * Format kuruş integer for display
 * 2550 → "25,50 ₺"
 * 150000 → "1.500,00 ₺"
 */
export function fromKurus(kurus, currency = '₺') {
  if (!Number.isInteger(kurus)) throw new Error('fromKurus requires integer');
  const formatted = new Intl.NumberFormat('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(kurus / 100);
  return `${formatted} ${currency}`;
}

/**
 * Add two kuruş values — this is just integer addition, but explicit
 */
export function addKurus(a, b) {
  return a + b;
}

/**
 * Apply a percentage to a kuruş value, returning an integer
 * Uses banker's rounding to minimize systematic bias
 */
export function applyPercent(kurus, basisPoints) {
  // basisPoints: 800 = 8%, 1000 = 10%, 2000 = 20%
  return Math.round((kurus * basisPoints) / 10000);
}
```

---

# 5. 🎨 Frontend Strategy

## 5.1 — State Management Architecture

Two layers of state:

**Layer 1 — Server State (React Query / TanStack Query)**  
All data that comes from the database. Auto-refetches on focus, has cache, handles loading/error states.

```javascript
// hooks/useOpenInvoices.js
export function useOpenInvoices(entityId) {
  return useQuery({
    queryKey: ['open-invoices', entityId],
    queryFn: () => window.api.payments.getOpenInvoices(entityId),
    enabled: !!entityId,
    staleTime: 30_000,  // 30 seconds
  });
}
```

**Layer 2 — UI State (Zustand)**  
Session, active modal, selected rows, sidebar open/closed. Nothing financial.

```javascript
// store/useAppStore.js
const useAppStore = create((set) => ({
  user: null,
  sessionToken: null,
  login: (user, token) => set({ user, sessionToken: token }),
  logout: () => set({ user: null, sessionToken: null }),
}));
```

---

## 5.2 — API Layer (renderer/api/)

Every IPC call is wrapped here. No `window.electron.ipcRenderer.invoke` calls anywhere else in the codebase.

```javascript
// api/transactions.api.js
export const transactionsApi = {
  createSale: async (data) => {
    const { sessionToken } = useAppStore.getState();
    const result = await window.api.call('transactions:createSale', { sessionToken, data });
    if (!result.ok) throw new ApiError(result.code, result.message);
    return result.data;
  },

  cancelTransaction: async (id, reason) => {
    const { sessionToken } = useAppStore.getState();
    const result = await window.api.call('transactions:cancel', { sessionToken, id, reason });
    if (!result.ok) throw new ApiError(result.code, result.message);
    return result.data;
  },
};
```

---

## 5.3 — Page Designs

### Dashboard
```
┌─────────────────────────────────────────────────────┐
│  [Toplam Alacak]  [Toplam Borç]  [Nakit Bu Hafta]  │
│  (from v_entity_balances customers)                 │
├──────────────────────┬──────────────────────────────┤
│  Son 7 Gün Satışlar  │  Vadesi Geçen (top 5)       │
│  (bar chart)         │  Ahmet: 3.400 ₺ - 12 gün   │
├──────────────────────┴──────────────────────────────┤
│  Kritik Stok (v_stock WHERE current_stock < threshold)│
└─────────────────────────────────────────────────────┘

RULE: Daily cash = only payment_in + payment_out (NOT sales).
      Sales are accrual. Cash is cash. Separate columns, always.
```

### Customer / Supplier Detail Page
```
┌──────────────────────────────────────────────────────┐
│  Ahmet Yılmaz                          Bakiye: 1.200₺ │
│  Tel: 0532-xxx-xxxx                                   │
├─────────────────────────────────────┬─────────────────┤
│  Açık Faturalar                     │  Hızlı Ödeme   │
│  #SAT-2026-0042  2000₺  Kalan:1200₺ │  [800 ₺ Al ]  │
│  #SAT-2026-0051  1500₺  Kalan:1500₺ │               │
├─────────────────────────────────────┴─────────────────┤
│  Tüm Hareketler (chronological, with running balance) │
│  24 Nis  Satış #42      +2000₺   Bakiye: 2000₺       │
│  25 Nis  Ödeme #P-31    -800₺    Bakiye: 1200₺       │
└──────────────────────────────────────────────────────┘
```

### Sales Page — New Sale Form
- Customer autocomplete (search by name)  
- Multi-line product table (add/remove rows)  
- Each row: product autocomplete, quantity, unit price (auto-filled from item default), tax rate, subtotal  
- Totals computed live in JS (integers only), no surprises on save  
- Payment type: Cash (creates payment_in immediately) or Credit (creates open invoice)  
- If cash: payment is auto-allocated to the new sale in the same transaction

---

# 6. ⚠️ Risk Analysis

## RISK 1 — Developer Bypasses the Service Layer (HIGH probability)

**Scenario:** A deadline is approaching. A developer writes `db.prepare("UPDATE items SET stock=?").run(...)` directly in a handler instead of calling `StockService.recordMovement`.

**Consequence:** An untracked stock change. The movement log is incomplete. Reports are wrong. If reconciliation runs, it "fixes" the stock in the wrong direction.

**Prevention:**
- Code review rule: grep the codebase for `UPDATE items` or `UPDATE entities` outside of designated service files before every merge.
- The `items` table should ideally have a SQLite trigger that inserts a `stock_movements` row on every UPDATE of stock — but since we have no `stock_quantity` column, the temptation doesn't exist.

---

## RISK 2 — Reconciliation Trusted Too Much (HIGH probability)

**Scenario:** The reconciliation tool is run by an admin "to fix a problem." Because the schema is correct (computed from movements), it actually fixes the right things. But a developer extends reconciliation to also "fix" movements that seem wrong — and destroys data.

**Prevention:**
- Reconciliation should ONLY fix: `v_entity_balances` inconsistencies that arise if a bug was introduced. It should NEVER modify `stock_movements` or `transactions`.
- Log every reconciliation run to `audit_log` with the full diff.

---

## RISK 3 — Integer Overflow on Amount (LOW probability, HIGH impact)

**Scenario:** A single transaction records 100,000 tons of feed × 50 TL/kg = 5,000,000,000 TL = 500,000,000,000 kuruş.

JavaScript's `Number.MAX_SAFE_INTEGER` = 9,007,199,254,740,991. A 5 trillion kuruş value (5,000,000,000,000) is safely below this limit. SQLite INTEGER supports up to 9,223,372,036,854,775,807. No overflow issue for any realistic feed trading business.

---

## RISK 4 — Quantity in REAL Type Causes Precision Loss (MEDIUM probability)

**Scenario:** Item sold: 33.33 kg. Stored as REAL. Displayed: 33.329999999...

**Prevention:**
- Round quantity to 3 decimal places on input (0.001 kg precision is enough for feed trading)
- Store: `ROUND(quantity, 3)` — use a validation function
- For totals: `quantity_kurus = Math.round(qty * 1000)` (store kg in grams as integer) OR accept REAL for quantity and handle display formatting, but ALWAYS store price as integer kuruş.

---

## RISK 5 — Cascading Cancellation Logic (MEDIUM probability)

**Scenario:** User wants to cancel a sale that has 3 payments allocated to it.

Two approaches — pick one and document it:

**Option A (Strict — Recommended):** Block the cancellation. Show a message: "3 payment(s) are allocated to this invoice. Cancel payments first, then cancel the invoice." The user must explicitly cancel each payment, then cancel the sale. Full audit trail preserved.

**Option B (Cascade):** Automatically cancel all linked payments when cancelling a sale. Faster UX. But the user might not realize their payment records were also cancelled.

For a tax-compliance context (Turkey has strict invoice audit requirements), **Option A is mandatory**. Every financial record cancellation must be an explicit user action with a documented reason.

---

## RISK 6 — User Edits Item Price and Expects Historical Invoices to Change (MEDIUM certainty)

**Scenario:** Besi Yemi was priced at 10 TL/kg on a sale in January. Price changed to 12 TL/kg in March. User now looks at January invoice.

**Prevention:** `transaction_items` has `unit_price_kurus` as a **snapshot** (copied at time of insert, never linked back to `items.default_sale_price_kurus`). The January invoice forever shows 10 TL. Changing the item's current price has zero effect on history. This is by design and must be clearly stated in the UI.

---

# 7. 📌 Golden Rules

These are non-negotiable. Breaking any of these means the system is not safe for real money.

---

### RULE 1 — Money is Always Integer Kuruş
```
✅  amount_kurus: 250000   (2500.00 TL)
❌  amount: 2500.00         (REAL — FORBIDDEN)
❌  amount: 2500            (integer but represents TL, not kuruş — ambiguous)
```
Every function that accepts a money value must be documented to expect kuruş. Every function that returns one must document it returns kuruş. The display layer converts — nowhere else.

---

### RULE 2 — The Transaction Log is Immutable
```
✅  Status changed from 'active' to 'cancelled'
✅  New reversal transaction #87 created to cancel #42
❌  UPDATE transactions SET amount = 1500 WHERE id = 42
❌  DELETE FROM transactions WHERE id = 42
```
`DELETE FROM transactions` should not exist in the codebase. Add a SQLite trigger that throws an error if anyone attempts a DELETE on transactions, transaction_items, stock_movements, or payment_allocations.

---

### RULE 3 — Stock Changes Through One Function Only
```
✅  stockService.recordMovement(...)
❌  db.prepare('UPDATE items SET stock = ?').run(...)
❌  Any direct write to stock_movements outside StockService
```
`items` table has no `stock_quantity` column. This eliminates the temptation.

---

### RULE 4 — Every Multi-Table Operation is a Single db.transaction()
```javascript
✅ const doWork = db.transaction(() => {
     // insert transaction
     // insert line items
     // record stock movements
     // insert audit log
   });
   doWork();  // atomic or nothing

❌ await insertTransaction(data);
❌ await insertLineItems(data);  // if this throws, transaction is already inserted
```

---

### RULE 5 — No User Input is Trusted in the Main Process
```javascript
✅ const amount = toKurus(data.amount);  // validated & converted
   if (!Number.isInteger(amount) || amount <= 0) throw new ValidationError(...)

❌ const amount = data.amount;  // taken as-is from renderer
```
The renderer is untrusted code. Users can open DevTools and modify anything. The main process validates everything it receives.

---

### RULE 6 — IPC Handlers Validate Session First, Always
```javascript
✅ ipcMain.handle('channel', async (event, { sessionToken, data }) => {
     const user = sessionStore.validate(sessionToken);  // throws if invalid
     // ... rest of handler
   });

❌ ipcMain.handle('channel', async (event, data) => {
     // no session check
   });
```

---

### RULE 7 — Never Compare Money with === or !==
```javascript
✅ Math.abs(amountA - amountB) < 1         // within 1 kuruş (0.01 TL)
✅ amountA === amountB                      // OK because both are integers
   // (Integer === Integer is always exact)

// REAL type money (forbidden by Rule 1, but if legacy exists):
❌ 25.50 === 25.50                           // might be false due to float
```
Since Rule 1 is followed, all money is integer, and `===` is always safe. Rule 7 exists as defense-in-depth for the case where someone violates Rule 1.

---

### RULE 8 — HTML Generated for PDF Must Escape All User Data
```javascript
const escapeHtml = (str) =>
  String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');

✅ `<td>${escapeHtml(item.item_name_snapshot)}</td>`
❌ `<td>${item.item_name_snapshot}</td>`
```
A customer named `<script>require('child_process').exec(...)</script>` would execute as a system command in an Electron BrowserWindow. This is not hypothetical — it was present in the previous system.

---

### RULE 9 — Backup Uses db.backup(), Not fs.copyFileSync()
```javascript
✅ await db.backup(backupPath);  // WAL-aware, atomic, crash-safe

❌ fs.copyFileSync(dbPath, backupPath);  // misses WAL file, not atomic
```

---

### RULE 10 — Opening Stock is a First-Class Operation
```javascript
✅ stockService.setOpeningStock(itemId, qty, costKurus, userId);
   // Creates a 'opening' stock movement
   // Blocked if an 'opening' movement already exists for this item

❌ db.prepare('INSERT INTO items ... stock_quantity=?').run(...);
   // No stock movement = reconciliation destroys the data
```
This was the single most destructive bug in the previous system. Every item's initial stock **must** appear in `stock_movements` as an `opening` record. It is the root of the entire movement chain.

---

## Final Architecture Summary

```
CORRECTNESS HIERARCHY:

  stock_movements.quantity_change  ←  This is truth for inventory
        ↓ SUM()
  v_stock.current_stock            ←  This is what you display

  transactions.amount_kurus        ←  This is truth for finance
        ↓ SUM() with signs
  v_entity_balances.balance_kurus  ←  This is what you display

  payment_allocations.amount_kurus ←  This is truth for per-invoice status
        ↓ SUM() vs transaction.amount_kurus
  v_open_invoices.remaining_kurus  ←  This is what you display

Nothing flows UP this chain. No stored field is ever the truth — 
only the immutable log records at the bottom are truth.
```

The system described in this document cannot have the class of bugs found in the previous version, because the architectural decisions that enabled those bugs no longer exist:

- There is no `entities.balance` column to drift.
- There is no `items.stock_quantity` column to be silently overwritten.
- There is no `UPDATE` path to financial records — only INSERT of new records.
- There are no floating-point money comparisons.
- There is no unescaped user data in HTML output.

Build in the order of the phases. Do not skip Phase 1 and Phase 2 even if the pressure is to "get to sales first." A wrong foundation is not fixable later without a full rewrite.
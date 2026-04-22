import Database from 'better-sqlite3';

export const createSchema = (db: Database.Database) => {
  const execSafe = (sql: string) => {
    try {
      db.exec(sql);
    } catch (e) {
      console.error("\n[DB ERROR] SQL FAILED:\n", sql);
      console.error(e);
      throw e;
    }
  };

  console.log("[DB] Schema creation started");

  execSafe(`
    BEGIN;

    CREATE TABLE IF NOT EXISTS users (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      username      TEXT    NOT NULL UNIQUE COLLATE NOCASE,
      password_hash TEXT    NOT NULL,
      role          TEXT    NOT NULL CHECK(role IN ('admin','staff')),
      is_active     INTEGER NOT NULL DEFAULT 1,
      created_at    TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      last_login_at TEXT
    );

    CREATE TABLE IF NOT EXISTS entities (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      title        TEXT    NOT NULL,
      entity_type  TEXT    NOT NULL CHECK(entity_type IN ('customer','supplier')),
      phone        TEXT,
      address      TEXT,
      city         TEXT,
      notes        TEXT,
      tax_number   TEXT,
      category     TEXT,
      is_active    INTEGER NOT NULL DEFAULT 1,
      created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by   INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS items (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      name                      TEXT    NOT NULL,
      sku                       TEXT    UNIQUE,
      unit                      TEXT    NOT NULL DEFAULT 'kg',
      category                  TEXT,
      low_stock_threshold       REAL    NOT NULL DEFAULT 5,
      default_sale_price_kurus  INTEGER NOT NULL DEFAULT 0,
      default_buy_price_kurus   INTEGER NOT NULL DEFAULT 0,
      tax_rate_bps              INTEGER NOT NULL DEFAULT 0,
      is_active                 INTEGER NOT NULL DEFAULT 1,
      created_at                TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by                INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS transactions (
      id                          INTEGER PRIMARY KEY AUTOINCREMENT,
      invoice_number              TEXT    UNIQUE,
      transaction_type            TEXT    NOT NULL CHECK(transaction_type IN (
                                    'sale','purchase',
                                    'payment_in','payment_out',
                                    'sale_return','purchase_return'
                                  )),
      entity_id                   INTEGER NOT NULL REFERENCES entities(id),
      amount_kurus                INTEGER NOT NULL CHECK(amount_kurus > 0),
      tax_amount_kurus            INTEGER NOT NULL DEFAULT 0,
      amount_excl_tax_kurus       INTEGER NOT NULL DEFAULT 0,
      transaction_date            TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      due_date                    TEXT,
      description                 TEXT,
      status                      TEXT    NOT NULL DEFAULT 'active' CHECK(status IN ('active','cancelled')),
      cancels_transaction_id      INTEGER REFERENCES transactions(id),
      cancelled_by_transaction_id INTEGER REFERENCES transactions(id),
      cancelled_at                TEXT,
      cancel_reason               TEXT,
      created_by                  INTEGER REFERENCES users(id),
      created_at                  TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS transaction_items (
      id                        INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id            INTEGER NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
      item_id                   INTEGER REFERENCES items(id),
      item_name_snapshot        TEXT    NOT NULL,
      unit_snapshot             TEXT    NOT NULL DEFAULT 'kg',
      quantity                  REAL    NOT NULL CHECK(quantity > 0),
      unit_price_kurus          INTEGER NOT NULL,
      tax_rate_bps              INTEGER NOT NULL DEFAULT 0,
      subtotal_kurus            INTEGER NOT NULL,
      cost_price_kurus_snapshot INTEGER
    );

    CREATE TABLE IF NOT EXISTS stock_movements (
      id              INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id  INTEGER REFERENCES transactions(id),
      item_id         INTEGER NOT NULL REFERENCES items(id),
      movement_type   TEXT    NOT NULL CHECK(movement_type IN (
                        'opening','purchase_in','sale_out','return_in','return_out',
                        'manual_increase','manual_decrease','cancellation'
                      )),
      quantity_change REAL    NOT NULL,
      balance_after   REAL    NOT NULL,
      unit_cost_kurus INTEGER,
      notes           TEXT,
      created_at      TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      created_by      INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS payment_allocations (
      id                      INTEGER PRIMARY KEY AUTOINCREMENT,
      payment_transaction_id  INTEGER NOT NULL REFERENCES transactions(id),
      invoice_transaction_id  INTEGER NOT NULL REFERENCES transactions(id),
      amount_kurus            INTEGER NOT NULL CHECK(amount_kurus > 0),
      created_at              TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(payment_transaction_id, invoice_transaction_id)
    );

    CREATE TABLE IF NOT EXISTS invoice_sequences (
      type        TEXT    PRIMARY KEY CHECK(type IN ('sale','purchase','payment_in','payment_out')),
      prefix      TEXT    NOT NULL,
      last_number INTEGER NOT NULL DEFAULT 0,
      year        INTEGER NOT NULL
    );

    CREATE TABLE IF NOT EXISTS settings (
      key        TEXT PRIMARY KEY,
      value      TEXT NOT NULL,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_by INTEGER REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS audit_log (
      id           INTEGER PRIMARY KEY AUTOINCREMENT,
      table_name   TEXT    NOT NULL,
      record_id    INTEGER,
      action       TEXT    NOT NULL CHECK(action IN ('INSERT','CANCEL','LOGIN','BACKUP','ADJUST')),
      summary      TEXT,
      payload_json TEXT,
      user_id      INTEGER REFERENCES users(id),
      created_at   TEXT    NOT NULL DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_transactions_entity_date 
      ON transactions(entity_id, transaction_date DESC);

    CREATE INDEX IF NOT EXISTS idx_stock_movements_item 
      ON stock_movements(item_id, created_at DESC);

    CREATE VIEW IF NOT EXISTS v_stock AS
    SELECT
      i.id AS item_id,
      i.name,
      i.unit,
      i.category,
      i.low_stock_threshold,
      i.is_active,
      COALESCE(SUM(sm.quantity_change), 0) AS current_stock
    FROM items i
    LEFT JOIN stock_movements sm ON sm.item_id = i.id
    GROUP BY 
      i.id, i.name, i.unit, i.category, i.low_stock_threshold, i.is_active;

    COMMIT;
  `);

  console.log("[DB] Schema created successfully");
};
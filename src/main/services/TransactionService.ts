/**
 * TransactionService — Satış, alış ve iptal işlemleri
 *
 * KRİTİK KURALLAR:
 * 1. Satış/alış kayıtları ASLA güncellenmez. Hata varsa iptal + yeni kayıt.
 * 2. Tüm multi-tablo işlemler TEK db.transaction() içinde gerçekleşir.
 * 3. entities.balance kolonu yoktur — bakiye view'dan hesaplanır.
 * 4. İptal: orijinali 'cancelled' yapar + ters yönde yeni kayıt açar.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';
import { applyBasisPoints } from '../utils/money';
import { StockService, InsufficientStockError } from './StockService';
import { InvoiceNumberService } from './InvoiceNumberService';

// ─── Input Types ──────────────────────────────────────────────────────────────

export interface LineItemInput {
  itemId: number;
  quantity: number;       // REAL (kg olabilir)
  unitPriceKurus: number; // INTEGER
  taxRateBps: number;     // 0 | 800 | 1000 | 2000
}

export interface CreateTransactionInput {
  entityId: number;
  lineItems: LineItemInput[];
  transactionDate?: string; // ISO 8601, default: şimdiki an
  dueDate?: string;         // Vadeli satış/alış için
  description?: string;
}

// ─── Output Types ─────────────────────────────────────────────────────────────

export interface TransactionResult {
  id: number;
  invoiceNumber: string;
}

export interface TransactionItemDetail {
  id: number;
  item_id: number | null;
  item_name_snapshot: string;
  unit_snapshot: string;
  quantity: number;
  unit_price_kurus: number;
  tax_rate_bps: number;
  subtotal_kurus: number;
  cost_price_kurus_snapshot: number | null;
}

export interface TransactionDetail {
  id: number;
  invoice_number: string | null;
  transaction_type: string;
  entity_id: number;
  entity_title: string;
  amount_kurus: number;
  tax_amount_kurus: number;
  amount_excl_tax_kurus: number;
  transaction_date: string;
  due_date: string | null;
  description: string | null;
  status: 'active' | 'cancelled';
  cancels_transaction_id: number | null;
  cancelled_by_transaction_id: number | null;
  cancelled_at: string | null;
  cancel_reason: string | null;
  created_by: number;
  created_at: string;
  items: TransactionItemDetail[];
}

export interface ListTransactionRow {
  id: number;
  invoice_number: string | null;
  transaction_type: string;
  entity_id: number;
  entity_title: string;
  amount_kurus: number;
  tax_amount_kurus: number;
  transaction_date: string;
  due_date: string | null;
  status: 'active' | 'cancelled';
  created_at: string;
}

export interface ListTransactionFilters {
  type?: string;
  entityId?: number;
  status?: 'active' | 'cancelled';
  fromDate?: string;
  toDate?: string;
  limit?: number;
  offset?: number;
}

// ─── Internal Helpers ─────────────────────────────────────────────────────────

interface EntityRow {
  id: number;
  entity_type: string;
  is_active: number;
}

interface ItemRow {
  id: number;
  name: string;
  unit: string;
}

interface LineCalculation {
  input: LineItemInput;
  item: ItemRow;
  subtotalKurus: number;    // quantity * unitPriceKurus (vergi hariç)
  taxKurus: number;         // applyBasisPoints(subtotalKurus, taxRateBps)
  totalKurus: number;       // subtotal + tax
  avgCostKurus: number;     // ortalama alış maliyeti (snapshot)
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class TransactionService {
  private readonly db: Database.Database;
  private readonly stockService: StockService;
  private readonly invoiceService: InvoiceNumberService;

  constructor(
    db: Database.Database,
    stockService: StockService,
    invoiceService: InvoiceNumberService,
  ) {
    this.db = db;
    this.stockService = stockService;
    this.invoiceService = invoiceService;
  }

  // ── createSale ──────────────────────────────────────────────────────────────

  /**
   * Satış işlemi oluşturur.
   * - Müşteri tipinde entity zorunlu
   * - Her kalem için stok yeterliliği kontrol edilir
   * - Tek transaction içinde: fatura → kalemler → stok hareketleri → audit
   */
  createSale(data: CreateTransactionInput, userId: number): TransactionResult {
    this._validateInput(data, 'customer');

    const execute = this.db.transaction((): TransactionResult => {
      const now = data.transactionDate ?? new Date().toISOString();
      const lines = this._calculateLines(data.lineItems);

      // Stok yeterliliğini ÖNCEDEN kontrol et (tüm kalemleri dolaş)
      for (const line of lines) {
        const available = this.stockService.getCurrentStock(line.input.itemId);
        if (available < line.input.quantity) {
          throw new InsufficientStockError(
            line.input.itemId,
            line.input.quantity,
            available,
          );
        }
      }

      const { totalAmount, totalTax, totalExclTax } = this._sumLines(lines);

      // 1. Fatura numarası
      const invoiceNumber = this.invoiceService.next('sale');

      // 2. transactions INSERT
      const txResult = this.db
        .prepare(`
          INSERT INTO transactions (
            invoice_number, transaction_type, entity_id,
            amount_kurus, tax_amount_kurus, amount_excl_tax_kurus,
            transaction_date, due_date, description,
            status, created_by
          ) VALUES (?, 'sale', ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `)
        .run(
          invoiceNumber,
          data.entityId,
          totalAmount,
          totalTax,
          totalExclTax,
          now,
          data.dueDate ?? null,
          data.description?.trim() ?? null,
          userId,
        );

      const txId = txResult.lastInsertRowid as number;

      // 3. transaction_items + stok hareketleri
      for (const line of lines) {
        this._insertLineItem(txId, line);

        this.stockService.recordMovement({
          itemId:        line.input.itemId,
          type:          'sale_out',
          quantityChange: -line.input.quantity,
          transactionId: txId,
          unitCostKurus: line.avgCostKurus,
          userId,
        });
      }

      // 4. audit_log
      this._insertAuditLog('transactions', txId, 'INSERT', userId, {
        invoiceNumber,
        entityId: data.entityId,
        totalAmount,
        lineCount: lines.length,
      });

      logger.info('Satış oluşturuldu', { txId, invoiceNumber, userId, totalAmount });

      return { id: txId, invoiceNumber };
    });

    return execute();
  }

  // ── createPurchase ──────────────────────────────────────────────────────────

  /**
   * Alış işlemi oluşturur.
   * - Tedarikçi tipinde entity zorunlu
   * - Stok kontrolü yok (alışta stok girer)
   * - Tek transaction içinde: fatura → kalemler → stok hareketleri → audit
   */
  createPurchase(data: CreateTransactionInput, userId: number): TransactionResult {
    this._validateInput(data, 'supplier');

    const execute = this.db.transaction((): TransactionResult => {
      const now = data.transactionDate ?? new Date().toISOString();
      const lines = this._calculateLines(data.lineItems);
      const { totalAmount, totalTax, totalExclTax } = this._sumLines(lines);

      // 1. Fatura numarası
      const invoiceNumber = this.invoiceService.next('purchase');

      // 2. transactions INSERT
      const txResult = this.db
        .prepare(`
          INSERT INTO transactions (
            invoice_number, transaction_type, entity_id,
            amount_kurus, tax_amount_kurus, amount_excl_tax_kurus,
            transaction_date, due_date, description,
            status, created_by
          ) VALUES (?, 'purchase', ?, ?, ?, ?, ?, ?, ?, 'active', ?)
        `)
        .run(
          invoiceNumber,
          data.entityId,
          totalAmount,
          totalTax,
          totalExclTax,
          now,
          data.dueDate ?? null,
          data.description?.trim() ?? null,
          userId,
        );

      const txId = txResult.lastInsertRowid as number;

      // 3. transaction_items + stok hareketleri
      for (const line of lines) {
        this._insertLineItem(txId, line);

        this.stockService.recordMovement({
          itemId:         line.input.itemId,
          type:           'purchase_in',
          quantityChange: line.input.quantity,
          transactionId:  txId,
          unitCostKurus:  line.input.unitPriceKurus,
          userId,
        });
      }

      // 4. audit_log
      this._insertAuditLog('transactions', txId, 'INSERT', userId, {
        invoiceNumber,
        entityId: data.entityId,
        totalAmount,
        lineCount: lines.length,
      });

      logger.info('Alış oluşturuldu', { txId, invoiceNumber, userId, totalAmount });

      return { id: txId, invoiceNumber };
    });

    return execute();
  }

  // ── cancelTransaction ───────────────────────────────────────────────────────

  /**
   * İşlem iptali.
   * - Orijinal işlemi 'cancelled' yapar
   * - Ters yönde 'sale_return' veya 'purchase_return' kaydı açar
   * - Stok hareketlerini 'cancellation' tipiyle tersine döndürür
   */
  cancelTransaction(txId: number, reason: string, userId: number): TransactionResult {
    if (!reason || reason.trim().length < 3) {
      throw new Error('İptal nedeni en az 3 karakter olmalı');
    }

    const execute = this.db.transaction((): TransactionResult => {
      // Orijinal işlemi oku
      const original = this.db
        .prepare<[number]>(`
          SELECT id, invoice_number, transaction_type, entity_id,
                 amount_kurus, tax_amount_kurus, amount_excl_tax_kurus,
                 transaction_date, status
          FROM transactions WHERE id = ?
        `)
        .get(txId) as (TransactionDetail & { status: string }) | undefined;

      if (!original) {
        throw new Error(`İşlem bulunamadı: #${txId}`);
      }

      if (original.status === 'cancelled') {
        throw new Error(`İşlem zaten iptal edilmiş: #${txId}`);
      }

      if (!['sale', 'purchase'].includes(original.transaction_type)) {
        throw new Error(
          `Sadece satış ve alış işlemleri iptal edilebilir. Tip: ${original.transaction_type}`
        );
      }

      // Ödeme kaydı varsa iptal engelle
      const hasPayment = this.db
        .prepare<[number]>(
          'SELECT id FROM payment_allocations WHERE invoice_transaction_id = ? LIMIT 1'
        )
        .get(txId);

      if (hasPayment) {
        throw new Error('Bu faturaya ait ödeme kaydı var. Önce ödemeleri iptal edin.');
      }

      // Orijinal kalemleri oku
      const originalItems = this.db
        .prepare<[number]>(`
          SELECT item_id, item_name_snapshot, unit_snapshot,
                 quantity, unit_price_kurus, tax_rate_bps,
                 subtotal_kurus, cost_price_kurus_snapshot
          FROM transaction_items WHERE transaction_id = ?
        `)
        .all(txId) as Array<{
          item_id: number | null;
          item_name_snapshot: string;
          unit_snapshot: string;
          quantity: number;
          unit_price_kurus: number;
          tax_rate_bps: number;
          subtotal_kurus: number;
          cost_price_kurus_snapshot: number | null;
        }>;

      // Ters kayıt tipi
      const reversalType =
        original.transaction_type === 'sale' ? 'sale_return' : 'purchase_return';

      const now = new Date().toISOString();

      // 1. Reversal transaction INSERT
      const reversalResult = this.db
        .prepare(`
          INSERT INTO transactions (
            invoice_number, transaction_type, entity_id,
            amount_kurus, tax_amount_kurus, amount_excl_tax_kurus,
            transaction_date, description, status,
            cancels_transaction_id, created_by
          ) VALUES (NULL, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)
        `)
        .run(
          reversalType,
          original.entity_id,
          original.amount_kurus,
          original.tax_amount_kurus,
          original.amount_excl_tax_kurus,
          now,
          `İptal: ${reason.trim()}`,
          txId,
          userId,
        );

      const reversalId = reversalResult.lastInsertRowid as number;

      // 2. Reversal kalemleri kopyala
      const insertItem = this.db.prepare(`
        INSERT INTO transaction_items (
          transaction_id, item_id, item_name_snapshot, unit_snapshot,
          quantity, unit_price_kurus, tax_rate_bps,
          subtotal_kurus, cost_price_kurus_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      for (const item of originalItems) {
        insertItem.run(
          reversalId,
          item.item_id,
          item.item_name_snapshot,
          item.unit_snapshot,
          item.quantity,
          item.unit_price_kurus,
          item.tax_rate_bps,
          item.subtotal_kurus,
          item.cost_price_kurus_snapshot,
        );

        // 3. Stok hareketini tersine döndür
        if (item.item_id !== null) {
          const stockChange =
            original.transaction_type === 'sale'
              ? item.quantity   // satış iptali → stok geri gelir
              : -item.quantity; // alış iptali → stok çıkar

          this.stockService.recordMovement({
            itemId:         item.item_id,
            type:           'cancellation',
            quantityChange: stockChange,
            transactionId:  reversalId,
            userId,
            notes:          `${txId} nolu işlem iptali`,
          });
        }
      }

      // 4. Orijinal işlemi 'cancelled' yap
      this.db
        .prepare(`
          UPDATE transactions
          SET status = 'cancelled',
              cancelled_by_transaction_id = ?,
              cancelled_at = ?,
              cancel_reason = ?
          WHERE id = ?
        `)
        .run(reversalId, now, reason.trim(), txId);

      // 5. audit_log
      this._insertAuditLog('transactions', txId, 'CANCEL', userId, {
        reversalId,
        reason: reason.trim(),
      });

      logger.info('İşlem iptal edildi', { txId, reversalId, reason, userId });

      return { id: reversalId, invoiceNumber: '' };
    });

    return execute();
  }

  // ── getTransaction ──────────────────────────────────────────────────────────

  /**
   * İşlem detayını kalemleriyle birlikte döner.
   */
  getTransaction(txId: number): TransactionDetail | null {
    const tx = this.db
      .prepare<[number]>(`
        SELECT
          t.id, t.invoice_number, t.transaction_type,
          t.entity_id, e.title AS entity_title,
          t.amount_kurus, t.tax_amount_kurus, t.amount_excl_tax_kurus,
          t.transaction_date, t.due_date, t.description,
          t.status, t.cancels_transaction_id,
          t.cancelled_by_transaction_id, t.cancelled_at, t.cancel_reason,
          t.created_by, t.created_at
        FROM transactions t
        JOIN entities e ON e.id = t.entity_id
        WHERE t.id = ?
      `)
      .get(txId) as Omit<TransactionDetail, 'items'> | undefined;

    if (!tx) return null;

    const items = this.db
      .prepare<[number]>(`
        SELECT id, item_id, item_name_snapshot, unit_snapshot,
               quantity, unit_price_kurus, tax_rate_bps,
               subtotal_kurus, cost_price_kurus_snapshot
        FROM transaction_items
        WHERE transaction_id = ?
        ORDER BY id ASC
      `)
      .all(txId) as TransactionItemDetail[];

    return { ...tx, items };
  }

  // ── listTransactions ────────────────────────────────────────────────────────

  /**
   * Filtrelenmiş işlem listesi (sayfalı).
   * Default: sadece 'active', limit=50
   */
  listTransactions(filters: ListTransactionFilters = {}): ListTransactionRow[] {
    const {
      type,
      entityId,
      status = 'active',
      fromDate,
      toDate,
      limit = 50,
      offset = 0,
    } = filters;

    const clauses: string[] = ['t.status = ?'];
    const params: unknown[] = [status];

    if (type) {
      clauses.push('t.transaction_type = ?');
      params.push(type);
    }
    if (entityId !== undefined) {
      clauses.push('t.entity_id = ?');
      params.push(entityId);
    }
    if (fromDate) {
      clauses.push('t.transaction_date >= ?');
      params.push(fromDate);
    }
    if (toDate) {
      clauses.push('t.transaction_date <= ?');
      params.push(toDate);
    }

    params.push(limit, offset);

    const rows = this.db
      .prepare(`
        SELECT
          t.id, t.invoice_number, t.transaction_type,
          t.entity_id, e.title AS entity_title,
          t.amount_kurus, t.tax_amount_kurus,
          t.transaction_date, t.due_date,
          t.status, t.created_at
        FROM transactions t
        JOIN entities e ON e.id = t.entity_id
        WHERE ${clauses.join(' AND ')}
        ORDER BY t.transaction_date DESC, t.id DESC
        LIMIT ? OFFSET ?
      `)
      .all(...params) as ListTransactionRow[];

    return rows;
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * Ortalama alış birim maliyetini hesaplar.
   * Stok tutarlılığı için satış snapshot'ına yazılır.
   */
  private _getAverageCost(itemId: number): number {
    const row = this.db
      .prepare<[number], { avg_cost: number | null }>(`
        SELECT
          CAST(
            SUM(ti.subtotal_kurus) * 1.0 / NULLIF(SUM(ti.quantity), 0)
            AS INTEGER
          ) AS avg_cost
        FROM transaction_items ti
        JOIN transactions t ON t.id = ti.transaction_id
        WHERE ti.item_id = ?
          AND t.transaction_type = 'purchase'
          AND t.status = 'active'
      `)
      .get(itemId);

    return row?.avg_cost ?? 0;
  }

  /** Girdi validasyonu: entity varlığı + tipi + line items */
  private _validateInput(
    data: CreateTransactionInput,
    requiredType: 'customer' | 'supplier',
  ): void {
    if (!data.lineItems || data.lineItems.length === 0) {
      throw new Error('En az bir kalem girilmeli');
    }

    const entity = this.db
      .prepare<[number]>('SELECT id, entity_type, is_active FROM entities WHERE id = ?')
      .get(data.entityId) as EntityRow | undefined;

    if (!entity) {
      throw new Error(`Cari bulunamadı: #${data.entityId}`);
    }

    if (!entity.is_active) {
      throw new Error(`Pasif cari ile işlem yapılamaz: #${data.entityId}`);
    }

    if (entity.entity_type !== requiredType) {
      const label = requiredType === 'customer' ? 'müşteri' : 'tedarikçi';
      throw new Error(
        `Bu işlem için ${label} tipinde cari gerekli. Seçilen: ${entity.entity_type}`
      );
    }

    for (const line of data.lineItems) {
      if (line.quantity <= 0) {
        throw new Error(`Miktar sıfırdan büyük olmalı (item #${line.itemId})`);
      }
      if (!Number.isInteger(line.unitPriceKurus) || line.unitPriceKurus <= 0) {
        throw new Error(`Birim fiyat pozitif tam sayı olmalı (item #${line.itemId})`);
      }
      if (![0, 800, 1000, 2000].includes(line.taxRateBps)) {
        throw new Error(
          `Geçersiz KDV oranı: ${line.taxRateBps}. Kabul edilenler: 0, 800, 1000, 2000`
        );
      }
    }
  }

  /** Her kalem için tutarları ve item bilgilerini hesaplar */
  private _calculateLines(lineItems: LineItemInput[]): LineCalculation[] {
    return lineItems.map(input => {
      const item = this.db
        .prepare<[number]>('SELECT id, name, unit FROM items WHERE id = ? AND is_active = 1')
        .get(input.itemId) as ItemRow | undefined;

      if (!item) {
        throw new Error(`Ürün bulunamadı veya pasif: #${input.itemId}`);
      }

      // Vergi hariç subtotal (kuruş, tam sayıya yuvarla)
      const subtotalKurus = Math.round(input.quantity * input.unitPriceKurus);
      const taxKurus      = applyBasisPoints(subtotalKurus, input.taxRateBps);
      const totalKurus    = subtotalKurus + taxKurus;
      const avgCostKurus  = this._getAverageCost(input.itemId);

      return { input, item, subtotalKurus, taxKurus, totalKurus, avgCostKurus };
    });
  }

  /** Tüm kalemlerin toplamlarını hesaplar */
  private _sumLines(lines: LineCalculation[]): {
    totalAmount: number;
    totalTax: number;
    totalExclTax: number;
  } {
    let totalExclTax = 0;
    let totalTax     = 0;

    for (const line of lines) {
      totalExclTax += line.subtotalKurus;
      totalTax     += line.taxKurus;
    }

    return {
      totalAmount:  totalExclTax + totalTax,
      totalTax,
      totalExclTax,
    };
  }

  /** transaction_items'a tek kalem INSERT */
  private _insertLineItem(txId: number, line: LineCalculation): void {
    this.db
      .prepare(`
        INSERT INTO transaction_items (
          transaction_id, item_id, item_name_snapshot, unit_snapshot,
          quantity, unit_price_kurus, tax_rate_bps,
          subtotal_kurus, cost_price_kurus_snapshot
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .run(
        txId,
        line.item.id,
        line.item.name,
        line.item.unit,
        line.input.quantity,
        line.input.unitPriceKurus,
        line.input.taxRateBps,
        line.totalKurus,       // KDV dahil subtotal kaydedilir
        line.avgCostKurus || null,
      );
  }

  /** audit_log'a tek satır INSERT */
  private _insertAuditLog(
    tableName: string,
    recordId: number,
    action: 'INSERT' | 'CANCEL',
    userId: number,
    payload: Record<string, unknown>,
  ): void {
    this.db
      .prepare(`
        INSERT INTO audit_log (table_name, record_id, action, summary, payload_json, user_id)
        VALUES (?, ?, ?, ?, ?, ?)
      `)
      .run(
        tableName,
        recordId,
        action,
        `${action} — ${tableName} #${recordId}`,
        JSON.stringify(payload),
        userId,
      );
  }
}

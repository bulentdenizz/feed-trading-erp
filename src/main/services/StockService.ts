/**
 * StockService — Projedeki TEK stok yazma noktası
 *
 * Kural: items tablosuna asla doğrudan yazma yapma.
 * Stok her zaman SUM(stock_movements.quantity_change) ile hesaplanır.
 *
 * Tüm çok-adımlı işlemler db.transaction() içinde gerçekleşir.
 */

import Database from 'better-sqlite3';
import { logger } from '../utils/logger';

// ─── Custom Error ────────────────────────────────────────────────────────────

export class InsufficientStockError extends Error {
  readonly itemId: number;
  readonly requested: number;
  readonly available: number;

  constructor(itemId: number, requested: number, available: number) {
    super(
      `Yetersiz stok — item #${itemId}: ` +
      `talep=${requested}, mevcut=${available}`
    );
    this.name = 'InsufficientStockError';
    this.itemId = itemId;
    this.requested = requested;
    this.available = available;
  }
}

// ─── Types ───────────────────────────────────────────────────────────────────

export type MovementType =
  | 'opening'
  | 'purchase_in'
  | 'sale_out'
  | 'return_in'
  | 'return_out'
  | 'manual_increase'
  | 'manual_decrease'
  | 'cancellation';

export interface RecordMovementParams {
  itemId: number;
  type: MovementType;
  /** Pozitif = artış, negatif = azalış. Sıfır olamaz. */
  quantityChange: number;
  transactionId?: number;
  unitCostKurus?: number;
  notes?: string;
  userId: number;
}

export interface StockMovementRow {
  id: number;
  transaction_id: number | null;
  item_id: number;
  movement_type: MovementType;
  quantity_change: number;
  balance_after: number;
  unit_cost_kurus: number | null;
  notes: string | null;
  created_at: string;
  created_by: number;
}

export interface StockHistoryRow extends StockMovementRow {
  invoice_number: string | null;
  transaction_type: string | null;
}

// ─── Service ─────────────────────────────────────────────────────────────────

export class StockService {
  private readonly db: Database.Database;

  constructor(db: Database.Database) {
    this.db = db;
  }

  // ── Public API ──────────────────────────────────────────────────────────────

  /**
   * Projedeki TEK stok yazma noktası.
   *
   * - quantityChange sıfır olamaz.
   * - balance_after < 0 ise InsufficientStockError fırlatılır.
   * - Tüm işlem tek bir SQLite transaction içinde gerçekleşir.
   *
   * @returns Eklenen stock_movements kaydının id'si
   */
  recordMovement(params: RecordMovementParams): number {
    const {
      itemId,
      type,
      quantityChange,
      transactionId,
      unitCostKurus,
      notes,
      userId,
    } = params;

    if (quantityChange === 0) {
      throw new Error('[StockService] quantityChange sıfır olamaz');
    }

    const execute = this.db.transaction((): number => {
      // Mevcut stoku transaction içinde oku (serializable isolation)
      const current = this._getCurrentStock(itemId);
      const balanceAfter = current + quantityChange;

      if (balanceAfter < 0) {
        throw new InsufficientStockError(itemId, Math.abs(quantityChange), current);
      }

      const result = this.db
        .prepare<[number, number | null, MovementType, number, number, number | null, string | null, number]>(`
          INSERT INTO stock_movements
            (item_id, transaction_id, movement_type, quantity_change,
             balance_after, unit_cost_kurus, notes, created_by)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        `)
        .run(
          itemId,
          transactionId ?? null,
          type,
          quantityChange,
          balanceAfter,
          unitCostKurus ?? null,
          notes ?? null,
          userId,
        );

      const insertedId = result.lastInsertRowid as number;

      logger.info('Stok hareketi kaydedildi', {
        movementId: insertedId,
        itemId,
        type,
        quantityChange,
        balanceAfter,
        transactionId,
        userId,
      });

      return insertedId;
    });

    return execute();
  }

  /**
   * Bir ürünün anlık stok miktarını döner.
   * Kayıt yoksa 0 döner.
   */
  getCurrentStock(itemId: number): number {
    return this._getCurrentStock(itemId);
  }

  /**
   * Bir ürünün stok geçmişini sayfalı olarak döner.
   * Sıra: en yeni önce (created_at DESC)
   */
  getStockHistory(
    itemId: number,
    limit = 50,
    offset = 0,
  ): StockHistoryRow[] {
    const rows = this.db
      .prepare<[number, number, number]>(`
        SELECT
          sm.id,
          sm.transaction_id,
          sm.item_id,
          sm.movement_type,
          sm.quantity_change,
          sm.balance_after,
          sm.unit_cost_kurus,
          sm.notes,
          sm.created_at,
          sm.created_by,
          t.invoice_number,
          t.transaction_type
        FROM stock_movements sm
        LEFT JOIN transactions t ON t.id = sm.transaction_id
        WHERE sm.item_id = ?
        ORDER BY sm.created_at DESC
        LIMIT ? OFFSET ?
      `)
      .all(itemId, limit, offset) as StockHistoryRow[];

    return rows;
  }

  /**
   * Bir ürün için açılış stoku tanımlar.
   *
   * - Daha önce 'opening' hareketi varsa hata fırlatır.
   * - quantity <= 0 ise hiçbir şey yapmaz (null döner).
   *
   * @returns Eklenen hareketin id'si veya null
   */
  setOpeningStock(
    itemId: number,
    quantity: number,
    costKurus: number,
    userId: number,
  ): number | null {
    if (quantity <= 0) {
      logger.debug('setOpeningStock: quantity <= 0, işlem yapılmadı', { itemId, quantity });
      return null;
    }

    const execute = this.db.transaction((): number => {
      const existing = this.db
        .prepare<[number]>(
          "SELECT id FROM stock_movements WHERE item_id = ? AND movement_type = 'opening' LIMIT 1"
        )
        .get(itemId);

      if (existing) {
        throw new Error(
          `[StockService] item #${itemId} için açılış stoku zaten tanımlı`
        );
      }

      return this.recordMovement({
        itemId,
        type: 'opening',
        quantityChange: quantity,
        unitCostKurus: costKurus,
        notes: 'Açılış stoku',
        userId,
      });
    });

    const id = execute();

    logger.info('Açılış stoku tanımlandı', { itemId, quantity, costKurus, userId });

    return id;
  }

  /**
   * Manuel stok düzeltmesi yapar.
   *
   * - newQuantity ile mevcut stok arasındaki farka göre
   *   'manual_increase' veya 'manual_decrease' hareketi oluşturur.
   * - Fark = 0 ise işlem yapılmaz (null döner).
   * - reason boş olamaz.
   *
   * @returns Eklenen hareketin id'si veya null
   */
  performManualAdjustment(
    itemId: number,
    newQuantity: number,
    reason: string,
    userId: number,
  ): number | null {
    if (!reason || reason.trim() === '') {
      throw new Error('[StockService] Manuel düzeltme için reason zorunludur');
    }

    const execute = this.db.transaction((): number | null => {
      const current = this._getCurrentStock(itemId);
      const diff = newQuantity - current;

      if (diff === 0) {
        logger.debug('performManualAdjustment: fark 0, işlem yapılmadı', { itemId, newQuantity });
        return null;
      }

      const type: MovementType = diff > 0 ? 'manual_increase' : 'manual_decrease';

      const id = this.recordMovement({
        itemId,
        type,
        quantityChange: diff,        // diff negatifse azalış, pozitifse artış
        notes: reason.trim(),
        userId,
      });

      logger.info('Manuel stok düzeltmesi yapıldı', {
        itemId,
        previousStock: current,
        newQuantity,
        diff,
        type,
        reason,
        userId,
      });

      return id;
    });

    return execute();
  }

  // ── Private Helpers ─────────────────────────────────────────────────────────

  /**
   * SUM(quantity_change) ile anlık stoku hesaplar.
   * Transaction içinden çağrılmaya uygundur (private, transaction wrap yok).
   */
  private _getCurrentStock(itemId: number): number {
    const row = this.db
      .prepare<[number], { total: number | null }>(
        'SELECT SUM(quantity_change) AS total FROM stock_movements WHERE item_id = ?'
      )
      .get(itemId);

    return row?.total ?? 0;
  }
}

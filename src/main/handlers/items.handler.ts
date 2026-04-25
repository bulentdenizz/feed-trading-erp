/**
 * Item IPC Handlers — Ürün (yem) yönetimi
 *
 * items:create'de açılış stoku varsa StockService.setOpeningStock()
 * MUTLAKA db.transaction() içinde çağrılır.
 */

import { ipcMain } from 'electron';
import Database from 'better-sqlite3';
import { getDb } from '../db/index';
import { StockService } from '../services/StockService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

// ─── Yardımcı Item tipleri (ayrı ItemService yoksa inline DB işlemleri) ──────

interface ItemRow {
  id: number;
  name: string;
  sku: string | null;
  unit: string;
  category: string | null;
  low_stock_threshold: number;
  default_sale_price_kurus: number;
  default_buy_price_kurus: number;
  tax_rate_bps: number;
  is_active: number;
  created_at: string;
  created_by: number | null;
}

interface ItemWithStock extends ItemRow {
  current_stock: number;
}

interface CreateItemData {
  name: string;
  unit?: string;
  sku?: string;
  category?: string;
  low_stock_threshold?: number;
  default_sale_price_kurus?: number;
  default_buy_price_kurus?: number;
  tax_rate_bps?: number;
  openingStock?: number;
  openingCostKurus?: number;
}

interface UpdateItemData {
  name?: string;
  unit?: string;
  sku?: string;
  category?: string;
  low_stock_threshold?: number;
  default_sale_price_kurus?: number;
  default_buy_price_kurus?: number;
  tax_rate_bps?: number;
  // openingStock vb. stok alanları burada YOKTUR — kasıtlı
}

function getItemWithStock(db: Database.Database, id: number): ItemWithStock | null {
  return db.prepare<[number]>(`
    SELECT
      i.id, i.name, i.sku, i.unit, i.category,
      i.low_stock_threshold, i.default_sale_price_kurus,
      i.default_buy_price_kurus, i.tax_rate_bps,
      i.is_active, i.created_at, i.created_by,
      COALESCE(vs.current_stock, 0) AS current_stock
    FROM items i
    LEFT JOIN v_stock vs ON vs.item_id = i.id
    WHERE i.id = ?
  `).get(id) as ItemWithStock | null;
}

// ─── Handler ─────────────────────────────────────────────────────────────────

export function registerItemHandlers(): void {
  const db = getDb();
  const stockService = new StockService(db);

  // ── items:list ─────────────────────────────────────────────────────────────
  ipcMain.handle('items:list', async (_event, { token, includeInactive }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = db.prepare(`
        SELECT
          i.id, i.name, i.sku, i.unit, i.category,
          i.low_stock_threshold, i.default_sale_price_kurus,
          i.default_buy_price_kurus, i.tax_rate_bps,
          i.is_active, i.created_at, i.created_by,
          COALESCE(vs.current_stock, 0) AS current_stock
        FROM items i
        LEFT JOIN v_stock vs ON vs.item_id = i.id
        ${includeInactive ? '' : 'WHERE i.is_active = 1'}
        ORDER BY i.name COLLATE NOCASE ASC
      `).all() as ItemWithStock[];

      return { ok: true, data };
    } catch (err: any) {
      logger.warn('items:list başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── items:get ──────────────────────────────────────────────────────────────
  ipcMain.handle('items:get', async (_event, { token, id }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = getItemWithStock(db, Number(id));
      if (!data) return { ok: false, code: 'NOT_FOUND', message: `Ürün bulunamadı: #${id}` };
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('items:get başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── items:create ───────────────────────────────────────────────────────────
  // openingStock > 0 ise StockService.setOpeningStock() AYNI transaction içinde
  ipcMain.handle('items:create', async (_event, { token, data }: { token: string; data: CreateItemData }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const name = data.name?.trim();
      if (!name) return { ok: false, code: 'VALIDATION', message: 'Ürün adı boş olamaz' };

      const createWithStock = db.transaction((): number => {
        // 1. items INSERT
        const result = db.prepare(`
          INSERT INTO items (
            name, sku, unit, category,
            low_stock_threshold, default_sale_price_kurus,
            default_buy_price_kurus, tax_rate_bps,
            is_active, created_by
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 1, ?)
        `).run(
          name,
          data.sku?.trim() ?? null,
          data.unit?.trim() ?? 'kg',
          data.category?.trim() ?? null,
          data.low_stock_threshold ?? 5,
          data.default_sale_price_kurus ?? 0,
          data.default_buy_price_kurus ?? 0,
          data.tax_rate_bps ?? 0,
          session.userId,
        );

        const itemId = result.lastInsertRowid as number;

        // 2. Açılış stoku — transaction içinde, aynı atomik blok
        if (data.openingStock && data.openingStock > 0) {
          stockService.setOpeningStock(
            itemId,
            data.openingStock,
            data.openingCostKurus ?? 0,
            session.userId,
          );
        }

        return itemId;
      });

      const itemId = createWithStock();
      const created = getItemWithStock(db, itemId);

      logger.info('Ürün oluşturuldu', { itemId, name, userId: session.userId });
      return { ok: true, data: created };
    } catch (err: any) {
      logger.warn('items:create başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── items:update ───────────────────────────────────────────────────────────
  // Stok alanları (openingStock vb.) kasıtlı olarak yoksayılır
  ipcMain.handle('items:update', async (_event, { token, id, data }: { token: string; id: number; data: UpdateItemData }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const fields: string[] = [];
      const values: unknown[] = [];

      if (data.name !== undefined) {
        const name = data.name.trim();
        if (!name) return { ok: false, code: 'VALIDATION', message: 'Ürün adı boş olamaz' };
        fields.push('name = ?'); values.push(name);
      }
      if (data.sku              !== undefined) { fields.push('sku = ?');                       values.push(data.sku?.trim() || null); }
      if (data.unit             !== undefined) { fields.push('unit = ?');                      values.push(data.unit.trim() || 'kg'); }
      if (data.category         !== undefined) { fields.push('category = ?');                  values.push(data.category?.trim() || null); }
      if (data.low_stock_threshold      !== undefined) { fields.push('low_stock_threshold = ?');       values.push(data.low_stock_threshold); }
      if (data.default_sale_price_kurus !== undefined) { fields.push('default_sale_price_kurus = ?');  values.push(data.default_sale_price_kurus); }
      if (data.default_buy_price_kurus  !== undefined) { fields.push('default_buy_price_kurus = ?');   values.push(data.default_buy_price_kurus); }
      if (data.tax_rate_bps     !== undefined) { fields.push('tax_rate_bps = ?');              values.push(data.tax_rate_bps); }

      if (fields.length === 0) return { ok: false, code: 'VALIDATION', message: 'Güncellenecek alan belirtilmedi' };

      values.push(Number(id));
      db.prepare(`UPDATE items SET ${fields.join(', ')} WHERE id = ?`).run(...values);

      const updated = getItemWithStock(db, Number(id));
      logger.info('Ürün güncellendi', { id, userId: session.userId });
      return { ok: true, data: updated };
    } catch (err: any) {
      logger.warn('items:update başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── items:deactivate ───────────────────────────────────────────────────────
  ipcMain.handle('items:deactivate', async (_event, { token, id }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      db.prepare('UPDATE items SET is_active = 0 WHERE id = ?').run(Number(id));

      logger.info('Ürün pasif yapıldı', { id, userId: session.userId });
      return { ok: true };
    } catch (err: any) {
      logger.warn('items:deactivate başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Item handler\'ları kaydedildi');
}

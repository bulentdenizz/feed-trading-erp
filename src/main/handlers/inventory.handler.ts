/**
 * Inventory IPC Handlers — Stok sorgulama ve düzeltme
 *
 * StockService projedeki TEK stok yazma noktasıdır.
 * Bu handler sadece okuma ve manuel düzeltme kanallarını sunar.
 */

import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { StockService } from '../services/StockService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

export function registerInventoryHandlers(): void {
  const db = getDb();
  const stockService = new StockService(db);

  // ── inventory:getStock ─────────────────────────────────────────────────────
  ipcMain.handle('inventory:getStock', async (_event, { token, itemId }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const currentStock = stockService.getCurrentStock(Number(itemId));
      return { ok: true, data: { itemId: Number(itemId), currentStock } };
    } catch (err: any) {
      logger.warn('inventory:getStock başarısız', { itemId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── inventory:getHistory ───────────────────────────────────────────────────
  ipcMain.handle('inventory:getHistory', async (_event, { token, itemId, limit, offset }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = stockService.getStockHistory(
        Number(itemId),
        limit  !== undefined ? Number(limit)  : 50,
        offset !== undefined ? Number(offset) : 0,
      );

      return { ok: true, data };
    } catch (err: any) {
      logger.warn('inventory:getHistory başarısız', { itemId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── inventory:adjust ──────────────────────────────────────────────────────
  ipcMain.handle('inventory:adjust', async (_event, { token, itemId, newQuantity, reason }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      // reason frontend'den boş gelebilir — her zaman server tarafında da kontrol et
      if (!reason || String(reason).trim().length === 0) {
        return { ok: false, code: 'VALIDATION', message: 'Düzeltme nedeni boş olamaz' };
      }

      if (newQuantity === undefined || newQuantity === null || Number(newQuantity) < 0) {
        return { ok: false, code: 'VALIDATION', message: 'Yeni miktar negatif olamaz' };
      }

      const movementId = stockService.performManualAdjustment(
        Number(itemId),
        Number(newQuantity),
        String(reason).trim(),
        session.userId,
      );

      const currentStock = stockService.getCurrentStock(Number(itemId));

      logger.info('Manuel stok düzeltmesi yapıldı', {
        itemId,
        newQuantity,
        movementId,
        userId: session.userId,
      });

      return {
        ok: true,
        data: {
          movementId,           // null ise fark 0'dı — işlem yapılmadı
          currentStock,
        },
      };
    } catch (err: any) {
      logger.warn('inventory:adjust başarısız', { itemId, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Inventory handler\'ları kaydedildi');
}

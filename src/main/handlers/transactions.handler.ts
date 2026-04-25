/**
 * Transaction IPC Handlers — Satış, alış ve iptal
 */

import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { TransactionService } from '../services/TransactionService';
import { StockService, InsufficientStockError } from '../services/StockService';
import { InvoiceNumberService } from '../services/InvoiceNumberService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

export function registerTransactionHandlers(): void {
  const db = getDb();
  const stockService    = new StockService(db);
  const invoiceService  = new InvoiceNumberService(db);
  const txService       = new TransactionService(db, stockService, invoiceService);

  // ── transactions:list ──────────────────────────────────────────────────────
  ipcMain.handle('transactions:list', async (_event, { token, filters }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = txService.listTransactions(filters ?? {});
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('transactions:list başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── transactions:get ───────────────────────────────────────────────────────
  ipcMain.handle('transactions:get', async (_event, { token, id }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = txService.getTransaction(Number(id));
      if (!data) return { ok: false, code: 'NOT_FOUND', message: `İşlem bulunamadı: #${id}` };
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('transactions:get başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── transactions:createSale ────────────────────────────────────────────────
  ipcMain.handle('transactions:createSale', async (_event, { token, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const result = txService.createSale(data, session.userId);
      return { ok: true, data: result };
    } catch (err: any) {
      if (err instanceof InsufficientStockError) {
        logger.warn('transactions:createSale — yetersiz stok', {
          itemId:    err.itemId,
          requested: err.requested,
          available: err.available,
        });
        return {
          ok:      false,
          code:    'INSUFFICIENT_STOCK',
          message: err.message,
          detail:  { itemId: err.itemId, requested: err.requested, available: err.available },
        };
      }
      logger.warn('transactions:createSale başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── transactions:createPurchase ────────────────────────────────────────────
  ipcMain.handle('transactions:createPurchase', async (_event, { token, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const result = txService.createPurchase(data, session.userId);
      return { ok: true, data: result };
    } catch (err: any) {
      logger.warn('transactions:createPurchase başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── transactions:cancel ────────────────────────────────────────────────────
  ipcMain.handle('transactions:cancel', async (_event, { token, id, reason }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      if (!reason || String(reason).trim().length < 3) {
        return { ok: false, code: 'VALIDATION', message: 'İptal nedeni en az 3 karakter olmalı' };
      }

      const result = txService.cancelTransaction(Number(id), String(reason).trim(), session.userId);
      return { ok: true, data: result };
    } catch (err: any) {
      logger.warn('transactions:cancel başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Transaction handler\'ları kaydedildi');
}

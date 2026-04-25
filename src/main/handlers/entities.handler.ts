/**
 * Entity IPC Handlers — Cari (müşteri/tedarikçi) yönetimi
 *
 * Her handler:
 *   1. sessionStore.validate(token) — yetkisiz isteği reddeder
 *   2. EntityService çağrısı
 *   3. { ok: true, data } veya { ok: false, code, message }
 */

import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { EntityService, EntityType } from '../services/EntityService';
import { sessionStore } from '../utils/sessionStore';
import { logger } from '../utils/logger';

export function registerEntityHandlers(): void {
  const db = getDb();
  const entityService = new EntityService(db);

  // ── entities:list ──────────────────────────────────────────────────────────
  ipcMain.handle('entities:list', async (_event, { token, type, includeInactive }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = entityService.listEntities(type as EntityType, includeInactive ?? false);
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('entities:list başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── entities:get ───────────────────────────────────────────────────────────
  ipcMain.handle('entities:get', async (_event, { token, id }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = entityService.getEntity(Number(id));
      if (!data) return { ok: false, code: 'NOT_FOUND', message: `Cari bulunamadı: #${id}` };
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('entities:get başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── entities:create ────────────────────────────────────────────────────────
  ipcMain.handle('entities:create', async (_event, { token, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const id = entityService.createEntity(data, session.userId);
      const created = entityService.getEntity(id);
      return { ok: true, data: created };
    } catch (err: any) {
      logger.warn('entities:create başarısız', { error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── entities:update ────────────────────────────────────────────────────────
  ipcMain.handle('entities:update', async (_event, { token, id, data }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      entityService.updateEntity(Number(id), data, session.userId);
      const updated = entityService.getEntity(Number(id));
      return { ok: true, data: updated };
    } catch (err: any) {
      logger.warn('entities:update başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── entities:deactivate ────────────────────────────────────────────────────
  ipcMain.handle('entities:deactivate', async (_event, { token, id }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      entityService.deactivateEntity(Number(id), session.userId);
      return { ok: true };
    } catch (err: any) {
      logger.warn('entities:deactivate başarısız', { id, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  // ── entities:search ────────────────────────────────────────────────────────
  ipcMain.handle('entities:search', async (_event, { token, query, type }) => {
    try {
      const session = sessionStore.validate(token);
      if (!session) return { ok: false, code: 'UNAUTHORIZED', message: 'Oturum geçersiz veya süresi dolmuş' };

      const data = entityService.searchEntities(query, type as EntityType | undefined);
      return { ok: true, data };
    } catch (err: any) {
      logger.warn('entities:search başarısız', { query, error: err?.message });
      return { ok: false, code: 'ERROR', message: err?.message ?? 'Bir hata oluştu' };
    }
  });

  logger.info('Entity handler\'ları kaydedildi');
}

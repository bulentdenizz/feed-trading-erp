import { ipcMain } from 'electron';
import { getDb } from '../db/index';
import { AuthService } from '../services/AuthService';
import { logger } from '../utils/logger';

export function registerAuthHandlers() {
  const db = getDb();
  const authService = new AuthService(db);

  ipcMain.handle('auth:login', async (_event, { username, password }) => {
    try {
      const resp = await authService.authenticate({ username, password });
      return { ok: true, data: resp };
    } catch (err: any) {
      logger.warn('auth:login failed', { username, error: err?.message ?? err });
      return { ok: false, message: err?.message ?? 'Authentication failed' };
    }
  });

  ipcMain.handle('auth:logout', async (_event, { token }) => {
    try {
      authService.logout(token);
      return { ok: true };
    } catch (err: any) {
      logger.error('auth:logout failed', err);
      return { ok: false, message: err?.message ?? 'Logout failed' };
    }
  });

  ipcMain.handle('auth:validate', async (_event, { token }) => {
    try {
      const session = authService.validateSession(token);
      return { ok: true, data: session };
    } catch (err: any) {
      return { ok: false, message: err?.message ?? 'Invalid or expired session' };
    }
  });
}

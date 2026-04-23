/**
 * Session Store — In-memory token management
 * Tokens stored in main process memory (secure, not exposed to renderer)
 */

import { randomBytes } from 'crypto';
import { logger } from './logger';

export interface SessionData {
  userId: number;
  username: string;
  role: 'admin' | 'staff';
  expiresAt: number;
}

export class SessionStore {
  private sessions: Map<string, SessionData> = new Map();
  private readonly TOKEN_LENGTH = 32; // bytes
  private readonly TOKEN_LIFETIME = 24 * 60 * 60 * 1000; // 24 hours in ms
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    // Clean up expired sessions every hour
    this.cleanupInterval = setInterval(() => {
      this.cleanupExpiredSessions();
    }, 60 * 60 * 1000);
  }

  /**
   * Generate a new session token
   * @param userId - User ID
   * @param username - Username
   * @param role - User role
   * @returns Session token (hex string)
   */
  generateToken(userId: number, username: string, role: 'admin' | 'staff'): string {
    const token = randomBytes(this.TOKEN_LENGTH).toString('hex');

    const sessionData: SessionData = {
      userId,
      username,
      role,
      expiresAt: Date.now() + this.TOKEN_LIFETIME,
    };

    this.sessions.set(token, sessionData);

    logger.info('Session created', {
      userId,
      username,
      expiresAt: new Date(sessionData.expiresAt).toISOString(),
    });

    return token;
  }

  /**
   * Validate a session token
   * @param token - Session token to validate
   * @returns Session data if valid, null if invalid or expired
   */
  validate(token: string | undefined): SessionData | null {
    if (!token || typeof token !== 'string') {
      return null;
    }

    const session = this.sessions.get(token);

    if (!session) {
      return null;
    }

    // Check expiration
    if (Date.now() > session.expiresAt) {
      this.sessions.delete(token);
      logger.warn('Session expired', { userId: session.userId });
      return null;
    }

    // Extend session by 1 hour on each use (sliding window)
    session.expiresAt = Date.now() + this.TOKEN_LIFETIME;

    return session;
  }

  /**
   * Revoke a session token
   * @param token - Token to revoke
   */
  revoke(token: string): void {
    const session = this.sessions.get(token);

    if (session) {
      this.sessions.delete(token);
      logger.info('Session revoked', { userId: session.userId });
    }
  }

  /**
   * Get all active sessions (admin only)
   * @returns Array of session data (without tokens)
   */
  getAllSessions(): Array<SessionData & { tokenCount?: number }> {
    const now = Date.now();
    const activeSessions: Array<SessionData & { tokenCount?: number }> = [];

    this.sessions.forEach((session) => {
      if (session.expiresAt > now) {
        activeSessions.push(session);
      }
    });

    return activeSessions;
  }

  /**
   * Revoke all sessions for a specific user (on password change, etc.)
   * @param userId - User ID
   */
  revokeUserSessions(userId: number): number {
    let count = 0;

    this.sessions.forEach((session, token) => {
      if (session.userId === userId) {
        this.sessions.delete(token);
        count++;
      }
    });

    if (count > 0) {
      logger.info('User sessions revoked', { userId, count });
    }

    return count;
  }

  /**
   * Clean up expired sessions
   */
  private cleanupExpiredSessions(): void {
    const now = Date.now();
    let count = 0;

    this.sessions.forEach((session, token) => {
      if (session.expiresAt <= now) {
        this.sessions.delete(token);
        count++;
      }
    });

    if (count > 0) {
      logger.debug('Expired sessions cleaned up', { count });
    }
  }

  /**
   * Destroy session store and cleanup interval
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
      this.cleanupInterval = null;
    }

    this.sessions.clear();
    logger.info('Session store destroyed');
  }

  /**
   * Get active session count (for monitoring)
   */
  getActiveCount(): number {
    const now = Date.now();
    let count = 0;

    this.sessions.forEach((session) => {
      if (session.expiresAt > now) {
        count++;
      }
    });

    return count;
  }
}

// Singleton instance
export const sessionStore = new SessionStore();

// Cleanup on process exit
process.on('exit', () => {
  sessionStore.destroy();
});

/**
 * Authentication Service — Parola hash & doğrulama
 * bcrypt kullanarak güvenli parola işleme
 */

import bcrypt from 'bcrypt';
import Database from 'better-sqlite3';
import { sessionStore, SessionData } from '../utils/sessionStore';
import { logger } from '../utils/logger';
import { validatePassword, validateUsername } from '../utils/validation';

export interface AuthRequest {
  username: string;
  password: string;
}

export interface AuthResponse {
  userId: number;
  username: string;
  role: 'admin' | 'staff';
  token: string;
}

export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'staff';
  is_active: number;
  created_at: string;
  last_login_at: string | null;
}

export class AuthService {
  private db: Database.Database;
  private readonly SALT_ROUNDS = 10;

  constructor(db: Database.Database) {
    this.db = db;
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Hashed password (salted)
   */
  async hashPassword(password: string): Promise<string> {
    try {
      // Validate password strength first
      const validationError = validatePassword(password);
      if (validationError) {
        throw new Error(validationError);
      }

      const hash = await bcrypt.hash(password, this.SALT_ROUNDS);
      return hash;
    } catch (err) {
      logger.error('Password hashing failed', err);
      throw err;
    }
  }

  /**
   * Verify password against hash
   * @param password - Plain text password to verify
   * @param hash - Stored password hash
   * @returns true if password matches, false otherwise
   */
  async verifyPassword(password: string, hash: string): Promise<boolean> {
    try {
      const match = await bcrypt.compare(password, hash);
      return match;
    } catch (err) {
      logger.error('Password verification failed', err);
      return false;
    }
  }

  /**
   * Authenticate user and create session
   * @param request - { username, password }
   * @returns Auth response with token
   */
  async authenticate(request: AuthRequest): Promise<AuthResponse> {
    try {
      const { username, password } = request;

      // Validate inputs
      const usernameError = validateUsername(username);
      if (usernameError) {
        throw new Error(usernameError);
      }

      if (!password) {
        throw new Error('Password is required');
      }

      // Find user
      const query = this.db.prepare(
        'SELECT * FROM users WHERE username = ? AND is_active = 1'
      );
      const user = query.get(username) as User | undefined;

      if (!user) {
        logger.warn('Login attempt with non-existent user', { username });
        throw new Error('Invalid username or password');
      }

      // Verify password
      const passwordMatch = await this.verifyPassword(password, user.password_hash);

      if (!passwordMatch) {
        logger.warn('Login attempt with wrong password', { username });
        throw new Error('Invalid username or password');
      }

      // Update last login
      const now = new Date().toISOString();
      this.db.prepare('UPDATE users SET last_login_at = ? WHERE id = ?').run(now, user.id);

      // Create session
      const token = sessionStore.generateToken(user.id, user.username, user.role);

      logger.info('User authenticated', { userId: user.id, username: user.username });

      return {
        userId: user.id,
        username: user.username,
        role: user.role,
        token,
      };
    } catch (err) {
      logger.error('Authentication failed', err);
      throw err;
    }
  }

  /**
   * Validate session token (called before API operations)
   * @param token - Session token
   * @returns Session data if valid
   */
  validateSession(token: string): SessionData {
    const session = sessionStore.validate(token);

    if (!session) {
      throw new Error('Invalid or expired session token');
    }

    return session;
  }

  /**
   * Logout user (revoke session)
   * @param token - Session token to revoke
   */
  logout(token: string): void {
    sessionStore.revoke(token);
    logger.info('User logged out');
  }

  /**
   * Create new user (admin only)
   * @param username - New username
   * @param password - Initial password
   * @param role - User role
   * @param createdByUserId - Admin user ID
   * @returns New user ID
   */
  async createUser(
    username: string,
    password: string,
    role: 'admin' | 'staff',
    createdByUserId: number
  ): Promise<number> {
    try {
      // Validate inputs
      const usernameError = validateUsername(username);
      if (usernameError) {
        throw new Error(usernameError);
      }

      const passwordError = validatePassword(password);
      if (passwordError) {
        throw new Error(passwordError);
      }

      if (role !== 'admin' && role !== 'staff') {
        throw new Error('Invalid role');
      }

      // Check username doesn't exist
      const existing = this.db
        .prepare('SELECT id FROM users WHERE username = ?')
        .get(username);

      if (existing) {
        throw new Error('Username already exists');
      }

      // Hash password
      const passwordHash = await this.hashPassword(password);

      // Insert user
      const result = this.db.prepare(
        `INSERT INTO users (username, password_hash, role, created_by, created_at)
         VALUES (?, ?, ?, ?, ?)`,
      ).run(username, passwordHash, role, createdByUserId, new Date().toISOString());

      const userId = result.lastInsertRowid as number;

      logger.info('User created', { userId, username, role, createdBy: createdByUserId });

      return userId;
    } catch (err) {
      logger.error('User creation failed', err);
      throw err;
    }
  }

  /**
   * Change user password
   * @param userId - User ID
   * @param currentPassword - Current password (for verification)
   * @param newPassword - New password
   */
  async changePassword(userId: number, currentPassword: string, newPassword: string): Promise<void> {
    try {
      // Get user
      const user = this.db
        .prepare('SELECT * FROM users WHERE id = ?')
        .get(userId) as User | undefined;

      if (!user) {
        throw new Error('User not found');
      }

      // Verify current password
      const currentMatch = await this.verifyPassword(currentPassword, user.password_hash);
      if (!currentMatch) {
        throw new Error('Current password is incorrect');
      }

      // Validate new password
      const passwordError = validatePassword(newPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Hash new password
      const newHash = await this.hashPassword(newPassword);

      // Update password and revoke all sessions
      this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(newHash, userId);

      // Revoke all sessions for this user (force re-login)
      sessionStore.revokeUserSessions(userId);

      logger.info('Password changed', { userId });
    } catch (err) {
      logger.error('Password change failed', err);
      throw err;
    }
  }

  /**
   * Reset user password (admin only, sets temporary password)
   * @param userId - User ID to reset
   * @param temporaryPassword - Temporary password
   * @param adminId - Admin user ID performing reset
   */
  async resetPassword(userId: number, temporaryPassword: string, adminId: number): Promise<void> {
    try {
      // Validate temporary password
      const passwordError = validatePassword(temporaryPassword);
      if (passwordError) {
        throw new Error(passwordError);
      }

      // Hash temporary password
      const hash = await this.hashPassword(temporaryPassword);

      // Update password
      this.db.prepare('UPDATE users SET password_hash = ? WHERE id = ?').run(hash, userId);

      // Revoke all sessions for this user
      sessionStore.revokeUserSessions(userId);

      logger.info('Password reset', { userId, adminId });
    } catch (err) {
      logger.error('Password reset failed', err);
      throw err;
    }
  }

  /**
   * Get user by ID
   * @param userId - User ID
   * @returns User data (without password hash)
   */
  getUser(userId: number): Omit<User, 'password_hash'> | null {
    const user = this.db.prepare('SELECT * FROM users WHERE id = ?').get(userId) as User | undefined;

    if (!user) {
      return null;
    }

    const { password_hash, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }

  /**
   * List all users (admin only)
   * @returns Array of users (without passwords)
   */
  listUsers(): Array<Omit<User, 'password_hash'>> {
    const users = this.db
      .prepare('SELECT * FROM users ORDER BY created_at DESC')
      .all() as User[];

    return users.map(({ password_hash, ...user }) => user);
  }

  /**
   * Deactivate user (soft delete)
   * @param userId - User ID
   * @param adminId - Admin user ID
   */
  deactivateUser(userId: number, adminId: number): void {
    try {
      this.db.prepare('UPDATE users SET is_active = 0 WHERE id = ?').run(userId);

      // Revoke all sessions for this user
      sessionStore.revokeUserSessions(userId);

      logger.info('User deactivated', { userId, adminId });
    } catch (err) {
      logger.error('User deactivation failed', err);
      throw err;
    }
  }
}

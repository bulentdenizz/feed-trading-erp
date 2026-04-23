/**
 * Logger utility — JSON structured logging to userData/app.log
 */

import { app } from 'electron';
import path from 'path';
import fs from 'fs';

interface LogEntry {
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  data?: unknown;
  stack?: string;
}

class Logger {
  private logPath: string;
  private stream: fs.WriteStream | null = null;

  constructor() {
    this.logPath = path.join(app.getPath('userData'), 'app.log');
    this.ensureLogFile();
  }

  private ensureLogFile() {
    try {
      const dir = path.dirname(this.logPath);

      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Rotate log if it's larger than 10MB
      if (fs.existsSync(this.logPath)) {
        const stat = fs.statSync(this.logPath);

        if (stat.size > 10 * 1024 * 1024) {
          // 10MB
          const backupPath = `${this.logPath}.${Date.now()}.bak`;
          fs.renameSync(this.logPath, backupPath);
        }
      }

      this.stream = fs.createWriteStream(this.logPath, { flags: 'a' });
    } catch (err) {
      console.error('[Logger] Failed to initialize log file:', err);
    }
  }

  private formatEntry(entry: LogEntry): string {
    return JSON.stringify(entry);
  }

  private writeEntry(entry: LogEntry) {
    try {
      if (!this.stream) {
        this.ensureLogFile();
      }

      const formatted = this.formatEntry(entry);
      this.stream?.write(formatted + '\n');

      // Also log to console
      const level = entry.level.toUpperCase();
      const msg = entry.data
        ? `${entry.message} ${JSON.stringify(entry.data)}`
        : entry.message;

      if (entry.level === 'error') {
        console.error(`[${level}]`, msg, entry.stack);
      } else if (entry.level === 'warn') {
        console.warn(`[${level}]`, msg);
      } else if (entry.level === 'debug') {
        console.debug(`[${level}]`, msg);
      } else {
        console.log(`[${level}]`, msg);
      }
    } catch (err) {
      console.error('[Logger] Write failed:', err);
    }
  }

  info(message: string, data?: unknown) {
    this.writeEntry({
      timestamp: new Date().toISOString(),
      level: 'info',
      message,
      data,
    });
  }

  warn(message: string, data?: unknown) {
    this.writeEntry({
      timestamp: new Date().toISOString(),
      level: 'warn',
      message,
      data,
    });
  }

  error(message: string, error?: unknown) {
    let stack: string | undefined;

    if (error instanceof Error) {
      stack = error.stack;
    }

    this.writeEntry({
      timestamp: new Date().toISOString(),
      level: 'error',
      message,
      data: error,
      stack,
    });
  }

  debug(message: string, data?: unknown) {
    if (process.env.DEBUG) {
      this.writeEntry({
        timestamp: new Date().toISOString(),
        level: 'debug',
        message,
        data,
      });
    }
  }

  close() {
    if (this.stream) {
      this.stream.end();
      this.stream = null;
    }
  }
}

// Singleton instance
export const logger = new Logger();

// Graceful cleanup on app quit
if (typeof app !== 'undefined') {
  app.on('before-quit', () => {
    logger.close();
  });
}

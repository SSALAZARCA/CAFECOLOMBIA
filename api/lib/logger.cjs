/**
 * Módulo de Logging Robusto para CAFECOLOMBIAAPP
 * Proporciona diferentes niveles de logging y formato estructurado
 */

const fs = require('fs');
const path = require('path');

// Niveles de log
const LOG_LEVELS = {
  ERROR: 0,
  WARN: 1,
  INFO: 2,
  DEBUG: 3
};

// Colores para consola
const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
  GRAY: '\x1b[90m'
};

class Logger {
  constructor(options = {}) {
    this.level = options.level || process.env.LOG_LEVEL || 'INFO';
    this.levelValue = LOG_LEVELS[this.level.toUpperCase()] || LOG_LEVELS.INFO;
    this.enableConsole = options.console !== false;
    this.enableFile = options.file !== false;
    this.logDir = options.logDir || path.join(__dirname, '../logs');
    this.maxFileSize = options.maxFileSize || 10 * 1024 * 1024; // 10MB
    this.maxFiles = options.maxFiles || 5;
    
    // Crear directorio de logs si no existe
    if (this.enableFile && !fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
  }

  formatTimestamp() {
    return new Date().toISOString();
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = this.formatTimestamp();
    const logEntry = {
      timestamp,
      level: level.toUpperCase(),
      message,
      ...meta,
      pid: process.pid,
      hostname: require('os').hostname()
    };
    
    return JSON.stringify(logEntry);
  }

  writeToFile(level, message, meta = {}) {
    if (!this.enableFile) return;

    const logFile = path.join(this.logDir, `${level.toLowerCase()}.log`);
    const formattedMessage = this.formatMessage(level, message, meta) + '\n';

    try {
      if (fs.existsSync(logFile)) {
        const stats = fs.statSync(logFile);
        if (stats.size > this.maxFileSize) {
          this.rotateFile(logFile);
        }
      }

      fs.appendFileSync(logFile, formattedMessage);
    } catch (error) {
      console.error('Error escribiendo log:', error.message);
    }
  }

  rotateFile(logFile) {
    try {
      const basename = path.basename(logFile, '.log');
      const dirname = path.dirname(logFile);
      
      for (let i = this.maxFiles - 1; i > 0; i--) {
        const oldFile = path.join(dirname, `${basename}.${i}.log`);
        const newFile = path.join(dirname, `${basename}.${i + 1}.log`);
        
        if (fs.existsSync(oldFile)) {
          if (i === this.maxFiles - 1) {
            fs.unlinkSync(oldFile);
          } else {
            fs.renameSync(oldFile, newFile);
          }
        }
      }
      
      const firstRotated = path.join(dirname, `${basename}.1.log`);
      if (fs.existsSync(logFile)) {
        fs.renameSync(logFile, firstRotated);
      }
    } catch (error) {
      console.error('Error rotando archivo de log:', error.message);
    }
  }

  getColorForLevel(level) {
    switch (level.toUpperCase()) {
      case 'ERROR': return COLORS.RED;
      case 'WARN': return COLORS.YELLOW;
      case 'INFO': return COLORS.GREEN;
      case 'DEBUG': return COLORS.CYAN;
      default: return COLORS.GRAY;
    }
  }

  writeToConsole(level, message, meta = {}) {
    if (!this.enableConsole) return;

    const timestamp = this.formatTimestamp();
    const levelStr = level.toUpperCase().padEnd(5);
    const color = this.getColorForLevel(level);
    
    const consoleMessage = `${COLORS.GRAY}${timestamp}${COLORS.RESET} ${color}${levelStr}${COLORS.RESET} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      console.log(consoleMessage, meta);
    } else {
      console.log(consoleMessage);
    }
  }

  log(level, message, meta = {}) {
    const levelValue = LOG_LEVELS[level.toUpperCase()];
    if (levelValue === undefined || levelValue > this.levelValue) return;

    this.writeToConsole(level, message, meta);
    this.writeToFile(level, message, meta);
  }

  error(message, error = null, meta = {}) {
    const errorMeta = { ...meta };
    
    if (error) {
      errorMeta.error = {
        message: error.message,
        stack: error.stack,
        code: error.code,
        errno: error.errno,
        sql: error.sql,
        sqlState: error.sqlState,
        sqlMessage: error.sqlMessage
      };
    }

    this.log('ERROR', message, errorMeta);
  }

  warn(message, meta = {}) {
    this.log('WARN', message, meta);
  }

  info(message, meta = {}) {
    this.log('INFO', message, meta);
  }

  debug(message, meta = {}) {
    this.log('DEBUG', message, meta);
  }

  logRequest(req, res, responseTime = null) {
    const meta = {
      method: req.method,
      url: req.originalUrl || req.url,
      ip: req.ip || req.connection?.remoteAddress,
      userAgent: req.get('User-Agent'),
      statusCode: res.statusCode,
      contentLength: res.get('content-length'),
      responseTime
    };

    const level = res.statusCode >= 400 ? 'WARN' : 'INFO';
    this.log(level, `HTTP ${req.method} ${req.originalUrl || req.url}`, meta);
  }

  logDatabaseError(operation, error, query = null, params = null) {
    const meta = {
      operation,
      query,
      params: params ? JSON.stringify(params) : null,
      database: process.env.DB_NAME,
      host: process.env.DB_HOST
    };

    this.error('Database Error', error, meta);
  }

  logAuthError(operation, error, email = null, ip = null) {
    const meta = {
      operation,
      email,
      ip,
      userAgent: require('express')?.request?.get('User-Agent')
    };

    this.error('Authentication Error', error, meta);
  }
}

// Crear instancia global del logger
const logger = new Logger({
  level: process.env.LOG_LEVEL || 'INFO',
  console: process.env.NODE_ENV !== 'test',
  file: process.env.NODE_ENV === 'production'
});

module.exports = logger;
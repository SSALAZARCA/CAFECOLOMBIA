/**
 * Módulo de manejo de errores global para Cafe Colombia App
 * Proporciona manejo centralizado y consistente de errores
 */

const logger = require('./logger');

/**
 * Clase personalizada para errores de la aplicación
 */
class AppError extends Error {
  constructor(message, statusCode, errorCode, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.errorCode = errorCode;
    this.details = details;
    this.isOperational = true;
    
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Códigos de error estándar de la aplicación
 */
const ErrorCodes = {
  // Errores de autenticación
  AUTH_INVALID_CREDENTIALS: 'AUTH_INVALID_CREDENTIALS',
  AUTH_TOKEN_INVALID: 'AUTH_TOKEN_INVALID',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_ACCOUNT_LOCKED: 'AUTH_ACCOUNT_LOCKED',
  AUTH_ACCOUNT_INACTIVE: 'AUTH_ACCOUNT_INACTIVE',
  
  // Errores de validación
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  MISSING_REQUIRED_FIELDS: 'MISSING_REQUIRED_FIELDS',
  
  // Errores de base de datos
  DB_CONNECTION_ERROR: 'DB_CONNECTION_ERROR',
  DB_QUERY_ERROR: 'DB_QUERY_ERROR',
  DB_CONSTRAINT_ERROR: 'DB_CONSTRAINT_ERROR',
  DB_RECORD_NOT_FOUND: 'DB_RECORD_NOT_FOUND',
  DB_DUPLICATE_ENTRY: 'DB_DUPLICATE_ENTRY',
  
  // Errores de negocio
  BUSINESS_RULE_VIOLATION: 'BUSINESS_RULE_VIOLATION',
  INSUFFICIENT_STOCK: 'INSUFFICIENT_STOCK',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  
  // Errores del servidor
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  
  // Errores de configuración
  CONFIG_ERROR: 'CONFIG_ERROR',
  MISSING_ENV_VAR: 'MISSING_ENV_VAR'
};

/**
 * Mapeo de códigos MySQL a códigos de error de la aplicación
 */
const MySQLErrorMap = {
  'ER_DUP_ENTRY': ErrorCodes.DB_DUPLICATE_ENTRY,
  'ER_NO_REFERENCED_ROW': ErrorCodes.DB_CONSTRAINT_ERROR,
  'ER_ROW_IS_REFERENCED': ErrorCodes.DB_CONSTRAINT_ERROR,
  'ER_NO_SUCH_TABLE': ErrorCodes.DB_QUERY_ERROR,
  'ER_BAD_FIELD_ERROR': ErrorCodes.DB_QUERY_ERROR,
  'ER_PARSE_ERROR': ErrorCodes.DB_QUERY_ERROR,
  'ER_ACCESS_DENIED_ERROR': ErrorCodes.DB_CONNECTION_ERROR,
  'ER_DBACCESS_DENIED_ERROR': ErrorCodes.DB_CONNECTION_ERROR,
  'ER_CON_COUNT_ERROR': ErrorCodes.DB_CONNECTION_ERROR,
  'ER_OUT_OF_RESOURCES': ErrorCodes.DB_CONNECTION_ERROR,
  'ER_LOCK_WAIT_TIMEOUT': ErrorCodes.DB_QUERY_ERROR,
  'ER_LOCK_DEADLOCK': ErrorCodes.DB_QUERY_ERROR
};

/**
 * Función para crear errores de validación
 */
function createValidationError(message, details = null) {
  return new AppError(message, 400, ErrorCodes.VALIDATION_ERROR, details);
}

/**
 * Función para crear errores de autenticación
 */
function createAuthError(message, errorCode, details = null) {
  const statusCode = errorCode === ErrorCodes.AUTH_ACCOUNT_LOCKED ? 423 : 401;
  return new AppError(message, statusCode, errorCode, details);
}

/**
 * Función para crear errores de base de datos
 */
function createDatabaseError(error, operation = null, details = null) {
  let errorCode = ErrorCodes.DB_QUERY_ERROR;
  let message = 'Error en la base de datos';
  let statusCode = 500;
  
  // Mapear errores de MySQL
  if (error.code && MySQLErrorMap[error.code]) {
    errorCode = MySQLErrorMap[error.code];
    
    switch (errorCode) {
      case ErrorCodes.DB_DUPLICATE_ENTRY:
        message = 'El registro ya existe';
        statusCode = 409;
        break;
      case ErrorCodes.DB_CONSTRAINT_ERROR:
        message = 'Error de restricción en la base de datos';
        statusCode = 400;
        break;
      case ErrorCodes.DB_RECORD_NOT_FOUND:
        message = 'Registro no encontrado';
        statusCode = 404;
        break;
      case ErrorCodes.DB_CONNECTION_ERROR:
        message = 'Error de conexión a la base de datos';
        statusCode = 503;
        break;
    }
  }
  
  const dbError = new AppError(message, statusCode, errorCode, {
    originalError: error.message,
    sqlState: error.sqlState,
    errno: error.errno,
    operation,
    ...details
  });
  
  // Loggear el error completo para debugging
  logger.error('Database error', error, {
    errorCode,
    operation,
    sqlState: error.sqlState,
    errno: error.errno
  });
  
  return dbError;
}

/**
 * Middleware de manejo de errores global
 */
function errorHandler(err, req, res, next) {
  let error = err;
  
  // Si no es un AppError, convertirlo
  if (!(error instanceof AppError)) {
    if (error.code && MySQLErrorMap[error.code]) {
      error = createDatabaseError(error);
    } else if (error.name === 'ValidationError') {
      error = createValidationError('Error de validación', error.errors);
    } else if (error.name === 'JsonWebTokenError') {
      error = createAuthError('Token inválido', ErrorCodes.AUTH_TOKEN_INVALID);
    } else if (error.name === 'TokenExpiredError') {
      error = createAuthError('Token expirado', ErrorCodes.AUTH_TOKEN_EXPIRED);
    } else {
      // Error genérico del servidor
      error = new AppError(
        'Error interno del servidor',
        500,
        ErrorCodes.INTERNAL_ERROR,
        { originalError: error.message }
      );
    }
  }
  
  // Loggear el error
  logger.error('Error handled by global error handler', error, {
    requestId: req.requestId,
    method: req.method,
    url: req.url,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    userId: req.user?.id,
    userType: req.user?.role
  });
  
  // Preparar respuesta de error
  const errorResponse = {
    success: false,
    message: error.message,
    errorCode: error.errorCode,
    requestId: req.requestId,
    timestamp: new Date().toISOString()
  };
  
  // Incluir detalles solo en desarrollo o para errores de validación
  if (process.env.NODE_ENV === 'development' || error.statusCode === 400) {
    errorResponse.details = error.details;
    errorResponse.stack = error.stack;
  }
  
  res.status(error.statusCode).json(errorResponse);
}

/**
 * Middleware para capturar errores asíncronos
 */
function asyncErrorHandler(fn) {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

/**
 * Middleware de validación de errores
 */
function validateRequest(validationRules) {
  return (req, res, next) => {
    const errors = {};
    
    // Validar campos requeridos
    if (validationRules.required) {
      validationRules.required.forEach(field => {
        if (!req.body[field] && !req.query[field] && !req.params[field]) {
          errors[field] = 'Campo requerido';
        }
      });
    }
    
    // Validar formato de email
    if (validationRules.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      validationRules.email.forEach(field => {
        const value = req.body[field] || req.query[field];
        if (value && !emailRegex.test(value)) {
          errors[field] = 'Formato de email inválido';
        }
      });
    }
    
    // Validar longitud mínima
    if (validationRules.minLength) {
      Object.entries(validationRules.minLength).forEach(([field, min]) => {
        const value = req.body[field] || req.query[field];
        if (value && value.length < min) {
          errors[field] = `Mínimo ${min} caracteres requeridos`;
        }
      });
    }
    
    // Validar longitud máxima
    if (validationRules.maxLength) {
      Object.entries(validationRules.maxLength).forEach(([field, max]) => {
        const value = req.body[field] || req.query[field];
        if (value && value.length > max) {
          errors[field] = `Máximo ${max} caracteres permitidos`;
        }
      });
    }
    
    if (Object.keys(errors).length > 0) {
      return next(createValidationError('Error de validación', errors));
    }
    
    next();
  };
}

/**
 * Función para sanitizar errores de salida
 */
function sanitizeError(error) {
  if (process.env.NODE_ENV === 'production') {
    return {
      message: error.message,
      errorCode: error.errorCode
    };
  }
  return error;
}

module.exports = {
  AppError,
  ErrorCodes,
  errorHandler,
  asyncErrorHandler,
  validateRequest,
  createValidationError,
  createAuthError,
  createDatabaseError,
  sanitizeError
};
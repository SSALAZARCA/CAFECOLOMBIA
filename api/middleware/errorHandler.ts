import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  isOperational?: boolean;
}

export const errorHandler = (
  error: AppError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = error.statusCode || 500;
  let message = error.message || 'Error interno del servidor';

  // Log del error
  console.error('Error:', {
    message: error.message,
    stack: error.stack,
    url: req.url,
    method: req.method,
    ip: req.ip,
    userAgent: req.get('User-Agent'),
    timestamp: new Date().toISOString()
  });

  // Errores específicos de MySQL
  if (error.message.includes('ER_DUP_ENTRY')) {
    statusCode = 409;
    message = 'Ya existe un registro con estos datos';
  } else if (error.message.includes('ER_NO_REFERENCED_ROW')) {
    statusCode = 400;
    message = 'Referencia inválida a otro registro';
  } else if (error.message.includes('ER_ACCESS_DENIED_ERROR')) {
    statusCode = 500;
    message = 'Error de configuración de base de datos';
  }

  // Errores de validación
  if (error.name === 'ValidationError') {
    statusCode = 400;
    message = 'Datos de entrada inválidos';
  }

  // Errores de JWT
  if (error.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Token inválido';
  } else if (error.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expirado';
  }

  // En producción, no mostrar detalles del error
  const isDevelopment = process.env.NODE_ENV === 'development';

  const errorResponse: any = {
    error: message,
    status: statusCode,
    timestamp: new Date().toISOString(),
    path: req.url,
    method: req.method
  };

  if (isDevelopment) {
    errorResponse.stack = error.stack;
    errorResponse.details = error;
  }

  res.status(statusCode).json(errorResponse);
};

export const createError = (message: string, statusCode: number = 500): AppError => {
  const error: AppError = new Error(message);
  error.statusCode = statusCode;
  error.isOperational = true;
  return error;
};

export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
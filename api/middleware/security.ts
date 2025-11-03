import { Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import cors from 'cors';

// CORS Configuration
export const corsHandler = cors({
  origin: process.env.CORS_ORIGIN ? 
    process.env.CORS_ORIGIN.split(',').map(origin => origin.trim()) : 
    ['http://localhost:5173', 'http://localhost:5174'],
  credentials: process.env.CORS_CREDENTIALS === 'true' || true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  exposedHeaders: ['X-Total-Count', 'X-Page-Count']
});

// Rate Limiting
export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Request Logger
export const requestLogger = (req: Request, res: Response, next: NextFunction) => {
  const timestamp = new Date().toISOString();
  console.log(`${timestamp} - ${req.method} ${req.path}`);
  next();
};

// Content Type Validation
export const validateContentType = (req: Request, res: Response, next: NextFunction) => {
  if (req.method === 'POST' || req.method === 'PUT') {
    if (!req.is('application/json') && !req.is('multipart/form-data')) {
      return res.status(400).json({ error: 'Content-Type must be application/json or multipart/form-data' });
    }
  }
  next();
};

// Header Sanitization
export const sanitizeHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Remove potentially dangerous headers
  delete req.headers['x-forwarded-host'];
  delete req.headers['x-forwarded-server'];
  next();
};

// Payload Size Validation
export const validatePayloadSize = (maxSize: string = '10mb') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const contentLength = req.headers['content-length'];
    if (contentLength) {
      const sizeInMB = parseInt(contentLength) / (1024 * 1024);
      const maxSizeInMB = parseInt(maxSize.replace('mb', ''));
      if (sizeInMB > maxSizeInMB) {
        return res.status(413).json({ error: 'Payload too large' });
      }
    }
    next();
  };
};

export const securityHeaders = (req: Request, res: Response, next: NextFunction) => {
  // Configurar headers de seguridad
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('Permissions-Policy', 'geolocation=(), microphone=(), camera=()');
  
  // CSP para desarrollo
  if (process.env.NODE_ENV === 'development') {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self' 'unsafe-inline' 'unsafe-eval' http://localhost:* ws://localhost:*; img-src 'self' data: https:; font-src 'self' data:;"
    );
  } else {
    res.setHeader(
      'Content-Security-Policy',
      "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self';"
    );
  }
  
  next();
};
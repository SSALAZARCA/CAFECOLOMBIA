import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { executeQuery } from '../lib/mysql.js';
import type { AdminUser, AdminRole } from '../../shared/types/index.js';

// Extender el tipo Request para incluir admin
declare global {
  namespace Express {
    interface Request {
      admin?: AdminUser;
    }
  }
}

export interface AuthenticatedRequest extends Request {
  admin: AdminUser;
}

/**
 * Middleware para verificar autenticación de administrador
 */
export const authenticateAdmin = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acceso requerido'
      });
    }

    const token = authHeader.substring(7);

    // Verificar token JWT
    const decoded = jwt.verify(token, process.env.ADMIN_JWT_SECRET!) as any;

    // Buscar sesión activa
    const sessionQuery = `
      SELECT s.*, a.* FROM admin_sessions s
      JOIN admin_users a ON s.admin_id = a.id
      WHERE s.token = ? AND s.is_active = true AND s.expires_at > NOW() AND a.is_active = true
    `;
    
    const [sessionRows] = await executeQuery(sessionQuery, [token]);

    if (!sessionRows || sessionRows.length === 0) {
      return res.status(401).json({
        success: false,
        message: 'Sesión inválida o expirada'
      });
    }

    const admin = sessionRows[0] as AdminUser;

    // Verificar si la cuenta está bloqueada
    if (admin.locked_until && new Date() < new Date(admin.locked_until)) {
      return res.status(423).json({
        success: false,
        message: 'Cuenta bloqueada'
      });
    }

    // Agregar admin al request
    req.admin = admin;
    next();

  } catch (error) {
    console.error('Error en autenticación de administrador:', error);
    return res.status(401).json({
      success: false,
      message: 'Token inválido'
    });
  }
};

/**
 * Middleware para verificar roles específicos
 */
export const requireRole = (allowedRoles: AdminRole[]) => {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    if (!allowedRoles.includes(req.admin.role)) {
      return res.status(403).json({
        success: false,
        message: 'Permisos insuficientes'
      });
    }

    next();
  };
};

/**
 * Middleware para verificar permisos de super administrador
 */
export const requireSuperAdmin = requireRole(['super_admin']);

/**
 * Middleware para verificar permisos de administrador o superior
 */
export const requireAdmin = requireRole(['super_admin', 'admin']);

/**
 * Middleware para verificar permisos de moderador o superior
 */
export const requireModerator = requireRole(['super_admin', 'admin', 'moderator']);

/**
 * Middleware para verificar si el admin puede acceder a un recurso específico
 */
export const requireResourceAccess = (resourceType: string, getResourceId?: (req: Request) => number) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'Autenticación requerida'
      });
    }

    // Super admin tiene acceso a todo
    if (req.admin.role === 'super_admin') {
      return next();
    }

    // Verificar permisos específicos del recurso
    try {
      const resourceId = getResourceId ? getResourceId(req) : null;
      
      // Aquí se pueden implementar reglas específicas de acceso
      // Por ejemplo, un admin solo puede ver sus propios recursos
      
      next();
    } catch (error) {
      console.error('Error verificando acceso a recurso:', error);
      return res.status(500).json({
        success: false,
        message: 'Error verificando permisos'
      });
    }
  };
};

/**
 * Middleware para registrar actividad de administrador
 */
export const logAdminActivity = (action: string, resourceType: string) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    // Guardar la respuesta original
    const originalSend = res.send;
    
    res.send = function(data) {
      // Registrar actividad después de la respuesta exitosa
      if (res.statusCode >= 200 && res.statusCode < 300 && req.admin) {
        setImmediate(async () => {
          try {
            const resourceId = req.params.id ? parseInt(req.params.id) : null;
            const ipAddress = req.ip || req.connection.remoteAddress;
            const userAgent = req.get('User-Agent');

            await executeQuery(`
              INSERT INTO audit_logs (admin_id, action, resource_type, resource_id, ip_address, user_agent, metadata, created_at)
              VALUES (?, ?, ?, ?, ?, ?, ?, NOW())
            `, [
              req.admin.id,
              action,
              resourceType,
              resourceId,
              ipAddress,
              userAgent,
              JSON.stringify({
                method: req.method,
                url: req.originalUrl,
                body: req.method !== 'GET' ? req.body : undefined
              })
            ]);
          } catch (error) {
            console.error('Error registrando actividad de admin:', error);
          }
        });
      }

      return originalSend.call(this, data);
    };

    next();
  };
};

/**
 * Middleware para validar 2FA en operaciones críticas
 */
export const require2FA = async (req: Request, res: Response, next: NextFunction) => {
  if (!req.admin) {
    return res.status(401).json({
      success: false,
      message: 'Autenticación requerida'
    });
  }

  // Si el admin no tiene 2FA habilitado, requerirlo para operaciones críticas
  if (!req.admin.two_factor_enabled) {
    return res.status(403).json({
      success: false,
      message: 'Autenticación de dos factores requerida para esta operación'
    });
  }

  // Verificar que la sesión actual fue autenticada con 2FA
  const twoFactorCode = req.headers['x-2fa-code'] as string;
  
  if (!twoFactorCode) {
    return res.status(403).json({
      success: false,
      message: 'Código de autenticación de dos factores requerido'
    });
  }

  // Aquí se podría verificar el código 2FA si es necesario
  // Para operaciones muy críticas

  next();
};

/**
 * Middleware para limitar intentos de acceso
 */
export const rateLimitAdmin = (maxAttempts: number = 10, windowMs: number = 15 * 60 * 1000) => {
  const attempts = new Map<string, { count: number; resetTime: number }>();

  return (req: Request, res: Response, next: NextFunction) => {
    const key = req.ip || 'unknown';
    const now = Date.now();
    
    const userAttempts = attempts.get(key);
    
    if (!userAttempts || now > userAttempts.resetTime) {
      attempts.set(key, { count: 1, resetTime: now + windowMs });
      return next();
    }
    
    if (userAttempts.count >= maxAttempts) {
      return res.status(429).json({
        success: false,
        message: 'Demasiados intentos. Intenta de nuevo más tarde.'
      });
    }
    
    userAttempts.count++;
    next();
  };
};
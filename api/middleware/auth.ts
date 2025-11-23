import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { createError } from './errorHandler.js';
import { executeQuery } from '../config/database.js';

export interface AuthRequest extends Request {
  user?: {
    id: number;
    email: string;
    role: string;
    permissions?: string[];
    farmId?: number;
    farmName?: string;
  };
}

export const authenticateToken = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      throw createError('Token de acceso requerido', 401);
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw createError('Configuración de JWT no encontrada', 500);
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    let user = null;
    
    // Verificar si es un caficultor
    if (decoded.role === 'coffee_grower') {
      const [coffeeGrowers] = await executeQuery(
        `SELECT cg.id, cg.email, cg.first_name, cg.last_name, cg.is_active, cg.email_verified,
         f.id as farm_id, f.name as farm_name
         FROM coffee_growers cg
         LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.is_active = true
         WHERE cg.id = ? AND cg.is_active = true AND cg.email_verified = true`,
        [decoded.userId]
      ) as any[];

      if (!coffeeGrowers || coffeeGrowers.length === 0) {
        throw createError('Caficultor no encontrado o inactivo', 401);
      }

      user = coffeeGrowers[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: 'coffee_grower',
        farmId: user.farm_id,
        farmName: user.farm_name
      };
    } else {
      // Verificar si es un administrador
      const [adminUsers] = await executeQuery(
        'SELECT id, email, role, is_active FROM admin_users WHERE id = ? AND is_active = true',
        [decoded.userId]
      ) as any[];

      if (!adminUsers || adminUsers.length === 0) {
        throw createError('Usuario no encontrado o inactivo', 401);
      }

      user = adminUsers[0];
      req.user = {
        id: user.id,
        email: user.email,
        role: user.role,
        permissions: decoded.permissions || []
      };
    }

    next();
  } catch (error: any) {
    if (error.name === 'JsonWebTokenError') {
      next(createError('Token inválido', 401));
    } else if (error.name === 'TokenExpiredError') {
      next(createError('Token expirado', 401));
    } else {
      next(error);
    }
  }
};

export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Usuario no autenticado', 401));
    }

    const allowedRoles = Array.isArray(roles) ? roles : [roles];
    
    if (!allowedRoles.includes(req.user.role)) {
      return next(createError('Permisos insuficientes', 403));
    }

    next();
  };
};

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Usuario no autenticado', 401));
    }

    // Super admin tiene todos los permisos
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!req.user.permissions || !req.user.permissions.includes(permission)) {
      return next(createError('Permiso específico requerido', 403));
    }

    next();
  };
};

export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      return next(createError('Usuario no autenticado', 401));
    }

    // Super admin tiene todos los permisos
    if (req.user.role === 'super_admin') {
      return next();
    }

    if (!req.user.permissions) {
      return next(createError('Permisos no encontrados', 403));
    }

    const hasPermission = permissions.some(permission => 
      req.user!.permissions!.includes(permission)
    );

    if (!hasPermission) {
      return next(createError('Al menos uno de los permisos requeridos es necesario', 403));
    }

    next();
  };
};

// Middleware específico para caficultores (acepta múltiples variantes)
export const requireCoffeeGrower = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createError('Usuario no autenticado', 401));
  }

  const validCoffeeGrowerRoles = ['coffee_grower', 'coffee-grower', 'farmer', 'user', 'caficultor'];
  if (!validCoffeeGrowerRoles.includes(req.user.role)) {
    return next(createError('Acceso restringido a caficultores', 403));
  }

  next();
};

// Middleware para verificar que el caficultor accede solo a sus recursos
export const requireOwnFarm = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.user) {
    return next(createError('Usuario no autenticado', 401));
  }

  if (req.user.role === 'super_admin' || req.user.role === 'admin') {
    return next(); // Administradores pueden acceder a todo
  }

  if (req.user.role !== 'coffee_grower') {
    return next(createError('Acceso restringido', 403));
  }

  // Verificar que el farmId en la URL coincida con el del usuario
  const farmId = req.params.farmId || req.body.farmId || req.query.farmId;
  
  if (farmId && parseInt(farmId) !== req.user.farmId) {
    return next(createError('No tienes acceso a esta finca', 403));
  }

  next();
};

export const optionalAuth = async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      return next(); // Continuar sin autenticación
    }

    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      return next(); // Continuar sin autenticación
    }

    const decoded = jwt.verify(token, jwtSecret) as any;
    
    // Verificar si es un caficultor
    if (decoded.role === 'coffee_grower') {
      const [coffeeGrowers] = await executeQuery(
        `SELECT cg.id, cg.email, cg.first_name, cg.last_name, cg.is_active, cg.email_verified,
         f.id as farm_id, f.name as farm_name
         FROM coffee_growers cg
         LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.is_active = true
         WHERE cg.id = ? AND cg.is_active = true AND cg.email_verified = true`,
        [decoded.userId]
      ) as any[];

      if (coffeeGrowers && coffeeGrowers.length > 0) {
        const user = coffeeGrowers[0];
        req.user = {
          id: user.id,
          email: user.email,
          role: 'coffee_grower',
          farmId: user.farm_id,
          farmName: user.farm_name
        };
      }
    } else {
      // Verificar si es un administrador
      const [adminUsers] = await executeQuery(
        'SELECT id, email, role, is_active FROM admin_users WHERE id = ? AND is_active = true',
        [decoded.userId]
      ) as any[];

      if (adminUsers && adminUsers.length > 0) {
        const user = adminUsers[0];
        req.user = {
          id: user.id,
          email: user.email,
          role: user.role,
          permissions: decoded.permissions || []
        };
      }
    }

    next();
  } catch (error) {
    // En caso de error, continuar sin autenticación
    next();
  }
};
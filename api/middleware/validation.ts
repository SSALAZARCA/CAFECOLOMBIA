import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';

// Middleware para validar datos con Zod
export const validateData = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: 'Datos de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: errors,
        });
      }

      next(error);
    }
  };
};

// Middleware para validar parámetros de URL
export const validateParams = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.params);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: 'Parámetros de URL inválidos',
          code: 'PARAMS_VALIDATION_ERROR',
          details: errors,
        });
      }

      next(error);
    }
  };
};

// Middleware para validar query parameters
export const validateQuery = (schema: z.ZodSchema) => {
  return (req: Request, res: Response, next: NextFunction) => {
    try {
      schema.parse(req.query);
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const errors = error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          code: err.code,
        }));

        return res.status(400).json({
          error: 'Parámetros de consulta inválidos',
          code: 'QUERY_VALIDATION_ERROR',
          details: errors,
        });
      }

      next(error);
    }
  };
};

// Esquemas de validación comunes
export const commonSchemas = {
  // ID de MongoDB/Prisma
  id: z.object({
    id: z.string().min(1, 'ID es requerido'),
  }),

  // Paginación
  pagination: z.object({
    page: z.string().optional().transform(val => val ? parseInt(val) : 1),
    limit: z.string().optional().transform(val => val ? parseInt(val) : 10),
    search: z.string().optional(),
  }),

  // Fechas
  dateRange: z.object({
    startDate: z.string().datetime().optional(),
    endDate: z.string().datetime().optional(),
  }),
};

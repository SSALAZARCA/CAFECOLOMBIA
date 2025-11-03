import express from 'express';
import { AdminCoffeeGrowersManagementService } from '../../services/adminCoffeeGrowersManagement.js';
import { 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity 
} from '../../middleware/adminAuth.js';
import type { 
  CoffeeGrowerCreateRequest, 
  CoffeeGrowerUpdateRequest, 
  CoffeeGrowerListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

/**
 * GET /api/admin/coffee-growers
 * Obtener lista de caficultores
 */
router.get('/', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'coffee_grower'),
  async (req, res) => {
    try {
      const filters: CoffeeGrowerListFilters = {
        status: req.query.status as any,
        department: req.query.department as string,
        municipality: req.query.municipality as string,
        certification_type: req.query.certification_type as any,
        farming_practices: req.query.farming_practices as any,
        processing_method: req.query.processing_method as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'desc',
        min_experience: req.query.min_experience ? parseInt(req.query.min_experience as string) : undefined,
        max_experience: req.query.max_experience ? parseInt(req.query.max_experience as string) : undefined,
        min_area: req.query.min_area ? parseFloat(req.query.min_area as string) : undefined,
        max_area: req.query.max_area ? parseFloat(req.query.max_area as string) : undefined,
        min_production: req.query.min_production ? parseFloat(req.query.min_production as string) : undefined,
        max_production: req.query.max_production ? parseFloat(req.query.max_production as string) : undefined
      };

      // Filtro de rango de fechas
      if (req.query.date_from && req.query.date_to) {
        filters.date_range = {
          start: new Date(req.query.date_from as string),
          end: new Date(req.query.date_to as string)
        };
      }

      const result = await AdminCoffeeGrowersManagementService.getCoffeeGrowers(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error obteniendo caficultores:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo lista de caficultores'
      });
    }
  }
);

/**
 * GET /api/admin/coffee-growers/stats
 * Obtener estadísticas de caficultores
 */
router.get('/stats', 
  authenticateAdmin, 
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await AdminCoffeeGrowersManagementService.getCoffeeGrowerStats();

      res.json({
        success: true,
        data: stats
      });

    } catch (error) {
      console.error('Error obteniendo estadísticas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo estadísticas'
      });
    }
  }
);

/**
 * GET /api/admin/coffee-growers/:id
 * Obtener caficultor por ID
 */
router.get('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'coffee_grower'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const coffeeGrower = await AdminCoffeeGrowersManagementService.getCoffeeGrowerById(id);

      if (!coffeeGrower) {
        return res.status(404).json({
          success: false,
          message: 'Caficultor no encontrado'
        });
      }

      res.json({
        success: true,
        data: coffeeGrower
      });

    } catch (error) {
      console.error('Error obteniendo caficultor:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo caficultor'
      });
    }
  }
);

/**
 * GET /api/admin/coffee-growers/:id/farms
 * Obtener fincas de un caficultor
 */
router.get('/:id/farms', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'farm'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const farms = await AdminCoffeeGrowersManagementService.getCoffeeGrowerFarms(id);

      res.json({
        success: true,
        data: farms
      });

    } catch (error) {
      console.error('Error obteniendo fincas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo fincas del caficultor'
      });
    }
  }
);

/**
 * POST /api/admin/coffee-growers
 * Crear nuevo caficultor
 */
router.post('/', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('CREATE', 'coffee_grower'),
  async (req, res) => {
    try {
      const coffeeGrowerData: CoffeeGrowerCreateRequest = req.body;

      // Validar datos requeridos
      if (!coffeeGrowerData.identification_number || !coffeeGrowerData.identification_type || 
          !coffeeGrowerData.full_name || !coffeeGrowerData.department || !coffeeGrowerData.municipality) {
        return res.status(400).json({
          success: false,
          message: 'Los campos número de identificación, tipo de identificación, nombre completo, departamento y municipio son requeridos'
        });
      }

      // Validar formato de email si se proporciona
      if (coffeeGrowerData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(coffeeGrowerData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }

      // Validar tipos enumerados
      const validIdentificationTypes = ['cedula', 'cedula_extranjeria', 'pasaporte', 'nit'];
      if (!validIdentificationTypes.includes(coffeeGrowerData.identification_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de identificación inválido'
        });
      }

      const result = await AdminCoffeeGrowersManagementService.createCoffeeGrower(coffeeGrowerData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('Error creando caficultor:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando caficultor'
      });
    }
  }
);

/**
 * PUT /api/admin/coffee-growers/:id
 * Actualizar caficultor
 */
router.put('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('UPDATE', 'coffee_grower'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: CoffeeGrowerUpdateRequest = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Validar formato de email si se proporciona
      if (updateData.email) {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(updateData.email)) {
          return res.status(400).json({
            success: false,
            message: 'Formato de email inválido'
          });
        }
      }

      // Validar tipos enumerados si se proporcionan
      if (updateData.identification_type) {
        const validIdentificationTypes = ['cedula', 'cedula_extranjeria', 'pasaporte', 'nit'];
        if (!validIdentificationTypes.includes(updateData.identification_type)) {
          return res.status(400).json({
            success: false,
            message: 'Tipo de identificación inválido'
          });
        }
      }

      if (updateData.status) {
        const validStatuses = ['active', 'inactive', 'suspended'];
        if (!validStatuses.includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: 'Estado inválido'
          });
        }
      }

      const result = await AdminCoffeeGrowersManagementService.updateCoffeeGrower(id, updateData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error actualizando caficultor:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando caficultor'
      });
    }
  }
);

/**
 * DELETE /api/admin/coffee-growers/:id
 * Eliminar caficultor
 */
router.delete('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('DELETE', 'coffee_grower'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const result = await AdminCoffeeGrowersManagementService.deleteCoffeeGrower(id, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error eliminando caficultor:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando caficultor'
      });
    }
  }
);

/**
 * PATCH /api/admin/coffee-growers/:id/status
 * Cambiar estado de un caficultor
 */
router.patch('/:id/status', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('UPDATE', 'coffee_grower'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { status } = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      if (!status) {
        return res.status(400).json({
          success: false,
          message: 'Estado requerido'
        });
      }

      const validStatuses = ['active', 'inactive', 'suspended'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: active, inactive o suspended'
        });
      }

      const result = await AdminCoffeeGrowersManagementService.changeCoffeeGrowerStatus(id, status, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error cambiando estado del caficultor:', error);
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado del caficultor'
      });
    }
  }
);

export default router;
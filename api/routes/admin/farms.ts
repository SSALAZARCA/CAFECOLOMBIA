import express from 'express';
import { AdminFarmsManagementService } from '../../services/adminFarmsManagement.js';
import { 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity 
} from '../../middleware/adminAuth.js';
import type { 
  FarmCreateRequest, 
  FarmUpdateRequest, 
  FarmListFilters 
} from '../../../shared/types/index.js';

const router = express.Router();

/**
 * GET /api/admin/farms
 * Obtener lista de fincas
 */
router.get('/', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('READ', 'farm'),
  async (req, res) => {
    try {
      const filters: FarmListFilters = {
        coffee_grower_id: req.query.coffee_grower_id ? parseInt(req.query.coffee_grower_id as string) : undefined,
        status: req.query.status as any,
        department: req.query.department as string,
        municipality: req.query.municipality as string,
        certification_status: req.query.certification_status as any,
        irrigation_type: req.query.irrigation_type as any,
        processing_method: req.query.processing_method as any,
        search: req.query.search as string,
        page: req.query.page ? parseInt(req.query.page as string) : 1,
        limit: req.query.limit ? parseInt(req.query.limit as string) : 10,
        sort_by: req.query.sort_by as any || 'created_at',
        sort_order: req.query.sort_order as any || 'desc',
        min_area: req.query.min_area ? parseFloat(req.query.min_area as string) : undefined,
        max_area: req.query.max_area ? parseFloat(req.query.max_area as string) : undefined,
        min_production: req.query.min_production ? parseFloat(req.query.min_production as string) : undefined,
        max_production: req.query.max_production ? parseFloat(req.query.max_production as string) : undefined,
        min_altitude: req.query.min_altitude ? parseFloat(req.query.min_altitude as string) : undefined,
        max_altitude: req.query.max_altitude ? parseFloat(req.query.max_altitude as string) : undefined,
        has_certifications: req.query.has_certifications ? req.query.has_certifications === 'true' : undefined,
        has_processing_facility: req.query.has_processing_facility ? req.query.has_processing_facility === 'true' : undefined,
        has_water_source: req.query.has_water_source ? req.query.has_water_source === 'true' : undefined
      };

      // Filtro de rango de fechas
      if (req.query.date_from && req.query.date_to) {
        filters.date_range = {
          start: new Date(req.query.date_from as string),
          end: new Date(req.query.date_to as string)
        };
      }

      // Filtro de variedades de café
      if (req.query.coffee_varieties) {
        const varieties = (req.query.coffee_varieties as string).split(',');
        filters.coffee_varieties = varieties as any[];
      }

      const result = await AdminFarmsManagementService.getFarms(filters);

      res.json({
        success: true,
        data: result
      });

    } catch (error) {
      console.error('Error obteniendo fincas:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo lista de fincas'
      });
    }
  }
);

/**
 * GET /api/admin/farms/stats
 * Obtener estadísticas de fincas
 */
router.get('/stats', 
  authenticateAdmin, 
  requireAdmin,
  async (req, res) => {
    try {
      const stats = await AdminFarmsManagementService.getFarmStats();

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
 * GET /api/admin/farms/map-data
 * Obtener datos de fincas para mapas
 */
router.get('/map-data', 
  authenticateAdmin, 
  requireAdmin,
  async (req, res) => {
    try {
      const filters: FarmListFilters = {
        status: req.query.status as any,
        department: req.query.department as string,
        certification_status: req.query.certification_status as any
      };

      const mapData = await AdminFarmsManagementService.getFarmsMapData(filters);

      res.json({
        success: true,
        data: mapData
      });

    } catch (error) {
      console.error('Error obteniendo datos del mapa:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo datos del mapa'
      });
    }
  }
);

/**
 * GET /api/admin/farms/:id
 * Obtener finca por ID
 */
router.get('/:id', 
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

      const farm = await AdminFarmsManagementService.getFarmById(id);

      if (!farm) {
        return res.status(404).json({
          success: false,
          message: 'Finca no encontrada'
        });
      }

      res.json({
        success: true,
        data: farm
      });

    } catch (error) {
      console.error('Error obteniendo finca:', error);
      res.status(500).json({
        success: false,
        message: 'Error obteniendo finca'
      });
    }
  }
);

/**
 * POST /api/admin/farms
 * Crear nueva finca
 */
router.post('/', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('CREATE', 'farm'),
  async (req, res) => {
    try {
      const farmData: FarmCreateRequest = req.body;

      // Validar datos requeridos
      if (!farmData.coffee_grower_id || !farmData.name || !farmData.address || 
          !farmData.department || !farmData.municipality || !farmData.total_area || 
          !farmData.coffee_area || !farmData.irrigation_type || !farmData.processing_method ||
          !farmData.certification_status || !farmData.coffee_varieties || 
          farmData.coffee_varieties.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos requeridos deben ser proporcionados'
        });
      }

      // Validar que el área de café no sea mayor que el área total
      if (farmData.coffee_area > farmData.total_area) {
        return res.status(400).json({
          success: false,
          message: 'El área de café no puede ser mayor que el área total'
        });
      }

      // Validar tipos enumerados
      const validIrrigationTypes = ['riego', 'secano', 'mixto'];
      if (!validIrrigationTypes.includes(farmData.irrigation_type)) {
        return res.status(400).json({
          success: false,
          message: 'Tipo de irrigación inválido'
        });
      }

      const validProcessingMethods = ['lavado', 'natural', 'honey', 'semi_lavado', 'experimental'];
      if (!validProcessingMethods.includes(farmData.processing_method)) {
        return res.status(400).json({
          success: false,
          message: 'Método de procesamiento inválido'
        });
      }

      const validCertificationStatuses = ['certificada', 'en_proceso', 'no_certificada'];
      if (!validCertificationStatuses.includes(farmData.certification_status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado de certificación inválido'
        });
      }

      const result = await AdminFarmsManagementService.createFarm(farmData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.status(201).json(result);

    } catch (error) {
      console.error('Error creando finca:', error);
      res.status(500).json({
        success: false,
        message: 'Error creando finca'
      });
    }
  }
);

/**
 * PUT /api/admin/farms/:id
 * Actualizar finca
 */
router.put('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('UPDATE', 'farm'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updateData: FarmUpdateRequest = req.body;

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      // Validar que el área de café no sea mayor que el área total si ambos se proporcionan
      if (updateData.coffee_area && updateData.total_area && updateData.coffee_area > updateData.total_area) {
        return res.status(400).json({
          success: false,
          message: 'El área de café no puede ser mayor que el área total'
        });
      }

      // Validar tipos enumerados si se proporcionan
      if (updateData.irrigation_type) {
        const validIrrigationTypes = ['riego', 'secano', 'mixto'];
        if (!validIrrigationTypes.includes(updateData.irrigation_type)) {
          return res.status(400).json({
            success: false,
            message: 'Tipo de irrigación inválido'
          });
        }
      }

      if (updateData.processing_method) {
        const validProcessingMethods = ['lavado', 'natural', 'honey', 'semi_lavado', 'experimental'];
        if (!validProcessingMethods.includes(updateData.processing_method)) {
          return res.status(400).json({
            success: false,
            message: 'Método de procesamiento inválido'
          });
        }
      }

      if (updateData.certification_status) {
        const validCertificationStatuses = ['certificada', 'en_proceso', 'no_certificada'];
        if (!validCertificationStatuses.includes(updateData.certification_status)) {
          return res.status(400).json({
            success: false,
            message: 'Estado de certificación inválido'
          });
        }
      }

      if (updateData.status) {
        const validStatuses = ['active', 'inactive', 'maintenance', 'abandoned'];
        if (!validStatuses.includes(updateData.status)) {
          return res.status(400).json({
            success: false,
            message: 'Estado inválido'
          });
        }
      }

      const result = await AdminFarmsManagementService.updateFarm(id, updateData, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error actualizando finca:', error);
      res.status(500).json({
        success: false,
        message: 'Error actualizando finca'
      });
    }
  }
);

/**
 * DELETE /api/admin/farms/:id
 * Eliminar finca
 */
router.delete('/:id', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('DELETE', 'farm'),
  async (req, res) => {
    try {
      const id = parseInt(req.params.id);

      if (isNaN(id)) {
        return res.status(400).json({
          success: false,
          message: 'ID inválido'
        });
      }

      const result = await AdminFarmsManagementService.deleteFarm(id, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error eliminando finca:', error);
      res.status(500).json({
        success: false,
        message: 'Error eliminando finca'
      });
    }
  }
);

/**
 * PATCH /api/admin/farms/:id/status
 * Cambiar estado de una finca
 */
router.patch('/:id/status', 
  authenticateAdmin, 
  requireAdmin,
  logAdminActivity('UPDATE', 'farm'),
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

      const validStatuses = ['active', 'inactive', 'maintenance', 'abandoned'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          message: 'Estado inválido. Debe ser: active, inactive, maintenance o abandoned'
        });
      }

      const result = await AdminFarmsManagementService.changeFarmStatus(id, status, req.admin!.id);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);

    } catch (error) {
      console.error('Error cambiando estado de la finca:', error);
      res.status(500).json({
        success: false,
        message: 'Error cambiando estado de la finca'
      });
    }
  }
);

export default router;
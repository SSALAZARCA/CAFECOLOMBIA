import mysql from '../lib/mysql.js';
import type { 
  Farm, 
  FarmCreateRequest, 
  FarmUpdateRequest,
  FarmListFilters,
  FarmListResponse,
  FarmStats,
  FarmMapData
} from '../../shared/types/index.js';

export class AdminFarmsManagementService {
  /**
   * Obtener lista de fincas con filtros
   */
  static async getFarms(filters: FarmListFilters): Promise<FarmListResponse> {
    const connection = await mysql.getConnection();
    
    try {
      let query = `
        SELECT 
          f.*,
          cg.full_name as coffee_grower_name,
          cg.identification_number as coffee_grower_identification
        FROM farms f
        INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
        WHERE f.deleted_at IS NULL AND cg.deleted_at IS NULL
      `;
      
      const queryParams: any[] = [];
      
      // Aplicar filtros
      if (filters.coffee_grower_id) {
        query += ` AND f.coffee_grower_id = ?`;
        queryParams.push(filters.coffee_grower_id);
      }
      
      if (filters.search) {
        query += ` AND (f.name LIKE ? OR f.code LIKE ? OR cg.full_name LIKE ? OR f.address LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.status) {
        query += ` AND f.status = ?`;
        queryParams.push(filters.status);
      }
      
      if (filters.department) {
        query += ` AND f.department = ?`;
        queryParams.push(filters.department);
      }
      
      if (filters.municipality) {
        query += ` AND f.municipality = ?`;
        queryParams.push(filters.municipality);
      }
      
      if (filters.certification_status) {
        query += ` AND f.certification_status = ?`;
        queryParams.push(filters.certification_status);
      }
      
      if (filters.irrigation_type) {
        query += ` AND f.irrigation_type = ?`;
        queryParams.push(filters.irrigation_type);
      }
      
      if (filters.processing_method) {
        query += ` AND f.processing_method = ?`;
        queryParams.push(filters.processing_method);
      }
      
      if (filters.min_area && filters.max_area) {
        query += ` AND f.total_area BETWEEN ? AND ?`;
        queryParams.push(filters.min_area, filters.max_area);
      } else if (filters.min_area) {
        query += ` AND f.total_area >= ?`;
        queryParams.push(filters.min_area);
      } else if (filters.max_area) {
        query += ` AND f.total_area <= ?`;
        queryParams.push(filters.max_area);
      }
      
      if (filters.min_production && filters.max_production) {
        query += ` AND f.annual_production BETWEEN ? AND ?`;
        queryParams.push(filters.min_production, filters.max_production);
      } else if (filters.min_production) {
        query += ` AND f.annual_production >= ?`;
        queryParams.push(filters.min_production);
      } else if (filters.max_production) {
        query += ` AND f.annual_production <= ?`;
        queryParams.push(filters.max_production);
      }
      
      if (filters.has_certifications !== undefined) {
        if (filters.has_certifications) {
          query += ` AND f.certification_status = 'certificada'`;
        } else {
          query += ` AND f.certification_status = 'no_certificada'`;
        }
      }
      
      if (filters.has_processing_facility !== undefined) {
        query += ` AND f.has_processing_facility = ?`;
        queryParams.push(filters.has_processing_facility);
      }
      
      if (filters.has_water_source !== undefined) {
        query += ` AND f.has_water_source = ?`;
        queryParams.push(filters.has_water_source);
      }
      
      if (filters.date_range?.start && filters.date_range?.end) {
        query += ` AND f.created_at BETWEEN ? AND ?`;
        queryParams.push(filters.date_range.start, filters.date_range.end);
      }
      
      // Ordenamiento
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query += ` ORDER BY f.${sortBy} ${sortOrder}`;
      
      // Contar total de registros
      const countQuery = `
        SELECT COUNT(*) as total
        FROM farms f
        INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
        WHERE f.deleted_at IS NULL AND cg.deleted_at IS NULL
        ${filters.coffee_grower_id ? 'AND f.coffee_grower_id = ?' : ''}
        ${filters.search ? 'AND (f.name LIKE ? OR f.code LIKE ? OR cg.full_name LIKE ? OR f.address LIKE ?)' : ''}
        ${filters.status ? 'AND f.status = ?' : ''}
        ${filters.department ? 'AND f.department = ?' : ''}
        ${filters.municipality ? 'AND f.municipality = ?' : ''}
        ${filters.certification_status ? 'AND f.certification_status = ?' : ''}
        ${filters.irrigation_type ? 'AND f.irrigation_type = ?' : ''}
        ${filters.processing_method ? 'AND f.processing_method = ?' : ''}
        ${filters.min_area && filters.max_area ? 'AND f.total_area BETWEEN ? AND ?' : 
          filters.min_area ? 'AND f.total_area >= ?' : 
          filters.max_area ? 'AND f.total_area <= ?' : ''}
        ${filters.min_production && filters.max_production ? 'AND f.annual_production BETWEEN ? AND ?' : 
          filters.min_production ? 'AND f.annual_production >= ?' : 
          filters.max_production ? 'AND f.annual_production <= ?' : ''}
        ${filters.has_certifications !== undefined ? 
          (filters.has_certifications ? "AND f.certification_status = 'certificada'" : "AND f.certification_status = 'no_certificada'") : ''}
        ${filters.has_processing_facility !== undefined ? 'AND f.has_processing_facility = ?' : ''}
        ${filters.has_water_source !== undefined ? 'AND f.has_water_source = ?' : ''}
        ${filters.date_range?.start && filters.date_range?.end ? 'AND f.created_at BETWEEN ? AND ?' : ''}
      `;
      
      const [countResult] = await connection.execute(countQuery, queryParams);
      const total = (countResult as any[])[0].total;
      
      // Paginación
      const page = filters.page || 1;
      const limit = filters.limit || 10;
      const offset = (page - 1) * limit;
      
      query += ` LIMIT ? OFFSET ?`;
      queryParams.push(limit, offset);
      
      const [rows] = await connection.execute(query, queryParams);
      const farms = rows as Farm[];
      
      return {
        data: farms,
        pagination: {
          page,
          limit,
          total,
          pages: Math.ceil(total / limit)
        }
      };
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener finca por ID
   */
  static async getFarmById(id: number): Promise<Farm | null> {
    const connection = await mysql.getConnection();
    
    try {
      const query = `
        SELECT 
          f.*,
          cg.full_name as coffee_grower_name,
          cg.identification_number as coffee_grower_identification
        FROM farms f
        INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
        WHERE f.id = ? AND f.deleted_at IS NULL AND cg.deleted_at IS NULL
      `;
      
      const [rows] = await connection.execute(query, [id]);
      const farms = rows as Farm[];
      
      return farms.length > 0 ? farms[0] : null;
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Crear nueva finca
   */
  static async createFarm(
    data: FarmCreateRequest, 
    adminId: number
  ): Promise<{ success: boolean; message: string; data?: Farm }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el caficultor existe
      const [coffeeGrowerRows] = await connection.execute(
        'SELECT id FROM coffee_growers WHERE id = ? AND deleted_at IS NULL',
        [data.coffee_grower_id]
      );
      
      if ((coffeeGrowerRows as any[]).length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Caficultor no encontrado'
        };
      }
      
      // Verificar si ya existe una finca con el mismo código (si se proporciona)
      if (data.code) {
        const [existingRows] = await connection.execute(
          'SELECT id FROM farms WHERE code = ? AND deleted_at IS NULL',
          [data.code]
        );
        
        if ((existingRows as any[]).length > 0) {
          await connection.rollback();
          return {
            success: false,
            message: 'Ya existe una finca con este código'
          };
        }
      }
      
      // Insertar nueva finca
      const insertQuery = `
        INSERT INTO farms (
          coffee_grower_id, name, code, description, address, department, municipality,
          rural_zone, coordinates, total_area, coffee_area, other_crops_area,
          forest_area, infrastructure_area, soil_data, climate_data, irrigation_type,
          coffee_varieties, planting_density, tree_age_years, processing_method,
          certification_status, certifications, certification_expiry, annual_production,
          last_harvest_date, next_harvest_date, has_processing_facility,
          has_storage_facility, has_drying_facility, has_water_source, has_electricity,
          access_road_condition, farming_practices, pest_control_methods,
          fertilization_program, pruning_schedule, notes, status, created_by,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const insertValues = [
        data.coffee_grower_id,
        data.name,
        data.code || null,
        data.description || null,
        data.address,
        data.department,
        data.municipality,
        data.rural_zone || null,
        data.coordinates ? JSON.stringify(data.coordinates) : null,
        data.total_area,
        data.coffee_area,
        data.other_crops_area || null,
        data.forest_area || null,
        data.infrastructure_area || null,
        data.soil_data ? JSON.stringify(data.soil_data) : null,
        data.climate_data ? JSON.stringify(data.climate_data) : null,
        data.irrigation_type,
        JSON.stringify(data.coffee_varieties),
        data.planting_density || null,
        data.tree_age_years || null,
        data.processing_method,
        data.certification_status,
        data.certifications ? JSON.stringify(data.certifications) : null,
        data.certification_expiry || null,
        data.annual_production || null,
        data.last_harvest_date || null,
        data.next_harvest_date || null,
        data.has_processing_facility,
        data.has_storage_facility,
        data.has_drying_facility,
        data.has_water_source,
        data.has_electricity,
        data.access_road_condition || null,
        data.farming_practices ? JSON.stringify(data.farming_practices) : null,
        data.pest_control_methods ? JSON.stringify(data.pest_control_methods) : null,
        data.fertilization_program || null,
        data.pruning_schedule || null,
        data.notes || null,
        'active',
        adminId
      ];
      
      const [result] = await connection.execute(insertQuery, insertValues);
      const insertId = (result as any).insertId;
      
      await connection.commit();
      
      // Obtener la finca creada
      const newFarm = await this.getFarmById(insertId);
      
      return {
        success: true,
        message: 'Finca creada exitosamente',
        data: newFarm!
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Actualizar finca
   */
  static async updateFarm(
    id: number, 
    data: FarmUpdateRequest, 
    adminId: number
  ): Promise<{ success: boolean; message: string; data?: Farm }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la finca existe
      const [existingRows] = await connection.execute(
        'SELECT id FROM farms WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Finca no encontrada'
        };
      }
      
      // Verificar unicidad del código si se está actualizando
      if (data.code) {
        const [codeRows] = await connection.execute(
          'SELECT id FROM farms WHERE code = ? AND id != ? AND deleted_at IS NULL',
          [data.code, id]
        );
        
        if ((codeRows as any[]).length > 0) {
          await connection.rollback();
          return {
            success: false,
            message: 'Ya existe otra finca con este código'
          };
        }
      }
      
      // Construir query de actualización dinámicamente
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      const allowedFields = [
        'name', 'code', 'description', 'address', 'department', 'municipality',
        'rural_zone', 'total_area', 'coffee_area', 'other_crops_area',
        'forest_area', 'infrastructure_area', 'irrigation_type', 'planting_density',
        'tree_age_years', 'processing_method', 'certification_status',
        'certification_expiry', 'annual_production', 'last_harvest_date',
        'next_harvest_date', 'has_processing_facility', 'has_storage_facility',
        'has_drying_facility', 'has_water_source', 'has_electricity',
        'access_road_condition', 'fertilization_program', 'pruning_schedule',
        'notes', 'status'
      ];
      
      for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push((data as any)[field]);
        }
      }
      
      // Campos especiales que requieren JSON.stringify
      const jsonFields = ['coordinates', 'soil_data', 'climate_data', 'coffee_varieties', 'certifications', 'farming_practices', 'pest_control_methods'];
      for (const field of jsonFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push((data as any)[field] ? JSON.stringify((data as any)[field]) : null);
        }
      }
      
      if (updateFields.length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'No hay campos para actualizar'
        };
      }
      
      updateFields.push('updated_by = ?', 'updated_at = NOW()');
      updateValues.push(adminId, id);
      
      const updateQuery = `
        UPDATE farms 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await connection.execute(updateQuery, updateValues);
      await connection.commit();
      
      // Obtener la finca actualizada
      const updatedFarm = await this.getFarmById(id);
      
      return {
        success: true,
        message: 'Finca actualizada exitosamente',
        data: updatedFarm!
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Eliminar finca (soft delete)
   */
  static async deleteFarm(
    id: number, 
    adminId: number
  ): Promise<{ success: boolean; message: string }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que la finca existe
      const [existingRows] = await connection.execute(
        'SELECT id FROM farms WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Finca no encontrada'
        };
      }
      
      // Soft delete de la finca
      await connection.execute(
        'UPDATE farms SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [adminId, id]
      );
      
      await connection.commit();
      
      return {
        success: true,
        message: 'Finca eliminada exitosamente'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener estadísticas de fincas
   */
  static async getFarmStats(): Promise<FarmStats> {
    const connection = await mysql.getConnection();
    
    try {
      // Estadísticas básicas
      const [basicStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN status = 'maintenance' THEN 1 END) as maintenance,
          COUNT(CASE WHEN status = 'abandoned' THEN 1 END) as abandoned,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month,
          SUM(total_area) as total_area,
          SUM(coffee_area) as total_coffee_area,
          AVG(total_area) as average_farm_size,
          AVG(coffee_area) as average_coffee_area
        FROM farms 
        WHERE deleted_at IS NULL
      `);
      
      const stats = (basicStats as any[])[0];
      
      // Estadísticas por departamento
      const [deptStats] = await connection.execute(`
        SELECT 
          department,
          COUNT(*) as count,
          SUM(total_area) as total_area
        FROM farms 
        WHERE deleted_at IS NULL
        GROUP BY department
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Estadísticas por certificación
      const [certStats] = await connection.execute(`
        SELECT 
          certification_status,
          COUNT(*) as count,
          ROUND(COUNT(*) * 100.0 / (SELECT COUNT(*) FROM farms WHERE deleted_at IS NULL), 2) as percentage
        FROM farms 
        WHERE deleted_at IS NULL
        GROUP BY certification_status
        ORDER BY count DESC
      `);
      
      // Estadísticas por variedad de café (esto requiere parsear JSON)
      const [varietyStats] = await connection.execute(`
        SELECT 
          coffee_varieties,
          COUNT(*) as count,
          SUM(coffee_area) as area
        FROM farms 
        WHERE deleted_at IS NULL AND coffee_varieties IS NOT NULL
        GROUP BY coffee_varieties
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Resumen de producción
      const [productionStats] = await connection.execute(`
        SELECT 
          SUM(annual_production) as total_annual_production,
          AVG(annual_production / coffee_area) as average_production_per_hectare,
          COUNT(CASE WHEN annual_production IS NOT NULL THEN 1 END) as farms_with_production_data
        FROM farms 
        WHERE deleted_at IS NULL AND coffee_area > 0
      `);
      
      const production = (productionStats as any[])[0];
      
      // Resumen de infraestructura
      const [infraStats] = await connection.execute(`
        SELECT 
          COUNT(CASE WHEN has_processing_facility = 1 THEN 1 END) as with_processing_facility,
          COUNT(CASE WHEN has_storage_facility = 1 THEN 1 END) as with_storage_facility,
          COUNT(CASE WHEN has_drying_facility = 1 THEN 1 END) as with_drying_facility,
          COUNT(CASE WHEN has_water_source = 1 THEN 1 END) as with_water_source,
          COUNT(CASE WHEN has_electricity = 1 THEN 1 END) as with_electricity
        FROM farms 
        WHERE deleted_at IS NULL
      `);
      
      const infrastructure = (infraStats as any[])[0];
      
      return {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        maintenance: stats.maintenance,
        abandoned: stats.abandoned,
        new_this_month: stats.new_this_month,
        total_area: Math.round(stats.total_area || 0),
        total_coffee_area: Math.round(stats.total_coffee_area || 0),
        average_farm_size: Math.round(stats.average_farm_size || 0),
        average_coffee_area: Math.round(stats.average_coffee_area || 0),
        by_department: deptStats as any[],
        by_certification: certStats as any[],
        by_variety: varietyStats as any[],
        production_summary: {
          total_annual_production: Math.round(production.total_annual_production || 0),
          average_production_per_hectare: Math.round(production.average_production_per_hectare || 0),
          farms_with_production_data: production.farms_with_production_data
        },
        infrastructure_summary: infrastructure
      };
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener datos de fincas para mapas
   */
  static async getFarmsMapData(filters?: FarmListFilters): Promise<FarmMapData[]> {
    const connection = await mysql.getConnection();
    
    try {
      let query = `
        SELECT 
          f.id,
          f.name,
          f.coordinates,
          f.total_area,
          f.coffee_area,
          f.status,
          f.annual_production,
          f.certification_status,
          cg.full_name as coffee_grower_name
        FROM farms f
        INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
        WHERE f.deleted_at IS NULL AND cg.deleted_at IS NULL 
          AND f.coordinates IS NOT NULL
      `;
      
      const queryParams: any[] = [];
      
      // Aplicar filtros básicos si se proporcionan
      if (filters?.status) {
        query += ` AND f.status = ?`;
        queryParams.push(filters.status);
      }
      
      if (filters?.department) {
        query += ` AND f.department = ?`;
        queryParams.push(filters.department);
      }
      
      if (filters?.certification_status) {
        query += ` AND f.certification_status = ?`;
        queryParams.push(filters.certification_status);
      }
      
      const [rows] = await connection.execute(query, queryParams);
      const farms = rows as any[];
      
      return farms.map(farm => ({
        id: farm.id,
        name: farm.name,
        coordinates: JSON.parse(farm.coordinates),
        coffee_grower_name: farm.coffee_grower_name,
        total_area: farm.total_area,
        coffee_area: farm.coffee_area,
        status: farm.status,
        annual_production: farm.annual_production,
        certification_status: farm.certification_status
      }));
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Cambiar estado de una finca
   */
  static async changeFarmStatus(
    id: number, 
    status: 'active' | 'inactive' | 'maintenance' | 'abandoned',
    adminId: number
  ): Promise<{ success: boolean; message: string }> {
    const connection = await mysql.getConnection();
    
    try {
      // Verificar que la finca existe
      const [existingRows] = await connection.execute(
        'SELECT id, status FROM farms WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        return {
          success: false,
          message: 'Finca no encontrada'
        };
      }
      
      const currentStatus = (existingRows as any[])[0].status;
      if (currentStatus === status) {
        return {
          success: false,
          message: `La finca ya tiene el estado ${status}`
        };
      }
      
      // Actualizar estado
      await connection.execute(
        'UPDATE farms SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [status, adminId, id]
      );
      
      return {
        success: true,
        message: `Estado de la finca actualizado a ${status}`
      };
      
    } finally {
      connection.release();
    }
  }
}
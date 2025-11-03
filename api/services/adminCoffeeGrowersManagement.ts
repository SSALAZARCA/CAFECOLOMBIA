import mysql from '../lib/mysql.js';
import type { 
  CoffeeGrower, 
  CoffeeGrowerCreateRequest, 
  CoffeeGrowerUpdateRequest,
  CoffeeGrowerListFilters,
  CoffeeGrowerListResponse,
  CoffeeGrowerStats,
  Farm
} from '../../shared/types/index.js';

export class AdminCoffeeGrowersManagementService {
  /**
   * Obtener lista de caficultores con filtros
   */
  static async getCoffeeGrowers(filters: CoffeeGrowerListFilters): Promise<CoffeeGrowerListResponse> {
    const connection = await mysql.getConnection();
    
    try {
      let query = `
        SELECT 
          cg.*,
          COUNT(f.id) as farms_count,
          COALESCE(SUM(f.area_hectares), 0) as total_area
        FROM coffee_growers cg
        LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.deleted_at IS NULL
        WHERE cg.deleted_at IS NULL
      `;
      
      const queryParams: any[] = [];
      
      // Aplicar filtros
      if (filters.search) {
        query += ` AND (cg.full_name LIKE ? OR cg.email LIKE ? OR cg.phone LIKE ? OR cg.identification_number LIKE ?)`;
        const searchTerm = `%${filters.search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
      }
      
      if (filters.status) {
        query += ` AND cg.status = ?`;
        queryParams.push(filters.status);
      }
      
      if (filters.department) {
        query += ` AND cg.department = ?`;
        queryParams.push(filters.department);
      }
      
      if (filters.municipality) {
        query += ` AND cg.municipality = ?`;
        queryParams.push(filters.municipality);
      }
      
      if (filters.certification_type) {
        query += ` AND cg.certification_type = ?`;
        queryParams.push(filters.certification_type);
      }
      
      if (filters.date_range?.start && filters.date_range?.end) {
        query += ` AND cg.created_at BETWEEN ? AND ?`;
        queryParams.push(filters.date_range.start, filters.date_range.end);
      }
      
      // Agrupar por caficultor
      query += ` GROUP BY cg.id`;
      
      // Ordenamiento
      const sortBy = filters.sort_by || 'created_at';
      const sortOrder = filters.sort_order || 'desc';
      query += ` ORDER BY cg.${sortBy} ${sortOrder}`;
      
      // Contar total de registros
      const countQuery = `
        SELECT COUNT(DISTINCT cg.id) as total
        FROM coffee_growers cg
        WHERE cg.deleted_at IS NULL
        ${filters.search ? 'AND (cg.full_name LIKE ? OR cg.email LIKE ? OR cg.phone LIKE ? OR cg.identification_number LIKE ?)' : ''}
        ${filters.status ? 'AND cg.status = ?' : ''}
        ${filters.department ? 'AND cg.department = ?' : ''}
        ${filters.municipality ? 'AND cg.municipality = ?' : ''}
        ${filters.certification_type ? 'AND cg.certification_type = ?' : ''}
        ${filters.date_range?.start && filters.date_range?.end ? 'AND cg.created_at BETWEEN ? AND ?' : ''}
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
      const coffeeGrowers = rows as CoffeeGrower[];
      
      return {
        data: coffeeGrowers,
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
   * Obtener caficultor por ID
   */
  static async getCoffeeGrowerById(id: number): Promise<CoffeeGrower | null> {
    const connection = await mysql.getConnection();
    
    try {
      const query = `
        SELECT 
          cg.*,
          COUNT(f.id) as farms_count,
          COALESCE(SUM(f.area_hectares), 0) as total_area
        FROM coffee_growers cg
        LEFT JOIN farms f ON cg.id = f.coffee_grower_id AND f.deleted_at IS NULL
        WHERE cg.id = ? AND cg.deleted_at IS NULL
        GROUP BY cg.id
      `;
      
      const [rows] = await connection.execute(query, [id]);
      const coffeeGrowers = rows as CoffeeGrower[];
      
      return coffeeGrowers.length > 0 ? coffeeGrowers[0] : null;
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Crear nuevo caficultor
   */
  static async createCoffeeGrower(
    data: CoffeeGrowerCreateRequest, 
    adminId: number
  ): Promise<{ success: boolean; message: string; data?: CoffeeGrower }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar si ya existe un caficultor con el mismo número de identificación
      const [existingRows] = await connection.execute(
        'SELECT id FROM coffee_growers WHERE identification_number = ? AND deleted_at IS NULL',
        [data.identification_number]
      );
      
      if ((existingRows as any[]).length > 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Ya existe un caficultor con este número de identificación'
        };
      }
      
      // Verificar si ya existe un caficultor con el mismo email
      if (data.email) {
        const [emailRows] = await connection.execute(
          'SELECT id FROM coffee_growers WHERE email = ? AND deleted_at IS NULL',
          [data.email]
        );
        
        if ((emailRows as any[]).length > 0) {
          await connection.rollback();
          return {
            success: false,
            message: 'Ya existe un caficultor con este email'
          };
        }
      }
      
      // Insertar nuevo caficultor
      const insertQuery = `
        INSERT INTO coffee_growers (
          identification_number, identification_type, full_name, email, phone,
          birth_date, gender, address, department, municipality, rural_zone,
          farm_experience_years, coffee_experience_years, certification_type,
          certification_number, certification_expiry, total_farm_area,
          coffee_area, other_crops, farming_practices, processing_method,
          annual_production, quality_score, preferred_varieties, notes,
          status, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
      `;
      
      const insertValues = [
        data.identification_number,
        data.identification_type,
        data.full_name,
        data.email || null,
        data.phone || null,
        data.birth_date || null,
        data.gender || null,
        data.address || null,
        data.department,
        data.municipality,
        data.rural_zone || null,
        data.farm_experience_years || null,
        data.coffee_experience_years || null,
        data.certification_type || null,
        data.certification_number || null,
        data.certification_expiry || null,
        data.total_farm_area || null,
        data.coffee_area || null,
        data.other_crops || null,
        data.farming_practices || null,
        data.processing_method || null,
        data.annual_production || null,
        data.quality_score || null,
        data.preferred_varieties || null,
        data.notes || null,
        'active',
        adminId
      ];
      
      const [result] = await connection.execute(insertQuery, insertValues);
      const insertId = (result as any).insertId;
      
      await connection.commit();
      
      // Obtener el caficultor creado
      const newCoffeeGrower = await this.getCoffeeGrowerById(insertId);
      
      return {
        success: true,
        message: 'Caficultor creado exitosamente',
        data: newCoffeeGrower!
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Actualizar caficultor
   */
  static async updateCoffeeGrower(
    id: number, 
    data: CoffeeGrowerUpdateRequest, 
    adminId: number
  ): Promise<{ success: boolean; message: string; data?: CoffeeGrower }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el caficultor existe
      const [existingRows] = await connection.execute(
        'SELECT id FROM coffee_growers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Caficultor no encontrado'
        };
      }
      
      // Verificar unicidad del número de identificación si se está actualizando
      if (data.identification_number) {
        const [idRows] = await connection.execute(
          'SELECT id FROM coffee_growers WHERE identification_number = ? AND id != ? AND deleted_at IS NULL',
          [data.identification_number, id]
        );
        
        if ((idRows as any[]).length > 0) {
          await connection.rollback();
          return {
            success: false,
            message: 'Ya existe otro caficultor con este número de identificación'
          };
        }
      }
      
      // Verificar unicidad del email si se está actualizando
      if (data.email) {
        const [emailRows] = await connection.execute(
          'SELECT id FROM coffee_growers WHERE email = ? AND id != ? AND deleted_at IS NULL',
          [data.email, id]
        );
        
        if ((emailRows as any[]).length > 0) {
          await connection.rollback();
          return {
            success: false,
            message: 'Ya existe otro caficultor con este email'
          };
        }
      }
      
      // Construir query de actualización dinámicamente
      const updateFields: string[] = [];
      const updateValues: any[] = [];
      
      const allowedFields = [
        'identification_number', 'identification_type', 'full_name', 'email', 'phone',
        'birth_date', 'gender', 'address', 'department', 'municipality', 'rural_zone',
        'farm_experience_years', 'coffee_experience_years', 'certification_type',
        'certification_number', 'certification_expiry', 'total_farm_area',
        'coffee_area', 'other_crops', 'farming_practices', 'processing_method',
        'annual_production', 'quality_score', 'preferred_varieties', 'notes', 'status'
      ];
      
      for (const field of allowedFields) {
        if (data.hasOwnProperty(field)) {
          updateFields.push(`${field} = ?`);
          updateValues.push((data as any)[field]);
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
        UPDATE coffee_growers 
        SET ${updateFields.join(', ')}
        WHERE id = ?
      `;
      
      await connection.execute(updateQuery, updateValues);
      await connection.commit();
      
      // Obtener el caficultor actualizado
      const updatedCoffeeGrower = await this.getCoffeeGrowerById(id);
      
      return {
        success: true,
        message: 'Caficultor actualizado exitosamente',
        data: updatedCoffeeGrower!
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Eliminar caficultor (soft delete)
   */
  static async deleteCoffeeGrower(
    id: number, 
    adminId: number
  ): Promise<{ success: boolean; message: string }> {
    const connection = await mysql.getConnection();
    
    try {
      await connection.beginTransaction();
      
      // Verificar que el caficultor existe
      const [existingRows] = await connection.execute(
        'SELECT id FROM coffee_growers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        await connection.rollback();
        return {
          success: false,
          message: 'Caficultor no encontrado'
        };
      }
      
      // Verificar si tiene fincas activas
      const [farmsRows] = await connection.execute(
        'SELECT COUNT(*) as count FROM farms WHERE coffee_grower_id = ? AND deleted_at IS NULL',
        [id]
      );
      
      const farmsCount = (farmsRows as any[])[0].count;
      if (farmsCount > 0) {
        await connection.rollback();
        return {
          success: false,
          message: `No se puede eliminar el caficultor porque tiene ${farmsCount} finca(s) activa(s)`
        };
      }
      
      // Soft delete del caficultor
      await connection.execute(
        'UPDATE coffee_growers SET deleted_at = NOW(), deleted_by = ? WHERE id = ?',
        [adminId, id]
      );
      
      await connection.commit();
      
      return {
        success: true,
        message: 'Caficultor eliminado exitosamente'
      };
      
    } catch (error) {
      await connection.rollback();
      throw error;
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener estadísticas de caficultores
   */
  static async getCoffeeGrowerStats(): Promise<CoffeeGrowerStats> {
    const connection = await mysql.getConnection();
    
    try {
      // Estadísticas básicas
      const [basicStats] = await connection.execute(`
        SELECT 
          COUNT(*) as total,
          COUNT(CASE WHEN status = 'active' THEN 1 END) as active,
          COUNT(CASE WHEN status = 'inactive' THEN 1 END) as inactive,
          COUNT(CASE WHEN status = 'suspended' THEN 1 END) as suspended,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_this_month
        FROM coffee_growers 
        WHERE deleted_at IS NULL
      `);
      
      const stats = (basicStats as any[])[0];
      
      // Estadísticas por departamento
      const [deptStats] = await connection.execute(`
        SELECT 
          department,
          COUNT(*) as count
        FROM coffee_growers 
        WHERE deleted_at IS NULL
        GROUP BY department
        ORDER BY count DESC
        LIMIT 10
      `);
      
      // Estadísticas por tipo de certificación
      const [certStats] = await connection.execute(`
        SELECT 
          certification_type,
          COUNT(*) as count
        FROM coffee_growers 
        WHERE deleted_at IS NULL AND certification_type IS NOT NULL
        GROUP BY certification_type
        ORDER BY count DESC
      `);
      
      // Promedio de experiencia
      const [expStats] = await connection.execute(`
        SELECT 
          AVG(farm_experience_years) as avg_farm_experience,
          AVG(coffee_experience_years) as avg_coffee_experience,
          AVG(total_farm_area) as avg_farm_area,
          AVG(coffee_area) as avg_coffee_area,
          AVG(annual_production) as avg_production
        FROM coffee_growers 
        WHERE deleted_at IS NULL
      `);
      
      const averages = (expStats as any[])[0];
      
      // Crecimiento mensual (últimos 12 meses)
      const [growthStats] = await connection.execute(`
        SELECT 
          DATE_FORMAT(created_at, '%Y-%m') as month,
          COUNT(*) as count
        FROM coffee_growers 
        WHERE deleted_at IS NULL 
          AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
        GROUP BY DATE_FORMAT(created_at, '%Y-%m')
        ORDER BY month
      `);
      
      return {
        total: stats.total,
        active: stats.active,
        inactive: stats.inactive,
        suspended: stats.suspended,
        new_this_month: stats.new_this_month,
        by_department: deptStats as any[],
        by_certification: certStats as any[],
        averages: {
          farm_experience_years: Math.round(averages.avg_farm_experience || 0),
          coffee_experience_years: Math.round(averages.avg_coffee_experience || 0),
          total_farm_area: Math.round(averages.avg_farm_area || 0),
          coffee_area: Math.round(averages.avg_coffee_area || 0),
          annual_production: Math.round(averages.avg_production || 0)
        },
        monthly_growth: growthStats as any[]
      };
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Obtener fincas de un caficultor
   */
  static async getCoffeeGrowerFarms(coffeeGrowerId: number): Promise<Farm[]> {
    const connection = await mysql.getConnection();
    
    try {
      const query = `
        SELECT * FROM farms 
        WHERE coffee_grower_id = ? AND deleted_at IS NULL
        ORDER BY created_at DESC
      `;
      
      const [rows] = await connection.execute(query, [coffeeGrowerId]);
      return rows as Farm[];
      
    } finally {
      connection.release();
    }
  }
  
  /**
   * Cambiar estado de un caficultor
   */
  static async changeCoffeeGrowerStatus(
    id: number, 
    status: 'active' | 'inactive' | 'suspended',
    adminId: number
  ): Promise<{ success: boolean; message: string }> {
    const connection = await mysql.getConnection();
    
    try {
      // Verificar que el caficultor existe
      const [existingRows] = await connection.execute(
        'SELECT id, status FROM coffee_growers WHERE id = ? AND deleted_at IS NULL',
        [id]
      );
      
      if ((existingRows as any[]).length === 0) {
        return {
          success: false,
          message: 'Caficultor no encontrado'
        };
      }
      
      const currentStatus = (existingRows as any[])[0].status;
      if (currentStatus === status) {
        return {
          success: false,
          message: `El caficultor ya tiene el estado ${status}`
        };
      }
      
      // Actualizar estado
      await connection.execute(
        'UPDATE coffee_growers SET status = ?, updated_by = ?, updated_at = NOW() WHERE id = ?',
        [status, adminId, id]
      );
      
      return {
        success: true,
        message: `Estado del caficultor actualizado a ${status}`
      };
      
    } finally {
      connection.release();
    }
  }
}
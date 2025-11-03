import bcrypt from 'bcryptjs';
import { executeQuery, executeTransaction } from '../lib/mysql.js';
import type { 
  AdminUser,
  AdminCreateRequest,
  AdminUpdateRequest,
  AdminListFilters,
  AdminListResponse,
  AdminStats
} from '../../shared/types/index.js';

export class AdminUserManagementService {
  private static readonly SALT_ROUNDS = 12;

  /**
   * Obtener lista de administradores con filtros y paginación
   */
  static async getAdmins(filters: AdminListFilters): Promise<AdminListResponse> {
    try {
      const {
        role,
        is_active,
        search,
        page = 1,
        limit = 10,
        sort_by = 'created_at',
        sort_order = 'desc'
      } = filters;

      let whereConditions: string[] = [];
      let queryParams: any[] = [];

      // Filtros
      if (role) {
        whereConditions.push('role = ?');
        queryParams.push(role);
      }

      if (is_active !== undefined) {
        whereConditions.push('is_active = ?');
        queryParams.push(is_active);
      }

      if (search) {
        whereConditions.push('(username LIKE ? OR email LIKE ? OR full_name LIKE ?)');
        const searchTerm = `%${search}%`;
        queryParams.push(searchTerm, searchTerm, searchTerm);
      }

      const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

      // Contar total
      const countQuery = `SELECT COUNT(*) as total FROM admin_users ${whereClause}`;
      const [countRows] = await executeQuery(countQuery, queryParams);
      const total = countRows[0].total;

      // Calcular offset
      const offset = (page - 1) * limit;

      // Consulta principal
      const query = `
        SELECT id, username, email, full_name, role, is_active, last_login, 
               failed_login_attempts, locked_until, two_factor_enabled, created_at, updated_at
        FROM admin_users 
        ${whereClause}
        ORDER BY ${sort_by} ${sort_order.toUpperCase()}
        LIMIT ? OFFSET ?
      `;

      const [adminRows] = await executeQuery(query, [...queryParams, limit, offset]);

      return {
        admins: adminRows as AdminUser[],
        total,
        page,
        limit,
        total_pages: Math.ceil(total / limit)
      };

    } catch (error) {
      console.error('Error obteniendo administradores:', error);
      throw new Error('Error obteniendo lista de administradores');
    }
  }

  /**
   * Obtener administrador por ID
   */
  static async getAdminById(id: number): Promise<AdminUser | null> {
    try {
      const query = `
        SELECT id, username, email, full_name, role, is_active, last_login, 
               failed_login_attempts, locked_until, two_factor_enabled, created_at, updated_at
        FROM admin_users 
        WHERE id = ?
      `;

      const [rows] = await executeQuery(query, [id]);
      return rows.length > 0 ? rows[0] as AdminUser : null;

    } catch (error) {
      console.error('Error obteniendo administrador:', error);
      throw new Error('Error obteniendo administrador');
    }
  }

  /**
   * Crear nuevo administrador
   */
  static async createAdmin(adminData: AdminCreateRequest, createdBy: number): Promise<{ success: boolean; admin?: AdminUser; message: string }> {
    try {
      // Verificar si el username o email ya existen
      const existsQuery = 'SELECT id FROM admin_users WHERE username = ? OR email = ?';
      const [existsRows] = await executeQuery(existsQuery, [adminData.username, adminData.email]);

      if (existsRows.length > 0) {
        return {
          success: false,
          message: 'El nombre de usuario o email ya están en uso'
        };
      }

      // Hashear contraseña
      const hashedPassword = await bcrypt.hash(adminData.password, this.SALT_ROUNDS);

      // Crear administrador
      const insertQuery = `
        INSERT INTO admin_users (username, email, password_hash, full_name, role, is_active, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, true, NOW(), NOW())
      `;

      const [result] = await executeQuery(insertQuery, [
        adminData.username,
        adminData.email,
        hashedPassword,
        adminData.full_name,
        adminData.role
      ]);

      const adminId = (result as any).insertId;

      // Obtener el administrador creado
      const newAdmin = await this.getAdminById(adminId);

      return {
        success: true,
        admin: newAdmin!,
        message: 'Administrador creado correctamente'
      };

    } catch (error) {
      console.error('Error creando administrador:', error);
      return {
        success: false,
        message: 'Error creando administrador'
      };
    }
  }

  /**
   * Actualizar administrador
   */
  static async updateAdmin(id: number, updateData: AdminUpdateRequest, updatedBy: number): Promise<{ success: boolean; admin?: AdminUser; message: string }> {
    try {
      const updates: string[] = [];
      const params: any[] = [];

      // Construir query de actualización dinámicamente
      if (updateData.username !== undefined) {
        // Verificar que el username no esté en uso por otro admin
        const existsQuery = 'SELECT id FROM admin_users WHERE username = ? AND id != ?';
        const [existsRows] = await executeQuery(existsQuery, [updateData.username, id]);
        
        if (existsRows.length > 0) {
          return {
            success: false,
            message: 'El nombre de usuario ya está en uso'
          };
        }

        updates.push('username = ?');
        params.push(updateData.username);
      }

      if (updateData.email !== undefined) {
        // Verificar que el email no esté en uso por otro admin
        const existsQuery = 'SELECT id FROM admin_users WHERE email = ? AND id != ?';
        const [existsRows] = await executeQuery(existsQuery, [updateData.email, id]);
        
        if (existsRows.length > 0) {
          return {
            success: false,
            message: 'El email ya está en uso'
          };
        }

        updates.push('email = ?');
        params.push(updateData.email);
      }

      if (updateData.full_name !== undefined) {
        updates.push('full_name = ?');
        params.push(updateData.full_name);
      }

      if (updateData.role !== undefined) {
        updates.push('role = ?');
        params.push(updateData.role);
      }

      if (updateData.is_active !== undefined) {
        updates.push('is_active = ?');
        params.push(updateData.is_active);
      }

      if (updateData.two_factor_enabled !== undefined) {
        updates.push('two_factor_enabled = ?');
        params.push(updateData.two_factor_enabled);
        
        // Si se desactiva 2FA, limpiar el secreto
        if (!updateData.two_factor_enabled) {
          updates.push('two_factor_secret = NULL');
        }
      }

      if (updates.length === 0) {
        return {
          success: false,
          message: 'No hay datos para actualizar'
        };
      }

      updates.push('updated_at = NOW()');
      params.push(id);

      const updateQuery = `UPDATE admin_users SET ${updates.join(', ')} WHERE id = ?`;
      await executeQuery(updateQuery, params);

      // Obtener el administrador actualizado
      const updatedAdmin = await this.getAdminById(id);

      return {
        success: true,
        admin: updatedAdmin!,
        message: 'Administrador actualizado correctamente'
      };

    } catch (error) {
      console.error('Error actualizando administrador:', error);
      return {
        success: false,
        message: 'Error actualizando administrador'
      };
    }
  }

  /**
   * Eliminar administrador (soft delete)
   */
  static async deleteAdmin(id: number, deletedBy: number): Promise<{ success: boolean; message: string }> {
    try {
      // Verificar que no sea el último super admin
      const superAdminQuery = 'SELECT COUNT(*) as count FROM admin_users WHERE role = "super_admin" AND is_active = true AND id != ?';
      const [superAdminRows] = await executeQuery(superAdminQuery, [id]);
      
      const adminToDelete = await this.getAdminById(id);
      if (adminToDelete?.role === 'super_admin' && superAdminRows[0].count === 0) {
        return {
          success: false,
          message: 'No se puede eliminar el último super administrador'
        };
      }

      // Desactivar administrador
      await executeQuery('UPDATE admin_users SET is_active = false, updated_at = NOW() WHERE id = ?', [id]);

      // Invalidar todas las sesiones activas
      await executeQuery('UPDATE admin_sessions SET is_active = false WHERE admin_id = ?', [id]);

      return {
        success: true,
        message: 'Administrador eliminado correctamente'
      };

    } catch (error) {
      console.error('Error eliminando administrador:', error);
      return {
        success: false,
        message: 'Error eliminando administrador'
      };
    }
  }

  /**
   * Desbloquear administrador
   */
  static async unlockAdmin(id: number, unlockedBy: number): Promise<{ success: boolean; message: string }> {
    try {
      await executeQuery(`
        UPDATE admin_users 
        SET failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
        WHERE id = ?
      `, [id]);

      return {
        success: true,
        message: 'Administrador desbloqueado correctamente'
      };

    } catch (error) {
      console.error('Error desbloqueando administrador:', error);
      return {
        success: false,
        message: 'Error desbloqueando administrador'
      };
    }
  }

  /**
   * Resetear contraseña de administrador
   */
  static async resetPassword(id: number, newPassword: string, resetBy: number): Promise<{ success: boolean; message: string }> {
    try {
      const hashedPassword = await bcrypt.hash(newPassword, this.SALT_ROUNDS);

      await executeQuery(`
        UPDATE admin_users 
        SET password_hash = ?, failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
        WHERE id = ?
      `, [hashedPassword, id]);

      // Invalidar todas las sesiones activas
      await executeQuery('UPDATE admin_sessions SET is_active = false WHERE admin_id = ?', [id]);

      return {
        success: true,
        message: 'Contraseña restablecida correctamente'
      };

    } catch (error) {
      console.error('Error restableciendo contraseña:', error);
      return {
        success: false,
        message: 'Error restableciendo contraseña'
      };
    }
  }

  /**
   * Obtener estadísticas de administradores
   */
  static async getAdminStats(): Promise<AdminStats> {
    try {
      const statsQuery = `
        SELECT 
          COUNT(*) as total_admins,
          SUM(CASE WHEN is_active = true THEN 1 ELSE 0 END) as active_admins,
          SUM(CASE WHEN role = 'super_admin' AND is_active = true THEN 1 ELSE 0 END) as super_admins,
          SUM(CASE WHEN role = 'admin' AND is_active = true THEN 1 ELSE 0 END) as admins,
          SUM(CASE WHEN role = 'moderator' AND is_active = true THEN 1 ELSE 0 END) as moderators,
          SUM(CASE WHEN last_login >= DATE_SUB(NOW(), INTERVAL 7 DAY) THEN 1 ELSE 0 END) as recent_logins,
          SUM(CASE WHEN locked_until > NOW() THEN 1 ELSE 0 END) as locked_accounts
        FROM admin_users
      `;

      const [statsRows] = await executeQuery(statsQuery, []);
      return statsRows[0] as AdminStats;

    } catch (error) {
      console.error('Error obteniendo estadísticas de administradores:', error);
      throw new Error('Error obteniendo estadísticas');
    }
  }

  /**
   * Obtener sesiones activas de un administrador
   */
  static async getAdminSessions(adminId: number): Promise<any[]> {
    try {
      const query = `
        SELECT id, token, ip_address, user_agent, created_at, expires_at, is_active
        FROM admin_sessions 
        WHERE admin_id = ? AND is_active = true
        ORDER BY created_at DESC
      `;

      const [rows] = await executeQuery(query, [adminId]);
      return rows;

    } catch (error) {
      console.error('Error obteniendo sesiones del administrador:', error);
      throw new Error('Error obteniendo sesiones');
    }
  }

  /**
   * Invalidar sesión específica
   */
  static async invalidateSession(sessionId: string, adminId: number): Promise<{ success: boolean; message: string }> {
    try {
      await executeQuery(`
        UPDATE admin_sessions 
        SET is_active = false, updated_at = NOW()
        WHERE id = ? AND admin_id = ?
      `, [sessionId, adminId]);

      return {
        success: true,
        message: 'Sesión invalidada correctamente'
      };

    } catch (error) {
      console.error('Error invalidando sesión:', error);
      return {
        success: false,
        message: 'Error invalidando sesión'
      };
    }
  }
}
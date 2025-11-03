import express from 'express';
import { AdminAuthService } from '../../services/adminAuth.js';
import { authenticateAdmin, rateLimitAdmin, logAdminActivity } from '../../middleware/adminAuth.js';
import type { 
  AdminLoginRequest, 
  AdminPasswordChangeRequest 
} from '../../../shared/types/index.js';

const router = express.Router();

/**
 * POST /api/admin/auth/login
 * Iniciar sesión de administrador
 */
router.post('/login', rateLimitAdmin(5, 15 * 60 * 1000), async (req, res) => {
  try {
    const loginData: AdminLoginRequest = req.body;
    const ipAddress = req.ip || req.connection.remoteAddress;
    const userAgent = req.get('User-Agent');

    // Validar datos requeridos
    if (!loginData.username || !loginData.password) {
      return res.status(400).json({
        success: false,
        message: 'Usuario y contraseña son requeridos'
      });
    }

    const result = await AdminAuthService.login(loginData, ipAddress, userAgent);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error en login de administrador:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/auth/refresh
 * Refrescar token de acceso
 */
router.post('/refresh', async (req, res) => {
  try {
    const { refresh_token } = req.body;

    if (!refresh_token) {
      return res.status(400).json({
        success: false,
        message: 'Refresh token requerido'
      });
    }

    const result = await AdminAuthService.refreshToken(refresh_token);

    if (!result.success) {
      return res.status(401).json(result);
    }

    res.json(result);
  } catch (error) {
    console.error('Error al refrescar token:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/auth/logout
 * Cerrar sesión de administrador
 */
router.post('/logout', authenticateAdmin, logAdminActivity('LOGOUT', 'session'), async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.substring(7);

    if (!token) {
      return res.status(400).json({
        success: false,
        message: 'Token requerido'
      });
    }

    const result = await AdminAuthService.logout(token);
    res.json(result);
  } catch (error) {
    console.error('Error al cerrar sesión:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * GET /api/admin/auth/me
 * Obtener información del administrador autenticado
 */
router.get('/me', authenticateAdmin, async (req, res) => {
  try {
    if (!req.admin) {
      return res.status(401).json({
        success: false,
        message: 'No autenticado'
      });
    }

    // Remover datos sensibles
    const { password_hash, two_factor_secret, ...safeAdmin } = req.admin;

    res.json({
      success: true,
      data: safeAdmin
    });
  } catch (error) {
    console.error('Error obteniendo información del admin:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

/**
 * POST /api/admin/auth/change-password
 * Cambiar contraseña del administrador
 */
router.post('/change-password', 
  authenticateAdmin, 
  logAdminActivity('PASSWORD_CHANGE', 'admin_user'),
  async (req, res) => {
    try {
      const passwordData: AdminPasswordChangeRequest = req.body;

      // Validar datos requeridos
      if (!passwordData.current_password || !passwordData.new_password || !passwordData.confirm_password) {
        return res.status(400).json({
          success: false,
          message: 'Todos los campos son requeridos'
        });
      }

      // Validar longitud de contraseña
      if (passwordData.new_password.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'La nueva contraseña debe tener al menos 8 caracteres'
        });
      }

      const result = await AdminAuthService.changePassword(req.admin!.id, passwordData);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error al cambiar contraseña:', error);
      res.status(500).json({
        success: false,
        message: 'Error interno del servidor'
      });
    }
  }
);

/**
 * POST /api/admin/auth/setup-2fa
 * Configurar autenticación de dos factores
 */
router.post('/setup-2fa', authenticateAdmin, async (req, res) => {
  try {
    const result = await AdminAuthService.setup2FA(req.admin!.id);
    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error configurando 2FA:', error);
    res.status(500).json({
      success: false,
      message: 'Error configurando autenticación de dos factores'
    });
  }
});

/**
 * POST /api/admin/auth/verify-2fa
 * Verificar y activar autenticación de dos factores
 */
router.post('/verify-2fa', 
  authenticateAdmin, 
  logAdminActivity('PERMISSION_CHANGE', 'admin_user'),
  async (req, res) => {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Código de verificación requerido'
        });
      }

      const result = await AdminAuthService.verify2FA(req.admin!.id, token);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error verificando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error verificando código'
      });
    }
  }
);

/**
 * POST /api/admin/auth/disable-2fa
 * Desactivar autenticación de dos factores
 */
router.post('/disable-2fa', 
  authenticateAdmin, 
  logAdminActivity('PERMISSION_CHANGE', 'admin_user'),
  async (req, res) => {
    try {
      const { password } = req.body;

      if (!password) {
        return res.status(400).json({
          success: false,
          message: 'Contraseña requerida'
        });
      }

      const result = await AdminAuthService.disable2FA(req.admin!.id, password);

      if (!result.success) {
        return res.status(400).json(result);
      }

      res.json(result);
    } catch (error) {
      console.error('Error desactivando 2FA:', error);
      res.status(500).json({
        success: false,
        message: 'Error desactivando 2FA'
      });
    }
  }
);

export default router;
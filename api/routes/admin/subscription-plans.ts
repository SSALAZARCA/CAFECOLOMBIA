import express from 'express';
import { pool } from '../../config/database';
import { RowDataPacket, ResultSetHeader } from 'mysql2';
import { authenticateAdmin, requireRole } from '../../middleware/auth';

const router = express.Router();

// GET /api/admin/subscription-plans - Obtener todos los planes
router.get('/', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const [plans] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        sp.*,
        COUNT(s.id) as active_subscriptions
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
      GROUP BY sp.id
      ORDER BY sp.display_order ASC, sp.created_at DESC`
    );

    res.json({
      success: true,
      data: plans
    });
  } catch (error) {
    console.error('Error obteniendo planes:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// GET /api/admin/subscription-plans/:id - Obtener plan específico
router.get('/:id', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    const [plans] = await pool.execute<RowDataPacket[]>(
      `SELECT 
        sp.*,
        COUNT(s.id) as active_subscriptions
      FROM subscription_plans sp
      LEFT JOIN subscriptions s ON sp.id = s.plan_id AND s.status = 'active'
      WHERE sp.id = ?
      GROUP BY sp.id`,
      [id]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    res.json({
      success: true,
      data: plans[0]
    });
  } catch (error) {
    console.error('Error obteniendo plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/subscription-plans - Crear nuevo plan
router.post('/', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const {
      name,
      description,
      price,
      currency_code = 'COP',
      billing_cycle,
      billing_period = 1,
      features = [],
      is_active = true,
      is_featured = false,
      display_order = 0,
      trial_days = 0,
      max_users = null,
      max_storage_gb = null,
      metadata = {}
    } = req.body;

    // Validaciones
    if (!name || !description || !price || !billing_cycle) {
      return res.status(400).json({
        success: false,
        message: 'Campos requeridos: name, description, price, billing_cycle'
      });
    }

    if (!['monthly', 'yearly', 'weekly', 'daily'].includes(billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'billing_cycle debe ser: monthly, yearly, weekly, o daily'
      });
    }

    if (price < 0 || billing_period < 1) {
      return res.status(400).json({
        success: false,
        message: 'price debe ser >= 0 y billing_period >= 1'
      });
    }

    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO subscription_plans (
        name, description, price, currency_code, billing_cycle, billing_period,
        features, is_active, is_featured, display_order, trial_days,
        max_users, max_storage_gb, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        name, description, price, currency_code, billing_cycle, billing_period,
        JSON.stringify(features), is_active, is_featured, display_order, trial_days,
        max_users, max_storage_gb, JSON.stringify(metadata)
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Plan creado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error creando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// PUT /api/admin/subscription-plans/:id - Actualizar plan
router.put('/:id', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      price,
      currency_code,
      billing_cycle,
      billing_period,
      features,
      is_active,
      is_featured,
      display_order,
      trial_days,
      max_users,
      max_storage_gb,
      metadata
    } = req.body;

    // Verificar que el plan existe
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Validaciones
    if (billing_cycle && !['monthly', 'yearly', 'weekly', 'daily'].includes(billing_cycle)) {
      return res.status(400).json({
        success: false,
        message: 'billing_cycle debe ser: monthly, yearly, weekly, o daily'
      });
    }

    if ((price !== undefined && price < 0) || (billing_period !== undefined && billing_period < 1)) {
      return res.status(400).json({
        success: false,
        message: 'price debe ser >= 0 y billing_period >= 1'
      });
    }

    // Construir query dinámico
    const updates = [];
    const values = [];

    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (price !== undefined) { updates.push('price = ?'); values.push(price); }
    if (currency_code !== undefined) { updates.push('currency_code = ?'); values.push(currency_code); }
    if (billing_cycle !== undefined) { updates.push('billing_cycle = ?'); values.push(billing_cycle); }
    if (billing_period !== undefined) { updates.push('billing_period = ?'); values.push(billing_period); }
    if (features !== undefined) { updates.push('features = ?'); values.push(JSON.stringify(features)); }
    if (is_active !== undefined) { updates.push('is_active = ?'); values.push(is_active); }
    if (is_featured !== undefined) { updates.push('is_featured = ?'); values.push(is_featured); }
    if (display_order !== undefined) { updates.push('display_order = ?'); values.push(display_order); }
    if (trial_days !== undefined) { updates.push('trial_days = ?'); values.push(trial_days); }
    if (max_users !== undefined) { updates.push('max_users = ?'); values.push(max_users); }
    if (max_storage_gb !== undefined) { updates.push('max_storage_gb = ?'); values.push(max_storage_gb); }
    if (metadata !== undefined) { updates.push('metadata = ?'); values.push(JSON.stringify(metadata)); }

    if (updates.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos para actualizar'
      });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await pool.execute(
      `UPDATE subscription_plans SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({
      success: true,
      message: 'Plan actualizado exitosamente'
    });
  } catch (error) {
    console.error('Error actualizando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// DELETE /api/admin/subscription-plans/:id - Eliminar plan
router.delete('/:id', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el plan existe
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    // Verificar si hay suscripciones activas
    const [activeSubscriptions] = await pool.execute<RowDataPacket[]>(
      'SELECT COUNT(*) as count FROM subscriptions WHERE plan_id = ? AND status = "active"',
      [id]
    );

    if (activeSubscriptions[0].count > 0) {
      return res.status(400).json({
        success: false,
        message: 'No se puede eliminar un plan con suscripciones activas'
      });
    }

    await pool.execute('DELETE FROM subscription_plans WHERE id = ?', [id]);

    res.json({
      success: true,
      message: 'Plan eliminado exitosamente'
    });
  } catch (error) {
    console.error('Error eliminando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/subscription-plans/:id/toggle-status - Activar/desactivar plan
router.post('/:id/toggle-status', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Verificar que el plan existe
    const [existing] = await pool.execute<RowDataPacket[]>(
      'SELECT id, is_active FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (existing.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    const newStatus = !existing[0].is_active;

    await pool.execute(
      'UPDATE subscription_plans SET is_active = ?, updated_at = NOW() WHERE id = ?',
      [newStatus, id]
    );

    res.json({
      success: true,
      message: `Plan ${newStatus ? 'activado' : 'desactivado'} exitosamente`,
      data: { is_active: newStatus }
    });
  } catch (error) {
    console.error('Error cambiando estado del plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/subscription-plans/:id/duplicate - Duplicar plan
router.post('/:id/duplicate', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { id } = req.params;

    // Obtener el plan original
    const [plans] = await pool.execute<RowDataPacket[]>(
      'SELECT * FROM subscription_plans WHERE id = ?',
      [id]
    );

    if (plans.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Plan no encontrado'
      });
    }

    const originalPlan = plans[0];

    // Crear copia
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO subscription_plans (
        name, description, price, currency_code, billing_cycle, billing_period,
        features, is_active, is_featured, display_order, trial_days,
        max_users, max_storage_gb, metadata, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        `${originalPlan.name} (Copia)`,
        originalPlan.description,
        originalPlan.price,
        originalPlan.currency_code,
        originalPlan.billing_cycle,
        originalPlan.billing_period,
        originalPlan.features,
        false, // Desactivado por defecto
        false, // No destacado por defecto
        originalPlan.display_order + 1,
        originalPlan.trial_days,
        originalPlan.max_users,
        originalPlan.max_storage_gb,
        originalPlan.metadata
      ]
    );

    res.status(201).json({
      success: true,
      message: 'Plan duplicado exitosamente',
      data: { id: result.insertId }
    });
  } catch (error) {
    console.error('Error duplicando plan:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

// POST /api/admin/subscription-plans/bulk-update - Actualización masiva
router.post('/bulk-update', authenticateAdmin, requireRole(['admin', 'super_admin']), async (req, res) => {
  try {
    const { plan_ids, updates } = req.body;

    if (!plan_ids || !Array.isArray(plan_ids) || plan_ids.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'plan_ids debe ser un array no vacío'
      });
    }

    if (!updates || typeof updates !== 'object') {
      return res.status(400).json({
        success: false,
        message: 'updates debe ser un objeto'
      });
    }

    // Construir query dinámico
    const updateFields = [];
    const values = [];

    if (updates.is_active !== undefined) { updateFields.push('is_active = ?'); values.push(updates.is_active); }
    if (updates.is_featured !== undefined) { updateFields.push('is_featured = ?'); values.push(updates.is_featured); }
    if (updates.display_order !== undefined) { updateFields.push('display_order = ?'); values.push(updates.display_order); }

    if (updateFields.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No hay campos válidos para actualizar'
      });
    }

    updateFields.push('updated_at = NOW()');

    const placeholders = plan_ids.map(() => '?').join(',');
    values.push(...plan_ids);

    const [result] = await pool.execute<ResultSetHeader>(
      `UPDATE subscription_plans SET ${updateFields.join(', ')} WHERE id IN (${placeholders})`,
      values
    );

    res.json({
      success: true,
      message: `${result.affectedRows} planes actualizados exitosamente`
    });
  } catch (error) {
    console.error('Error en actualización masiva:', error);
    res.status(500).json({
      success: false,
      message: 'Error interno del servidor'
    });
  }
});

export default router;
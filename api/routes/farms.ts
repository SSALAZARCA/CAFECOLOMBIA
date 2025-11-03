import express from 'express';
import { executeQuery, executeTransaction } from '../config/database.js';
import { asyncHandler, createError } from '../middleware/errorHandler.js';
import { authenticateToken, requirePermission, AuthRequest } from '../middleware/auth.js';

const router = express.Router();

// Aplicar autenticación a todas las rutas
router.use(authenticateToken);

// Obtener lista de fincas con filtros y paginación
router.get('/', requirePermission('farms.view'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    page = 1,
    limit = 10,
    search = '',
    status = 'all',
    region = '',
    coffeeGrowerId = '',
    minArea = '',
    maxArea = '',
    sortBy = 'created_at',
    sortOrder = 'desc'
  } = req.query;

  const offset = (Number(page) - 1) * Number(limit);
  
  // Construir condiciones WHERE
  let whereConditions = ['1=1'];
  const queryParams: any[] = [];

  if (search) {
    whereConditions.push(`(
      f.name LIKE ? OR 
      f.coffee_varieties LIKE ? OR
      CONCAT(cg.first_name, ' ', cg.last_name) LIKE ?
    )`);
    const searchTerm = `%${search}%`;
    queryParams.push(searchTerm, searchTerm, searchTerm);
  }

  if (status !== 'all') {
    whereConditions.push('f.is_active = ?');
    queryParams.push(status === 'active');
  }

  if (region) {
    whereConditions.push('cg.region = ?');
    queryParams.push(region);
  }

  if (coffeeGrowerId) {
    whereConditions.push('f.coffee_grower_id = ?');
    queryParams.push(coffeeGrowerId);
  }

  if (minArea) {
    whereConditions.push('f.area_hectares >= ?');
    queryParams.push(Number(minArea));
  }

  if (maxArea) {
    whereConditions.push('f.area_hectares <= ?');
    queryParams.push(Number(maxArea));
  }

  const whereClause = whereConditions.join(' AND ');
  
  // Validar campos de ordenamiento
  const validSortFields = ['created_at', 'name', 'area_hectares', 'altitude_meters', 'production_capacity_kg'];
  const validSortOrders = ['asc', 'desc'];
  
  const finalSortBy = validSortFields.includes(sortBy as string) ? sortBy : 'created_at';
  const finalSortOrder = validSortOrders.includes(sortOrder as string) ? sortOrder : 'desc';

  try {
    // Obtener fincas con información del caficultor
    const farmsQuery = `
      SELECT 
        f.id,
        f.name,
        f.area_hectares,
        f.altitude_meters,
        f.latitude,
        f.longitude,
        f.coffee_varieties,
        f.production_capacity_kg,
        f.harvest_season,
        f.is_active,
        f.created_at,
        f.updated_at,
        cg.id as grower_id,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.email as grower_email,
        cg.region as grower_region
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE ${whereClause}
      ORDER BY f.${finalSortBy} ${finalSortOrder}
      LIMIT ? OFFSET ?
    `;

    // Obtener total de registros para paginación
    const countQuery = `
      SELECT COUNT(f.id) as total
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE ${whereClause}
    `;

    const [farms, countResult] = await Promise.all([
      executeQuery(farmsQuery, [...queryParams, Number(limit), offset]),
      executeQuery(countQuery, queryParams)
    ]);

    const total = (countResult as any[])[0]?.total || 0;
    const totalPages = Math.ceil(total / Number(limit));

    res.json({
      farms,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages,
        hasNext: Number(page) < totalPages,
        hasPrev: Number(page) > 1
      }
    });

  } catch (error) {
    console.error('Error obteniendo fincas:', error);
    throw createError('Error obteniendo lista de fincas', 500);
  }
}));

// Obtener finca específica
router.get('/:id', requirePermission('farms.view'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    const [farmResult] = await Promise.all([
      // Información completa de la finca
      executeQuery(`
        SELECT 
          f.*,
          cg.id as grower_id,
          cg.first_name as grower_first_name,
          cg.last_name as grower_last_name,
          cg.email as grower_email,
          cg.phone as grower_phone,
          cg.region as grower_region,
          cg.municipality as grower_municipality
        FROM farms f
        INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
        WHERE f.id = ?
      `, [id])
    ]);

    const farm = (farmResult as any[])[0];
    if (!farm) {
      throw createError('Finca no encontrada', 404);
    }

    res.json({ farm });

  } catch (error) {
    console.error('Error obteniendo finca:', error);
    throw createError('Error obteniendo información de la finca', 500);
  }
}));

// Crear nueva finca
router.post('/', requirePermission('farms.create'), asyncHandler(async (req: AuthRequest, res) => {
  const {
    name,
    coffeeGrowerId,
    areaHectares,
    altitudeMeters,
    latitude,
    longitude,
    coffeeVarieties,
    productionCapacityKg,
    harvestSeason,
    soilType,
    irrigationSystem,
    certifications,
    notes
  } = req.body;

  // Validaciones básicas
  if (!name || !coffeeGrowerId || !areaHectares) {
    throw createError('Nombre, caficultor y área son requeridos', 400);
  }

  if (areaHectares <= 0) {
    throw createError('El área debe ser mayor a 0', 400);
  }

  if (latitude && (latitude < -90 || latitude > 90)) {
    throw createError('Latitud inválida', 400);
  }

  if (longitude && (longitude < -180 || longitude > 180)) {
    throw createError('Longitud inválida', 400);
  }

  try {
    // Verificar que el caficultor existe y está activo
    const [growerExists] = await executeQuery(
      'SELECT id, first_name, last_name FROM coffee_growers WHERE id = ? AND is_active = true',
      [coffeeGrowerId]
    ) as any[];

    if (!growerExists || growerExists.length === 0) {
      throw createError('Caficultor no encontrado o inactivo', 404);
    }

    // Verificar que no existe otra finca con el mismo nombre para el mismo caficultor
    const [existingFarm] = await executeQuery(
      'SELECT id FROM farms WHERE name = ? AND coffee_grower_id = ?',
      [name, coffeeGrowerId]
    ) as any[];

    if (existingFarm && existingFarm.length > 0) {
      throw createError('Ya existe una finca con este nombre para el caficultor', 409);
    }

    // Crear finca
    const result = await executeQuery(`
      INSERT INTO farms (
        name, coffee_grower_id, area_hectares, altitude_meters, latitude, longitude,
        coffee_varieties, production_capacity_kg, harvest_season, soil_type,
        irrigation_system, certifications, notes, is_active, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, true, NOW(), NOW())
    `, [
      name, coffeeGrowerId, areaHectares, altitudeMeters, latitude, longitude,
      JSON.stringify(coffeeVarieties), productionCapacityKg, harvestSeason,
      soilType, irrigationSystem, JSON.stringify(certifications), notes
    ]);

    const farmId = (result as any).insertId;

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'create', 'farm', ?, ?, ?)
    `, [
      req.user!.id,
      farmId,
      JSON.stringify({ 
        name, 
        coffeeGrowerId, 
        growerName: `${growerExists[0].first_name} ${growerExists[0].last_name}`,
        areaHectares 
      }),
      req.ip
    ]);

    // Obtener la finca creada con información del caficultor
    const [newFarm] = await executeQuery(`
      SELECT 
        f.id, f.name, f.area_hectares, f.altitude_meters, f.is_active, f.created_at,
        cg.first_name as grower_first_name, cg.last_name as grower_last_name
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE f.id = ?
    `, [farmId]) as any[];

    res.status(201).json({
      message: 'Finca creada exitosamente',
      farm: newFarm[0]
    });

  } catch (error) {
    console.error('Error creando finca:', error);
    throw createError('Error creando finca', 500);
  }
}));

// Actualizar finca
router.put('/:id', requirePermission('farms.edit'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;
  const {
    name,
    areaHectares,
    altitudeMeters,
    latitude,
    longitude,
    coffeeVarieties,
    productionCapacityKg,
    harvestSeason,
    soilType,
    irrigationSystem,
    certifications,
    notes,
    isActive
  } = req.body;

  try {
    // Verificar que la finca existe
    const [existingFarm] = await executeQuery(
      'SELECT id, name, coffee_grower_id FROM farms WHERE id = ?',
      [id]
    ) as any[];

    if (!existingFarm || existingFarm.length === 0) {
      throw createError('Finca no encontrada', 404);
    }

    // Validaciones
    if (areaHectares && areaHectares <= 0) {
      throw createError('El área debe ser mayor a 0', 400);
    }

    if (latitude && (latitude < -90 || latitude > 90)) {
      throw createError('Latitud inválida', 400);
    }

    if (longitude && (longitude < -180 || longitude > 180)) {
      throw createError('Longitud inválida', 400);
    }

    // Verificar que no existe otra finca con el mismo nombre para el mismo caficultor
    if (name && name !== existingFarm[0].name) {
      const [nameExists] = await executeQuery(
        'SELECT id FROM farms WHERE name = ? AND coffee_grower_id = ? AND id != ?',
        [name, existingFarm[0].coffee_grower_id, id]
      ) as any[];

      if (nameExists && nameExists.length > 0) {
        throw createError('Ya existe otra finca con este nombre para el caficultor', 409);
      }
    }

    // Actualizar finca
    await executeQuery(`
      UPDATE farms SET
        name = COALESCE(?, name),
        area_hectares = COALESCE(?, area_hectares),
        altitude_meters = COALESCE(?, altitude_meters),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        coffee_varieties = COALESCE(?, coffee_varieties),
        production_capacity_kg = COALESCE(?, production_capacity_kg),
        harvest_season = COALESCE(?, harvest_season),
        soil_type = COALESCE(?, soil_type),
        irrigation_system = COALESCE(?, irrigation_system),
        certifications = COALESCE(?, certifications),
        notes = COALESCE(?, notes),
        is_active = COALESCE(?, is_active),
        updated_at = NOW()
      WHERE id = ?
    `, [
      name, areaHectares, altitudeMeters, latitude, longitude,
      coffeeVarieties ? JSON.stringify(coffeeVarieties) : null,
      productionCapacityKg, harvestSeason, soilType, irrigationSystem,
      certifications ? JSON.stringify(certifications) : null,
      notes, isActive, id
    ]);

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'update', 'farm', ?, ?, ?)
    `, [
      req.user!.id,
      id,
      JSON.stringify({ updatedFields: Object.keys(req.body) }),
      req.ip
    ]);

    // Obtener finca actualizada
    const [updatedFarm] = await executeQuery(`
      SELECT 
        f.id, f.name, f.area_hectares, f.altitude_meters, f.is_active, f.updated_at,
        cg.first_name as grower_first_name, cg.last_name as grower_last_name
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE f.id = ?
    `, [id]) as any[];

    res.json({
      message: 'Finca actualizada exitosamente',
      farm: updatedFarm[0]
    });

  } catch (error) {
    console.error('Error actualizando finca:', error);
    throw createError('Error actualizando finca', 500);
  }
}));

// Eliminar finca (soft delete)
router.delete('/:id', requirePermission('farms.delete'), asyncHandler(async (req: AuthRequest, res) => {
  const { id } = req.params;

  try {
    // Verificar que la finca existe
    const [existingFarm] = await executeQuery(`
      SELECT f.id, f.name, cg.first_name, cg.last_name
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE f.id = ?
    `, [id]) as any[];

    if (!existingFarm || existingFarm.length === 0) {
      throw createError('Finca no encontrada', 404);
    }

    const farm = existingFarm[0];

    // Realizar soft delete
    await executeQuery(
      'UPDATE farms SET is_active = false, updated_at = NOW() WHERE id = ?',
      [id]
    );

    // Log de auditoría
    await executeQuery(`
      INSERT INTO audit_logs (user_id, action, resource_type, resource_id, details, ip_address)
      VALUES (?, 'delete', 'farm', ?, ?, ?)
    `, [
      req.user!.id,
      id,
      JSON.stringify({ 
        name: farm.name,
        growerName: `${farm.first_name} ${farm.last_name}`
      }),
      req.ip
    ]);

    res.json({
      message: 'Finca eliminada exitosamente'
    });

  } catch (error) {
    console.error('Error eliminando finca:', error);
    throw createError('Error eliminando finca', 500);
  }
}));

// Estadísticas de fincas
router.get('/stats/overview', requirePermission('farms.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [stats] = await Promise.all([
      executeQuery(`
        SELECT 
          COUNT(*) as total_farms,
          COUNT(CASE WHEN is_active = true THEN 1 END) as active_farms,
          COUNT(CASE WHEN is_active = false THEN 1 END) as inactive_farms,
          COUNT(CASE WHEN created_at >= DATE_SUB(NOW(), INTERVAL 30 DAY) THEN 1 END) as new_farms_month,
          COALESCE(AVG(area_hectares), 0) as avg_area,
          COALESCE(SUM(area_hectares), 0) as total_area,
          COALESCE(AVG(altitude_meters), 0) as avg_altitude,
          COALESCE(SUM(production_capacity_kg), 0) as total_production_capacity
        FROM farms
      `)
    ]);

    // Obtener distribución por altitud
    const [altitudeStats] = await executeQuery(`
      SELECT 
        CASE 
          WHEN altitude_meters < 1000 THEN 'Baja (< 1000m)'
          WHEN altitude_meters BETWEEN 1000 AND 1500 THEN 'Media (1000-1500m)'
          WHEN altitude_meters BETWEEN 1500 AND 2000 THEN 'Alta (1500-2000m)'
          ELSE 'Muy Alta (> 2000m)'
        END as altitude_range,
        COUNT(*) as count,
        COALESCE(SUM(area_hectares), 0) as total_area
      FROM farms 
      WHERE is_active = true AND altitude_meters IS NOT NULL
      GROUP BY altitude_range
      ORDER BY MIN(altitude_meters)
    `);

    res.json({
      ...(stats as any[])[0],
      altitudeDistribution: altitudeStats
    });

  } catch (error) {
    console.error('Error obteniendo estadísticas de fincas:', error);
    throw createError('Error obteniendo estadísticas de fincas', 500);
  }
}));

// Obtener fincas para mapa
router.get('/map/locations', requirePermission('farms.view'), asyncHandler(async (req: AuthRequest, res) => {
  try {
    const [locations] = await executeQuery(`
      SELECT 
        f.id,
        f.name,
        f.latitude,
        f.longitude,
        f.area_hectares,
        f.altitude_meters,
        f.coffee_varieties,
        cg.first_name as grower_first_name,
        cg.last_name as grower_last_name,
        cg.region
      FROM farms f
      INNER JOIN coffee_growers cg ON f.coffee_grower_id = cg.id
      WHERE f.is_active = true 
      AND f.latitude IS NOT NULL 
      AND f.longitude IS NOT NULL
      ORDER BY f.name
    `);

    res.json({
      locations: (locations as any[]).map(farm => ({
        id: farm.id,
        name: farm.name,
        latitude: farm.latitude,
        longitude: farm.longitude,
        area: farm.area_hectares,
        altitude: farm.altitude_meters,
        varieties: farm.coffee_varieties,
        grower: `${farm.grower_first_name} ${farm.grower_last_name}`,
        region: farm.region
      }))
    });

  } catch (error) {
    console.error('Error obteniendo ubicaciones de fincas:', error);
    throw createError('Error obteniendo ubicaciones de fincas', 500);
  }
}));

export default router;
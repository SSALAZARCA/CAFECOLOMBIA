const mysql = require('mysql2/promise');
require('dotenv').config();

// Configuración de la base de datos MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: process.env.DB_PORT || 3306,
  user: process.env.DB_USER || 'u472469844_cafeadmin',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u472469844_cafecolombia',
  charset: 'utf8mb4',
  timezone: '+00:00',
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  connectionLimit: 10,
  queueLimit: 0,
  ssl: {
    rejectUnauthorized: false
  }
};

// Pool de conexiones
let pool;

const createPool = () => {
  if (!pool) {
    pool = mysql.createPool(dbConfig);
    
    // Manejar eventos del pool
    pool.on('connection', (connection) => {
      console.log('Nueva conexión establecida como id ' + connection.threadId);
    });

    pool.on('error', (err) => {
      console.error('Error en el pool de conexiones:', err);
      if (err.code === 'PROTOCOL_CONNECTION_LOST') {
        createPool();
      } else {
        throw err;
      }
    });
  }
  return pool;
};

// Obtener conexión del pool
const getConnection = async () => {
  try {
    const pool = createPool();
    const connection = await pool.getConnection();
    return connection;
  } catch (error) {
    console.error('Error al obtener conexión:', error);
    throw error;
  }
};

// Ejecutar query con manejo de errores
const executeQuery = async (query, params = []) => {
  let connection;
  try {
    connection = await getConnection();
    const [results] = await connection.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Ejecutar transacción
const executeTransaction = async (queries) => {
  let connection;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const results = [];
    for (const { query, params } of queries) {
      const [result] = await connection.execute(query, params || []);
      results.push(result);
    }

    await connection.commit();
    return results;
  } catch (error) {
    if (connection) {
      await connection.rollback();
    }
    console.error('Error en transacción:', error);
    throw error;
  } finally {
    if (connection) {
      connection.release();
    }
  }
};

// Verificar conexión
const testConnection = async () => {
  try {
    const connection = await getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión a MySQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    return false;
  }
};

// Cerrar pool de conexiones
const closePool = async () => {
  if (pool) {
    await pool.end();
    pool = null;
    console.log('Pool de conexiones cerrado');
  }
};

module.exports = {
  getConnection,
  executeQuery,
  executeTransaction,
  testConnection,
  closePool,
  pool: () => createPool()
};
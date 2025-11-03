import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la conexión MySQL
const dbConfig = {
  host: process.env.MYSQL_HOST || 'srv1196.hstgr.io',
  user: process.env.MYSQL_USER || '',
  password: process.env.MYSQL_PASSWORD || '',
  database: process.env.MYSQL_DATABASE || 'cafe_colombia',
  port: parseInt(process.env.MYSQL_PORT || '3306'),
  ssl: {
    rejectUnauthorized: false
  },
  connectionLimit: 10,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Pool de conexiones para mejor rendimiento
const pool = mysql.createPool(dbConfig);

// Función para ejecutar consultas
export const executeQuery = async (query: string, params: any[] = []) => {
  try {
    const [results] = await pool.execute(query, params);
    return results;
  } catch (error) {
    console.error('Error ejecutando consulta MySQL:', error);
    throw error;
  }
};

// Función para ejecutar transacciones
export const executeTransaction = async (queries: { query: string; params?: any[] }[]) => {
  const connection = await pool.getConnection();
  
  try {
    await connection.beginTransaction();
    
    const results = [];
    for (const { query, params = [] } of queries) {
      const [result] = await connection.execute(query, params);
      results.push(result);
    }
    
    await connection.commit();
    return results;
  } catch (error) {
    await connection.rollback();
    console.error('Error en transacción MySQL:', error);
    throw error;
  } finally {
    connection.release();
  }
};

// Función para verificar la conexión
export const testConnection = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión MySQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error conectando a MySQL:', error);
    return false;
  }
};

// Función para cerrar el pool de conexiones
export const closePool = async () => {
  try {
    await pool.end();
    console.log('Pool de conexiones MySQL cerrado');
  } catch (error) {
    console.error('Error cerrando pool MySQL:', error);
  }
};

export default pool;
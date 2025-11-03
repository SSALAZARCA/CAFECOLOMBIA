import mysql from 'mysql2/promise';
import dotenv from 'dotenv';

dotenv.config();

// Configuración de la base de datos MySQL
const dbConfig = {
  host: process.env.DB_HOST || 'srv1196.hstgr.io',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'u484426513_cafe_colombia',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'u484426513_cafe_colombia',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true,
  charset: 'utf8mb4',
  timezone: '+00:00'
};

// Pool de conexiones
export const pool = mysql.createPool(dbConfig);

// Función para probar la conexión
export async function testConnection(): Promise<boolean> {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log('✅ Conexión a MySQL establecida correctamente');
    return true;
  } catch (error) {
    console.error('❌ Error al conectar con MySQL:', error);
    return false;
  }
}

// Función para ejecutar queries
export async function executeQuery<T = any>(
  query: string,
  params: any[] = []
): Promise<T[]> {
  try {
    const [rows] = await pool.execute(query, params);
    return rows as T[];
  } catch (error) {
    console.error('Error ejecutando query:', error);
    throw error;
  }
}

// Función para ejecutar queries con transacción
export async function executeTransaction(
  queries: Array<{ query: string; params?: any[] }>
): Promise<any[]> {
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
    throw error;
  } finally {
    connection.release();
  }
}

// Función para obtener una conexión del pool
export async function getConnection() {
  return await pool.getConnection();
}

// Función para cerrar el pool de conexiones
export async function closePool(): Promise<void> {
  try {
    await pool.end();
    console.log('Pool de conexiones MySQL cerrado');
  } catch (error) {
    console.error('Error cerrando pool de conexiones:', error);
  }
}

export default pool;
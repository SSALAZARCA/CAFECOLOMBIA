import { PrismaClient } from '@prisma/client';

declare global {
  var prisma: PrismaClient | undefined;
}

const prisma = globalThis.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalThis.prisma = prisma;
}

export default prisma;

// Función para conectar a la base de datos
export async function connectDatabase() {
  try {
    await prisma.$connect();
    console.log('✅ Conectado a la base de datos MySQL');
  } catch (error) {
    console.error('❌ Error conectando a la base de datos:', error);
    process.exit(1);
  }
}

// Función para desconectar de la base de datos
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Desconectado de la base de datos MySQL');
  } catch (error) {
    console.error('❌ Error desconectando de la base de datos:', error);
  }
}

// Función para verificar la salud de la base de datos
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return { status: 'healthy', message: 'Base de datos funcionando correctamente' };
  } catch (error) {
    return { status: 'unhealthy', message: 'Error en la base de datos', error };
  }
}

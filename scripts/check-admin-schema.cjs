const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function checkSchema() {
    try {
        // Verificar estructura de admin_users
        const result = await prisma.$queryRaw`DESCRIBE admin_users`;
        console.log('Estructura de admin_users:');
        console.log(result);
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await prisma.$disconnect();
    }
}

checkSchema();

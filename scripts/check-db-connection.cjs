const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log('🔍 Checking Database Connection...');
    console.log('Env DATABASE_URL:', process.env.DATABASE_URL ? 'Loaded' : 'Missing');

    try {
        const adminCount = await prisma.adminUser.count();
        console.log('✅ Connection Successful!');
        console.log(`👨‍💼 Admin Users Found: ${adminCount}`);

        const userCount = await prisma.user.count();
        console.log(`👤 Generic Users Found: ${userCount}`);

        const growerCount = await prisma.coffeeGrower.count();
        console.log(`☕ Coffee Growers Found: ${growerCount}`);

        const farmCount = await prisma.farm.count();
        console.log(`🏡 Farms Found: ${farmCount}`);

    } catch (error) {
        console.error('❌ Database Connection Failed:');
        console.error(error);
    } finally {
        await prisma.$disconnect();
    }
}

main();

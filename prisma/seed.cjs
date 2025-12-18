const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
    console.log('🌱 Seeding database...');

    const hashedPassword = await bcrypt.hash('password123', 10);

    // 1. Seed Admin
    const admin = await prisma.adminUser.upsert({
        where: { email: 'admin@test.com' },
        update: {},
        create: {
            email: 'admin@test.com',
            password_hash: hashedPassword,
            name: 'Admin Local',
            is_super_admin: true,
            is_active: true,
        },
    });
    console.log('👤 Admin created:', admin.email);

    // 2. Seed Coffee Grower
    const grower = await prisma.coffeeGrower.upsert({
        where: { email: 'caficultor@test.com' },
        update: {},
        create: {
            email: 'caficultor@test.com',
            full_name: 'Caficultor Local',
            password_hash: hashedPassword,
            status: 'active',
            identification_number: '12345',
            identification_type: 'CC'
        },
    });
    console.log('👨‍🌾 Grower created:', grower.email);

    // 3. Seed Farm
    const farm = await prisma.farmLegacy.create({
        data: {
            name: 'Finca La Esperanza (Local)',
            coffee_grower_id: grower.id,
            status: 'active'
        }
    });

    console.log('🏡 Farm created:', farm.name);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

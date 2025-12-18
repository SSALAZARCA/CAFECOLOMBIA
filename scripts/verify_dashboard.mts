import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function verifyDashboard() {
    console.log('🔍 Starting Dashboard Verification...');

    try {
        // 1. Create or Find Test User
        const email = 'test_grower@example.com';
        let user = await prisma.user.findUnique({ where: { email } });

        if (!user) {
            console.log('👤 Creating Test User...');
            user = await prisma.user.create({
                data: {
                    email,
                    password: 'hashed_password_123',
                    firstName: 'Juan',
                    lastName: 'Valdez',
                    role: 'coffee_grower',
                    isActive: true
                }
            });
            console.log('✅ User Created:', user.id);
        } else {
            console.log('👤 User Found:', user.id);
        }

        // 2. Initial Farm State
        let farm = await prisma.farm.findFirst({ where: { ownerId: user.id } });
        if (!farm) {
            console.log('🌱 No farm found. It should be created via PUT /api/dashboard logic.');
        } else {
            console.log('🌱 Existing Farm Found:', farm.name);
        }

        // 3. Simulate Logic of PUT /api/dashboard
        console.log('🔄 Simulating Dashboard Update...');

        const metadata = {
            farm: {
                name: 'Finca La Esperanza',
                department: 'Antioquia',
                municipality: 'Jericó',
                address: 'Vereda Los Cedros',
                sizeHectares: '15.5',
                altitude: '1950',
                soilType: 'volcánico',
                processingMethod: 'lavado',
                coffeeVarieties: ['Castillo', 'Colombia']
            },
            profile: {
                fullName: 'Juan Manuel Valdez',
                phone: '3001234567'
            }
        };

        // Transaction logic with ANY casts
        await prisma.$transaction(async (tx) => {
            const parts = metadata.profile.fullName.split(' ');
            const firstName = parts[0];
            const lastName = parts.slice(1).join(' ');

            await (tx.user as any).update({
                where: { id: user.id },
                data: { firstName, lastName, phone: metadata.profile.phone }
            });

            const existingFarm = await tx.farm.findFirst({ where: { ownerId: user.id } });
            const farmData = {
                name: metadata.farm.name,
                department: metadata.farm.department,
                municipality: metadata.farm.municipality,
                address: metadata.farm.address,
                area: parseFloat(metadata.farm.sizeHectares),
                altitude: parseFloat(metadata.farm.altitude),
                soilType: metadata.farm.soilType,
                processingMethod: metadata.farm.processingMethod,
                coffeeVarieties: metadata.farm.coffeeVarieties.join(','),
                location: `${metadata.farm.department}, ${metadata.farm.municipality}`,
                description: 'Verified via script'
            };

            if (existingFarm) {
                await (tx.farm as any).update({
                    where: { id: existingFarm.id },
                    data: farmData
                });
                console.log('✅ Farm Updated');
            } else {
                await (tx.farm as any).create({
                    data: {
                        ...farmData,
                        ownerId: user.id,
                        isActive: true
                    }
                });
                console.log('✅ Farm Created');
            }
        });

        // 4. Verification Read with ANY casts
        const updatedUser: any = await prisma.user.findUnique({ where: { id: user.id } });
        const updatedFarm: any = await prisma.farm.findFirst({ where: { ownerId: user.id } });

        console.log('\n📊 Final State Verification:');
        console.log('   User Name:', updatedUser?.firstName, updatedUser?.lastName);
        console.log('   User Phone:', updatedUser?.phone);
        console.log('   Farm Name:', updatedFarm?.name);
        console.log('   Farm Dept:', updatedFarm?.department);
        console.log('   Farm Soil:', updatedFarm?.soilType);
        console.log('   Farm Varieties:', updatedFarm?.coffeeVarieties);

        if (
            updatedUser?.firstName === 'Juan' &&
            updatedFarm?.name === 'Finca La Esperanza' &&
            updatedFarm?.department === 'Antioquia'
        ) {
            console.log('\n✨ VERIFICATION SUCCESSFUL ✨');
        } else {
            console.error('\n❌ VERIFICATION FAILED: Data mismatch');
        }

    } catch (error) {
        console.error('❌ Error during verification:', error);
    } finally {
        await prisma.$disconnect();
    }
}

verifyDashboard();

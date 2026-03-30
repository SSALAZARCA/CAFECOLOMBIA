import { PrismaClient, UserRole, InputType, TaskType, TaskStatus, ExpenseCategory, ProcessType } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando semillas de la base de datos...');

  // Crear usuario administrador por defecto
  const hashedPassword = await bcrypt.hash('admin123', 10);
  
  const adminUser = await prisma.user.upsert({
    where: { email: 'admin@cafecolombia.com' },
    update: {},
    create: {
      email: 'admin@cafecolombia.com',
      password: hashedPassword,
      firstName: 'Administrador',
      lastName: 'Sistema',
      role: UserRole.ADMINISTRADOR,
    },
  });

  console.log('✅ Usuario administrador creado:', adminUser.email);

  // Crear el superadmin principal (Santiago Salazar)
  const ssalazarHash = await bcrypt.hash('ssc841209', 10);
  await prisma.adminUser.upsert({
    where: { email: 'ssalazarc84@gmail.com' },
    update: { password_hash: ssalazarHash, is_super_admin: true, is_active: true },
    create: {
      email: 'ssalazarc84@gmail.com',
      password_hash: ssalazarHash,
      name: 'Santiago Salazar',
      is_super_admin: true,
      is_active: true,
    },
  });
  console.log('✅ Superadmin Santiago Salazar configurado');

  // Crear usuario trabajador de ejemplo
  const workerPassword = await bcrypt.hash('worker123', 10);
  
  const workerUser = await prisma.user.upsert({
    where: { email: 'trabajador@cafecolombia.com' },
    update: {},
    create: {
      email: 'trabajador@cafecolombia.com',
      password: workerPassword,
      firstName: 'Juan',
      lastName: 'Pérez',
      role: UserRole.TRABAJADOR,
    },
  });

  console.log('✅ Usuario trabajador creado:', workerUser.email);

  // Crear insumos básicos
  const inputs = [
    {
      name: 'Urea',
      type: InputType.FERTILIZANTE,
      brand: 'Yara',
      activeIngredient: 'Nitrógeno',
      concentration: '46%',
      unit: 'kg',
      gracePeriodDays: 0,
    },
    {
      name: 'Triple 15',
      type: InputType.FERTILIZANTE,
      brand: 'Monómeros',
      activeIngredient: 'NPK',
      concentration: '15-15-15',
      unit: 'kg',
      gracePeriodDays: 0,
    },
    {
      name: 'Glifosato',
      type: InputType.HERBICIDA,
      brand: 'Bayer',
      activeIngredient: 'Glifosato',
      concentration: '48%',
      unit: 'L',
      gracePeriodDays: 21,
    },
    {
      name: 'Cobre',
      type: InputType.FUNGICIDA,
      brand: 'BASF',
      activeIngredient: 'Oxicloruro de cobre',
      concentration: '50%',
      unit: 'kg',
      gracePeriodDays: 14,
    },
    {
      name: 'Imidacloprid',
      type: InputType.PESTICIDA,
      brand: 'Bayer',
      activeIngredient: 'Imidacloprid',
      concentration: '35%',
      unit: 'L',
      gracePeriodDays: 30,
    },
    {
      name: 'Compost Orgánico',
      type: InputType.ABONO_ORGANICO,
      brand: 'Local',
      activeIngredient: 'Materia orgánica',
      concentration: '100%',
      unit: 'kg',
      gracePeriodDays: 0,
    },
  ];

  for (const input of inputs) {
    await prisma.input.upsert({
      where: { name: input.name },
      update: {},
      create: input,
    });
  }

  console.log('✅ Insumos básicos creados');

  // Crear finca de ejemplo
  const exampleFarm = await prisma.farm.upsert({
    where: { name: 'Finca El Paraíso' },
    update: {},
    create: {
      name: 'Finca El Paraíso',
      location: 'Huila, Colombia',
      area: 5.5,
      altitude: 1650,
      coordinates: JSON.stringify({
        lat: 2.5358,
        lng: -75.8849,
        polygon: [
          { lat: 2.5358, lng: -75.8849 },
          { lat: 2.5368, lng: -75.8849 },
          { lat: 2.5368, lng: -75.8839 },
          { lat: 2.5358, lng: -75.8839 },
        ]
      }),
      description: 'Finca cafetera familiar con variedades Caturra y Colombia',
      ownerId: adminUser.id,
    },
  });

  console.log('✅ Finca de ejemplo creada:', exampleFarm.name);

  // Crear lotes de ejemplo
  const lots = [
    {
      name: 'Lote Alto',
      farmId: exampleFarm.id,
      area: 2.0,
      variety: 'Caturra',
      plantingDate: new Date('2020-03-15'),
      coordinates: JSON.stringify({
        lat: 2.5360,
        lng: -75.8845,
        polygon: [
          { lat: 2.5360, lng: -75.8845 },
          { lat: 2.5365, lng: -75.8845 },
          { lat: 2.5365, lng: -75.8840 },
          { lat: 2.5360, lng: -75.8840 },
        ]
      }),
      soilType: 'Franco arcilloso',
      slope: 15.5,
    },
    {
      name: 'Lote Bajo',
      farmId: exampleFarm.id,
      area: 1.8,
      variety: 'Colombia',
      plantingDate: new Date('2019-11-20'),
      coordinates: JSON.stringify({
        lat: 2.5355,
        lng: -75.8850,
        polygon: [
          { lat: 2.5355, lng: -75.8850 },
          { lat: 2.5360, lng: -75.8850 },
          { lat: 2.5360, lng: -75.8845 },
          { lat: 2.5355, lng: -75.8845 },
        ]
      }),
      soilType: 'Franco limoso',
      slope: 8.2,
    },
  ];

  for (const lot of lots) {
    await prisma.lot.upsert({
      where: { name: lot.name },
      update: {},
      create: lot,
    });
  }

  console.log('✅ Lotes de ejemplo creados');

  console.log('🎉 Semillas completadas exitosamente!');
}

main()
  .catch((e) => {
    console.error('❌ Error en las semillas:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
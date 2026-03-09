const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log("Creating dummy data...");

  // Create an admin user first to satisfy foreign keys for the coffee grower
  const admin = await prisma.adminUser.create({
    data: {
      email: `admin_${Date.now()}@example.com`,
      password_hash: 'dummy',
      name: 'Admin User',
    }
  });

  const grower = await prisma.coffeeGrower.create({
    data: {
      email: `test_${Date.now()}@example.com`,
      full_name: 'Test Grower',
      password_hash: 'dummy',
    }
  });

  const farm = await prisma.farmLegacy.create({
    data: {
      name: 'Test Farm',
      coffee_grower_id: grower.id
    }
  });

  const lot = await prisma.lot.create({
    data: {
      name: 'Test Lot',
      farmId: farm.id,
      area: 10
    }
  });

  const input = await prisma.input.create({
    data: {
      name: `Test Input ${Date.now()}`,
      type: 'FERTILIZER',
      unit: 'KG'
    }
  });

  // Create inventories
  const inventories = await Promise.all(
    Array.from({ length: 100 }).map((_, i) =>
      prisma.inventory.create({
        data: {
          inputId: input.id,
          quantity: 1000,
          unitCost: 10,
          supplier: 'Test Supplier',
          purchaseDate: new Date()
        }
      })
    )
  );

  const task = await prisma.agriculturalTask.create({
    data: {
      farmId: farm.id,
      lotId: lot.id,
      type: 'FERTILIZATION',
      description: 'Test Task',
      scheduledDate: new Date(),
      status: 'PENDING'
    }
  });

  await prisma.inputUsage.createMany({
    data: inventories.map(inv => ({
      agriculturalTaskId: task.id,
      inventoryId: inv.id,
      quantityUsed: 5
    }))
  });

  const taskWithUsage = await prisma.agriculturalTask.findUnique({
    where: { id: task.id },
    include: { inputUsage: true }
  });

  console.log("Measuring loop update...");
  const startLoop = performance.now();

  // Simulate original loop
  if (taskWithUsage.status !== 'COMPLETED' && taskWithUsage.inputUsage.length > 0) {
    for (const usage of taskWithUsage.inputUsage) {
      await prisma.inventory.update({
        where: { id: usage.inventoryId },
        data: {
          quantity: {
            increment: usage.quantityUsed
          }
        }
      });
    }
  }

  const endLoop = performance.now();
  console.log(`Loop update took ${endLoop - startLoop} ms`);

  // Reset inventory state for next test
  await prisma.inventory.updateMany({
    where: { id: { in: inventories.map(i => i.id) } },
    data: { quantity: 1000 }
  });

  console.log("Measuring transaction update...");
  const startTx = performance.now();

  // Simulate optimized update
  if (taskWithUsage.status !== 'COMPLETED' && taskWithUsage.inputUsage.length > 0) {
    await prisma.$transaction(
      taskWithUsage.inputUsage.map(usage =>
        prisma.inventory.update({
          where: { id: usage.inventoryId },
          data: {
            quantity: {
              increment: usage.quantityUsed
            }
          }
        })
      )
    );
  }

  const endTx = performance.now();
  console.log(`Transaction update took ${endTx - startTx} ms`);

  // Cleanup
  await prisma.inputUsage.deleteMany({ where: { agriculturalTaskId: task.id } });
  await prisma.agriculturalTask.delete({ where: { id: task.id } });
  await prisma.inventory.deleteMany({ where: { inputId: input.id } });
  await prisma.input.delete({ where: { id: input.id } });
  await prisma.lot.delete({ where: { id: lot.id } });
  await prisma.farmLegacy.delete({ where: { id: farm.id } });
  await prisma.coffeeGrower.delete({ where: { id: grower.id } });
  await prisma.adminUser.delete({ where: { id: admin.id } });
}

main().catch(console.error).finally(() => prisma.$disconnect());

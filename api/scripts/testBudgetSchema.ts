import assert from 'node:assert';
// Mock prisma before importing financeController which attempts to instantiate it
// Ensure node_modules resolve works with TSX and Prisma correctly
import '../lib/database';

// Override globalThis.prisma to a dummy so the financeController import works even if db is disconnected
if (!globalThis.prisma) {
  try {
     const { PrismaClient } = require('@prisma/client');
     globalThis.prisma = new PrismaClient();
  } catch (err) {
     globalThis.prisma = {} as any;
  }
}

import { createBudgetSchema } from '../controllers/financeController';

console.log('🧪 Iniciando pruebas de createBudgetSchema...');

function runTest(name: string, testFn: () => void) {
  try {
    testFn();
    console.log(`✅ [PASS] ${name}`);
  } catch (error: any) {
    console.error(`❌ [FAIL] ${name}`);
    console.error(error);
    process.exit(1);
  }
}

// 1. Happy path: Valid payload
runTest('Should accept a valid budget payload', () => {
  const validPayload = {
    farmId: 1,
    category: 'Fertilizers',
    amount: 150.5,
    period: 'MONTHLY',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z',
    description: 'Monthly fertilizer budget'
  };

  const result = createBudgetSchema.safeParse(validPayload);
  assert.strictEqual(result.success, true);
});

// 2. Error condition: Negative amount
runTest('Should reject a negative amount', () => {
  const invalidPayload = {
    farmId: 1,
    category: 'Fertilizers',
    amount: -50,
    period: 'MONTHLY',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z'
  };

  const result = createBudgetSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
  if (!result.success && result.error) {
    const errorMsg = result.error.issues?.find((e: any) => e.path.includes('amount'))?.message;
    assert.strictEqual(errorMsg, 'El monto debe ser positivo');
  }
});

// 3. Error condition: Missing required field
runTest('Should reject missing farmId', () => {
  const invalidPayload = {
    category: 'Fertilizers',
    amount: 100,
    period: 'MONTHLY',
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z'
  };

  const result = createBudgetSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
  if (!result.success && result.error) {
    const errorMsg = result.error.issues?.find((e: any) => e.path.includes('farmId'))?.message;
    assert.strictEqual(errorMsg?.toLowerCase().includes('expected number') || errorMsg?.toLowerCase().includes('required'), true);
  }
});

// 4. Error condition: Invalid enum
runTest('Should reject invalid period enum', () => {
  const invalidPayload = {
    farmId: 1,
    category: 'Fertilizers',
    amount: 100,
    period: 'WEEKLY', // invalid enum
    startDate: '2023-01-01T00:00:00Z',
    endDate: '2023-01-31T23:59:59Z'
  };

  const result = createBudgetSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
});

// 5. Error condition: Invalid datetime format
runTest('Should reject invalid datetime format', () => {
  const invalidPayload = {
    farmId: 1,
    category: 'Fertilizers',
    amount: 100,
    period: 'MONTHLY',
    startDate: '2023-01-01', // missing time and timezone
    endDate: '2023-01-31T23:59:59Z'
  };

  const result = createBudgetSchema.safeParse(invalidPayload);
  assert.strictEqual(result.success, false);
  if (!result.success && result.error) {
    const errorMsg = result.error.issues?.find((e: any) => e.path.includes('startDate'))?.message;
    assert.strictEqual(errorMsg?.includes('Invalid') && errorMsg?.includes('datetime'), true);
  }
});

console.log('🎉 Todas las pruebas pasaron exitosamente!');
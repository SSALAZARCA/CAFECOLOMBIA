import { createTransactionSchema } from '../controllers/financeController';
import assert from 'node:assert';

console.log('🧪 Iniciando pruebas del esquema createTransactionSchema...');

try {
  // Test 1: Valid data
  console.log('📋 Test 1: Valid data passes validation');
  const validData = {
    farmId: 1,
    type: 'INCOME',
    category: 'Venta de café',
    amount: 1500.50,
    description: 'Venta de cosecha Q1',
    date: new Date().toISOString(),
    reference: 'REF-001',
    paymentMethod: 'BANK_TRANSFER',
    tags: ['cosecha', '2024']
  };
  const result1 = createTransactionSchema.safeParse(validData);
  assert.strictEqual(result1.success, true, 'Valid data should pass');
  console.log('✅ Test 1 passed');

  // Test 2: Invalid type
  console.log('📋 Test 2: Invalid type fails validation');
  const invalidTypeData = { ...validData, type: 'INVALID_TYPE' };
  const result2 = createTransactionSchema.safeParse(invalidTypeData);
  assert.strictEqual(result2.success, false, 'Invalid type should fail');
  console.log('✅ Test 2 passed');

  // Test 3: Missing required fields
  console.log('📋 Test 3: Missing required fields fails validation');
  const missingFieldsData = {
    farmId: 1,
    type: 'INCOME', // Make it income so it passes type validation if broken
    // category is missing
    amount: 100,
    // description is missing
    date: new Date().toISOString()
  };
  const result3 = createTransactionSchema.safeParse(missingFieldsData);
  assert.strictEqual(result3.success, false, 'Missing required fields should fail');
  if (!result3.success) {
      assert.strictEqual(result3.error.issues.some(i => i.path.includes('category')), true, 'Should complain about category');
      assert.strictEqual(result3.error.issues.some(i => i.path.includes('description')), true, 'Should complain about description');
  }
  console.log('✅ Test 3 passed');

  // Test 4: Invalid amount (negative)
  console.log('📋 Test 4: Invalid amount (negative) fails validation');
  const negativeAmountData = { ...validData, amount: -50 };
  const result4 = createTransactionSchema.safeParse(negativeAmountData);
  assert.strictEqual(result4.success, false, 'Negative amount should fail');
  if (!result4.success) {
      assert.strictEqual(result4.error.issues[0].message, 'El monto debe ser positivo');
  }
  console.log('✅ Test 4 passed');

  // Test 5: Invalid date format
  console.log('📋 Test 5: Invalid date format fails validation');
  const invalidDateData = { ...validData, date: '2024-05-32' }; // invalid day
  const result5 = createTransactionSchema.safeParse(invalidDateData);
  assert.strictEqual(result5.success, false, 'Invalid date string should fail');
  console.log('✅ Test 5 passed');

  // Test 6: Empty category and description
  console.log('📋 Test 6: Empty strings for category and description fails validation');
  const emptyStringsData = { ...validData, category: '', description: '' };
  const result6 = createTransactionSchema.safeParse(emptyStringsData);
  assert.strictEqual(result6.success, false, 'Empty strings should fail');
  if (!result6.success) {
      assert.strictEqual(result6.error.issues.some(i => i.message === 'La categoría es requerida'), true);
      assert.strictEqual(result6.error.issues.some(i => i.message === 'La descripción es requerida'), true);
  }
  console.log('✅ Test 6 passed');

  console.log('🎉 Todas las pruebas del esquema createTransactionSchema completadas exitosamente!');
} catch (error) {
  console.error('❌ Error en las pruebas:', error);
  process.exit(1);
}

try {
    const expenseData = {
        farmId: 1,
        type: 'EXPENSE',
        category: 'Insumos',
        amount: 1500.50,
        description: 'Compra de abono',
        date: new Date().toISOString(),
    };
    const result7 = createTransactionSchema.safeParse(expenseData);
    assert.strictEqual(result7.success, true, 'Expense data should pass');
    console.log('✅ Test 7 (Expense type) passed');
} catch (error) {
    console.error('❌ Error en test 7:', error);
    process.exit(1);
}

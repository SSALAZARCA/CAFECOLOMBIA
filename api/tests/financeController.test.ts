import { describe, it, expect } from 'vitest';
import { createTransactionSchema } from '../controllers/financeController';

describe('createTransactionSchema', () => {
  it('Valid data passes validation', () => {
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
    const result = createTransactionSchema.safeParse(validData);
    expect(result.success).toBe(true);
  });

  it('Invalid type fails validation', () => {
    const validData = {
      farmId: 1,
      type: 'INCOME',
      category: 'Venta de café',
      amount: 1500.50,
      description: 'Venta de cosecha Q1',
      date: new Date().toISOString()
    };
    const invalidTypeData = { ...validData, type: 'INVALID_TYPE' };
    const result = createTransactionSchema.safeParse(invalidTypeData);
    expect(result.success).toBe(false);
  });

  it('Missing required fields fails validation', () => {
    const missingFieldsData = {
      farmId: 1,
      type: 'INCOME',
      amount: 100,
      date: new Date().toISOString()
    };
    const result = createTransactionSchema.safeParse(missingFieldsData);
    expect(result.success).toBe(false);
  });
});

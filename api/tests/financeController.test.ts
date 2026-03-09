import { describe, it, expect, vi, beforeEach } from 'vitest';
import { createTransactionSchema, getTransactions } from '../controllers/financeController';
import { Request, Response } from 'express';
import prisma from '../lib/database';

vi.mock('../lib/database', () => {
  return {
    default: {
      transaction: {
        findMany: vi.fn(),
        count: vi.fn()
      }
    }
  };
});

describe('financeController', () => {
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
      const invalidTypeData = {
        farmId: 1,
        type: 'INVALID_TYPE',
        category: 'Venta de café',
        amount: 1500.50,
        description: 'Venta de cosecha Q1',
        date: new Date().toISOString()
      };
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
      if (!result.success) {
        expect(result.error.issues.some(i => i.path.includes('category'))).toBe(true);
        expect(result.error.issues.some(i => i.path.includes('description'))).toBe(true);
      }
    });

    it('Invalid amount (negative) fails validation', () => {
      const negativeAmountData = {
        farmId: 1,
        type: 'INCOME',
        category: 'Venta de café',
        amount: -50,
        description: 'Venta de cosecha Q1',
        date: new Date().toISOString()
      };
      const result = createTransactionSchema.safeParse(negativeAmountData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('El monto debe ser positivo');
      }
    });

    it('Invalid date format fails validation', () => {
      const invalidDateData = {
        farmId: 1,
        type: 'INCOME',
        category: 'Venta de café',
        amount: 1500.50,
        description: 'Venta de cosecha Q1',
        date: '2024-05-32'
      };
      const result = createTransactionSchema.safeParse(invalidDateData);
      expect(result.success).toBe(false);
    });

    it('Empty strings for category and description fails validation', () => {
      const emptyStringsData = {
        farmId: 1,
        type: 'INCOME',
        category: '',
        amount: 1500.50,
        description: '',
        date: new Date().toISOString()
      };
      const result = createTransactionSchema.safeParse(emptyStringsData);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues.some(i => i.message === 'La categoría es requerida')).toBe(true);
        expect(result.error.issues.some(i => i.message === 'La descripción es requerida')).toBe(true);
      }
    });

    it('Expense type passes validation', () => {
      const expenseData = {
        farmId: 1,
        type: 'EXPENSE',
        category: 'Insumos',
        amount: 1500.50,
        description: 'Compra de abono',
        date: new Date().toISOString()
      };
      const result = createTransactionSchema.safeParse(expenseData);
      expect(result.success).toBe(true);
    });
  });

  describe('getTransactions pagination', () => {
    let mockReq: Partial<Request>;
    let mockRes: Partial<Response>;

    beforeEach(() => {
      mockReq = {
        user: { id: 1 } as any,
        query: {}
      };
      mockRes = {
        json: vi.fn(),
        status: vi.fn().mockReturnThis()
      };
      vi.clearAllMocks();

      // Default mocks for prisma
      (prisma.transaction.findMany as any).mockResolvedValue([]);
      (prisma.transaction.count as any).mockResolvedValue(0);
    });

    it('should use default page=1 and limit=20', async () => {
      await getTransactions(mockReq as Request, mockRes as Response, vi.fn());

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 20
        })
      );
    });

    it('should calculate skip correctly for custom page and limit', async () => {
      mockReq.query = { page: '3', limit: '10' };

      await getTransactions(mockReq as Request, mockRes as Response, vi.fn());

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 20, // (3 - 1) * 10
          take: 10
        })
      );
    });

    it('should parse string query parameters correctly', async () => {
      mockReq.query = { page: '5', limit: '15' };

      await getTransactions(mockReq as Request, mockRes as Response, vi.fn());

      expect(prisma.transaction.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 60, // (5 - 1) * 15
          take: 15
        })
      );
    });
  });
});

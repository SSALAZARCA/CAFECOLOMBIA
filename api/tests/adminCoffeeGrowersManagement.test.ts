import { describe, it, expect, vi, beforeEach } from 'vitest';
import { AdminCoffeeGrowersManagementService } from '../services/adminCoffeeGrowersManagement.js';
import mysql from '../lib/mysql.js';

// Mock the mysql module
vi.mock('../lib/mysql.js', () => ({
  default: {
    getConnection: vi.fn(),
  },
}));

describe('AdminCoffeeGrowersManagementService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getCoffeeGrowers error handling', () => {
    it('should catch database errors, release the connection, and rethrow the error', async () => {
      // Arrange: create a mock connection that throws an error on execute
      const mockError = new Error('Database connection failed');
      const mockRelease = vi.fn();
      const mockConnection = {
        execute: vi.fn().mockRejectedValue(mockError),
        release: mockRelease,
      };

      // Set up the getConnection mock to return our mock connection
      (mysql.getConnection as any).mockResolvedValue(mockConnection);

      // Act & Assert: call the method and expect it to throw the mocked error
      await expect(
        AdminCoffeeGrowersManagementService.getCoffeeGrowers({})
      ).rejects.toThrow('Database connection failed');

      // Verify that getConnection was called
      expect(mysql.getConnection).toHaveBeenCalledTimes(1);

      // Verify that release was called even though an error occurred
      expect(mockRelease).toHaveBeenCalledTimes(1);
    });
  });
});

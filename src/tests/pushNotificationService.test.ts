import { describe, it, expect, vi } from 'vitest';
import { PushNotificationService } from '../services/pushNotificationService';

// Mock required browser globals that might be used during service initialization
vi.stubGlobal('window', {
  Notification: {
    requestPermission: async () => 'granted',
    permission: 'granted'
  }
});
vi.stubGlobal('navigator', { serviceWorker: {} });
vi.stubGlobal('localStorage', {
  getItem: () => null,
  setItem: () => {},
  removeItem: () => {}
});

describe('PushNotificationService', () => {
  it('should follow the singleton pattern', () => {
    const instance1 = PushNotificationService.getInstance();
    const instance2 = PushNotificationService.getInstance();

    expect(instance1).toBe(instance2);
  });
});

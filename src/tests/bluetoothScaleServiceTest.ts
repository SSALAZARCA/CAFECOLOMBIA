// Test script para verificar la funcionalidad del servicio de balanza Bluetooth
import { bluetoothScaleService } from '../services/bluetoothScaleService';

// Mocks for Web Bluetooth API
class MockBluetoothRemoteGATTCharacteristic {
    value: DataView | null = null;
    listeners: { [key: string]: Function[] } = {};

    async startNotifications() {
        return this;
    }

    addEventListener(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }

    simulateNotification(buffer: ArrayBuffer) {
        this.value = new DataView(buffer);
        if (this.listeners['characteristicvaluechanged']) {
            for (const callback of this.listeners['characteristicvaluechanged']) {
                callback({ target: this });
            }
        }
    }
}

class MockBluetoothRemoteGATTService {
    characteristic = new MockBluetoothRemoteGATTCharacteristic();

    async getCharacteristic(uuid: string | number) {
        return this.characteristic;
    }
}

class MockBluetoothRemoteGATTServer {
    connected = false;
    service = new MockBluetoothRemoteGATTService();

    async connect() {
        this.connected = true;
        return this;
    }

    disconnect() {
        this.connected = false;
    }

    async getPrimaryService(uuid: string | number) {
        return this.service;
    }
}

class MockBluetoothDevice {
    gatt = new MockBluetoothRemoteGATTServer();
    listeners: { [key: string]: Function[] } = {};

    addEventListener(event: string, callback: Function) {
        if (!this.listeners[event]) {
            this.listeners[event] = [];
        }
        this.listeners[event].push(callback);
    }
}

export const testBluetoothScaleService = async () => {
    console.log('🧪 Iniciando pruebas de BluetoothScaleService...');
    let passed = 0;
    let failed = 0;

    const assert = (condition: boolean, message: string) => {
        if (condition) {
            console.log(`✅ PASS: ${message}`);
            passed++;
        } else {
            console.error(`❌ FAIL: ${message}`);
            failed++;
        }
    };

    try {
        // Test 1: Unsupported Browser
        console.log('\n📋 Test 1: Unsupported Browser');
        let errorCalled = false;
        let errorMessage = '';
        const originalNavigator = globalThis.navigator || {};

        // Mock navigator without bluetooth
        Object.defineProperty(globalThis, 'navigator', {
            value: { ...originalNavigator },
            configurable: true
        });
        delete (globalThis.navigator as any).bluetooth;

        const connectResultUnsupp = await bluetoothScaleService.connect(
            () => {},
            (err) => {
                errorCalled = true;
                errorMessage = err;
            }
        );

        assert(connectResultUnsupp === false, 'connect() should return false when unsupported');
        assert(errorCalled, 'onError callback should be called');
        assert(errorMessage.includes('no está soportado'), 'Error message should indicate not supported');


        // Setup Mock navigator.bluetooth
        console.log('\n📋 Test 2: Successful Connection');
        const mockDevice = new MockBluetoothDevice();
        let requestDeviceCalled = false;

        Object.defineProperty(globalThis, 'navigator', {
            value: {
                ...originalNavigator,
                bluetooth: {
                    requestDevice: async () => {
                        requestDeviceCalled = true;
                        return mockDevice;
                    }
                }
            },
            configurable: true
        });

        let weightDataReceived: any = null;
        const connectResultSuccess = await bluetoothScaleService.connect(
            (data) => {
                weightDataReceived = data;
            },
            () => {}
        );

        assert(requestDeviceCalled, 'requestDevice should be called');
        assert(connectResultSuccess === true, 'connect() should return true on success');
        assert(mockDevice.gatt.connected, 'Device should be connected');

        // Simulate weight notification (SI / kg, stable)
        // Format: [Flags (uint8), Weight LSB (uint8), Weight MSB (uint8)]
        // Flags: 0x00 (SI unit)
        // Weight: 25.50 kg -> 2550 -> 0x09F6 -> [0xF6, 0x09] (Little Endian)
        // With standard resolution 0.005, 25.50 / 0.005 = 5100 = 0x13EC -> [0xEC, 0x13]

        const buffer = new ArrayBuffer(3);
        const view = new DataView(buffer);
        view.setUint8(0, 0); // Flags: kg
        view.setUint16(1, 5100, true); // Weight in kg / 0.005

        mockDevice.gatt.service.characteristic.simulateNotification(buffer);

        assert(weightDataReceived !== null, 'onWeightChange should be called');
        if (weightDataReceived) {
            assert(weightDataReceived.weight === 25.50, `Weight should be 25.50, got ${weightDataReceived.weight}`);
            assert(weightDataReceived.unit === 'kg', `Unit should be kg, got ${weightDataReceived.unit}`);
        }

        // Test 3: Disconnect
        console.log('\n📋 Test 3: Disconnect');
        bluetoothScaleService.disconnect();
        assert(mockDevice.gatt.connected === false, 'Device should be disconnected after calling disconnect()');
        assert((bluetoothScaleService as any).device === null, 'Internal device reference should be cleared');

        // Test 4: Connection Error (User cancelled)
        console.log('\n📋 Test 4: Connection Error');
        Object.defineProperty(globalThis, 'navigator', {
            value: {
                ...originalNavigator,
                bluetooth: {
                    requestDevice: async () => {
                        throw new Error('User cancelled the requestDevice() prompt.');
                    }
                }
            },
            configurable: true
        });

        let errorCalled2 = false;
        const connectResultError = await bluetoothScaleService.connect(
            () => {},
            (err) => {
                errorCalled2 = true;
            }
        );

        assert(connectResultError === false, 'connect() should return false on error');
        assert(errorCalled2, 'onError should be called on connection error');

        // Restore original navigator
        Object.defineProperty(globalThis, 'navigator', {
            value: originalNavigator,
            configurable: true
        });

        console.log(`\n📊 Resultados: ${passed} exitosos, ${failed} fallidos.`);
        return { success: failed === 0, passed, failed };
    } catch (error) {
        console.error('❌ Error no controlado en las pruebas:', error);
        return { success: false, error };
    }
};

if (typeof window !== 'undefined') {
    (window as any).testBluetoothScaleService = testBluetoothScaleService;
    console.log('🧪 Función de prueba disponible en la consola: testBluetoothScaleService()');
} else {
    // Run tests directly if executed via Node
    testBluetoothScaleService().then((result) => {
        if (!result.success) {
            process.exit(1);
        }
    });
}

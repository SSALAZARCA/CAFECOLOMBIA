export interface FarmWorker {
    id: string | number;
    serverId?: string;
    farmId: string;
    name: string;
    role: string;
    phone?: string;
    isActive: boolean;
    createdAt: string;
}

export interface CoffeeCollection {
    id: string;
    workerId: string;
    lotId: string;
    quantityKg: number;
    collectionDate: string;
    method: 'MANUAL' | 'BASCULA';
    notes?: string;
    lotName?: string;
}

export interface LotSimple {
    id: string;
    name: string;
}

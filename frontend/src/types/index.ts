export type ParcelStatus = 'AVAILABLE' | 'SOLD' | 'RESERVED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Parcel {
    id: string;
    geometry: [number, number][]; // Normalized coordinates (0.0 to 1.0)
    label: string;
    ownerName: string | null;
    status: ParcelStatus;
    areaSqm: number;
    pricePerSqm: number;
    totalPrice: number; // Auto-calculated: areaSqm * pricePerSqm
    amountPaid: number;
    paymentStatus: PaymentStatus;
    projectId?: string;
    terrainId?: string;
    customerId?: string;
    contractId?: string;
    terrain?: {
        id: string;
        name: string;
    } | null;
}

export interface Project {
    id: string;
    name: string;
    imagePath: string;
    imageData?: string;
    imageDataUrl?: string; // For local display
    scaleFactor: number | null; // pixels per meter
    refLineData: RefLineData | null;
    parcels?: Parcel[];
    createdAt?: string;
    updatedAt?: string;
}

export interface RefLineData {
    startPoint: [number, number]; // Normalized
    endPoint: [number, number]; // Normalized
    distanceMeters: number;
}

export interface DetectionResult {
    polygons: [number, number][][];
    confidence?: number;
}

// Aradimon Entity Types

export interface Terrain {
    id: string;
    name: string;
    address?: string | null;
    latitude?: number | null;
    longitude?: number | null;
    mapReference?: string | null;
    areaSize?: number | null;
    areaUnit: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    parcels?: Parcel[];
    owner?: Customer;
    documents?: any[]; // Simplified for now, or define Document type
    contracts?: any[];
    _count?: {
        documents: number;
        contracts: number;
        transactions: number;
    };
}

export interface Document {
    id: string;
    name: string;
    mimeType?: string;
    type?: string;
    sizeBytes?: number;
    filePath?: string;
    googleDriveId?: string;
    thumbnailUrl?: string;
    fileData?: string; // base64
    uploadedAt?: string;
    isLinked?: boolean;
}

export interface Customer {
    id: string;
    type: 'individual' | 'legal_entity';
    name: string;
    email?: string | null;
    phone?: string | null;
    address?: string | null;
    idNumber?: string | null;
    legalRegNumber?: string | null;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
    _count?: {
        documents: number;
        contractParties: number;
        transactionParties: number;
    };
}

export interface Contract {
    id: string;
    contractNumber?: string | null;
    terms?: string | null;
    notes?: string | null;
    saleAmount?: number | null;
    createdAt: string;
    updatedAt: string;
    customerId: string;
    customer?: Customer;
    parcels?: Parcel[];
    documents?: any[];
    _count?: {
        documents: number;
        parcels: number;
    };
}

export interface ContractParty {
    contractId: string;
    customerId: string;
    role: string;
}

export interface ContractPartyWithCustomer extends ContractParty {
    customer: Customer;
}

export interface ContractTerrain {
    contractId: string;
    terrainId: string;
}

export interface ContractTerrainWithTerrain extends ContractTerrain {
    terrain: Terrain;
}

export interface Transaction {
    id: string;
    contractId?: string | null;
    type: 'sale' | 'purchase';
    transactionDate: string;
    price: number;
    currency: string;
    notes?: string | null;
    createdAt: string;
    updatedAt: string;
}

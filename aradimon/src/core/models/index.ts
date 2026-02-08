// Core domain models for Aradimon

export interface Terrain {
    id: string;
    name: string;
    address?: string;
    latitude?: number;
    longitude?: number;
    mapReference?: string;
    areaSize?: number;
    areaUnit?: 'sqm' | 'sqft' | 'hectare' | 'acre';
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Customer {
    id: string;
    type: 'individual' | 'legal_entity';
    name: string;
    email?: string;
    phone?: string;
    address?: string;
    idNumber?: string;
    legalRegNumber?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface Contract {
    id: string;
    contractNumber?: string;
    type: 'ownership' | 'sale' | 'purchase' | 'lease' | 'other';
    status: 'draft' | 'active' | 'expired' | 'cancelled';
    startDate?: string;
    endDate?: string;
    terms?: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface ContractParty {
    contractId: string;
    customerId: string;
    role: 'owner' | 'buyer' | 'seller' | 'lessor' | 'lessee' | 'party';
}

export interface Transaction {
    id: string;
    contractId?: string;
    type: 'sale' | 'purchase';
    transactionDate: string;
    price: number;
    currency: string;
    notes?: string;
    createdAt: string;
    updatedAt: string;
}

export interface TransactionParty {
    transactionId: string;
    customerId: string;
    role: 'buyer' | 'seller';
}

export interface Document {
    id: string;
    googleDriveId: string;
    name: string;
    mimeType?: string;
    type: 'contract_photo' | 'legal_doc' | 'satellite_image' | 'pdf' | 'other';
    sizeBytes?: number;
    thumbnailUrl?: string;
    uploadedAt?: string;
    createdAt: string;
    isLinked: boolean;
}

export interface OwnershipHistory {
    id: string;
    terrainId: string;
    customerId: string;
    startDate: string;
    endDate?: string;
    notes?: string;
}

// Extended types with relations
export interface TerrainWithRelations extends Terrain {
    documents?: Document[];
    currentOwners?: Customer[];
    contracts?: Contract[];
    ownershipHistory?: (OwnershipHistory & { customer?: Customer })[];
}

export interface CustomerWithRelations extends Customer {
    documents?: Document[];
    terrains?: Terrain[];
    contracts?: Contract[];
}

export interface ContractWithRelations extends Contract {
    documents?: Document[];
    terrains?: Terrain[];
    parties?: (ContractParty & { customer?: Customer })[];
    transactions?: Transaction[];
}

export interface TransactionWithRelations extends Transaction {
    documents?: Document[];
    terrains?: Terrain[];
    parties?: (TransactionParty & { customer?: Customer })[];
    contract?: Contract;
}

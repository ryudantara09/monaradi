export type ParcelStatus = 'AVAILABLE' | 'SOLD' | 'RESERVED';
export type PaymentStatus = 'UNPAID' | 'PARTIAL' | 'PAID';

export interface Parcel {
    id: string;
    geometry: [number, number][]; // Normalized coordinates (0.0 to 1.0)
    label: string;
    ownerName: string | null;
    status: ParcelStatus;
    paymentStatus: PaymentStatus;
    areaSqm: number;
    pricePerSqm: number;
    totalPrice: number; // Auto-calculated: areaSqm * pricePerSqm
}

export interface Project {
    id: string;
    imagePath: string;
    imageDataUrl?: string; // For local display
    scaleFactor: number | null; // pixels per meter
    refLineData: RefLineData | null;
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

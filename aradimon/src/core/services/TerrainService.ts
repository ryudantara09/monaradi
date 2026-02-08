// Terrain Service - CRUD operations for land parcels
import { v4 as uuidv4 } from 'uuid';
import type { Terrain, TerrainWithRelations, Document, Customer, Contract, OwnershipHistory } from '../models';

// Service interface (can be implemented differently for each platform)
export interface ITerrainService {
    getAll(): Promise<Terrain[]>;
    getById(id: string): Promise<TerrainWithRelations | null>;
    create(data: Omit<Terrain, 'id' | 'createdAt' | 'updatedAt'>): Promise<Terrain>;
    update(id: string, data: Partial<Terrain>): Promise<Terrain | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Terrain[]>;

    // Relationships
    getDocuments(terrainId: string): Promise<Document[]>;
    linkDocument(terrainId: string, documentId: string): Promise<boolean>;
    unlinkDocument(terrainId: string, documentId: string): Promise<boolean>;
    getCurrentOwners(terrainId: string): Promise<Customer[]>;
    getContracts(terrainId: string): Promise<Contract[]>;
    getOwnershipHistory(terrainId: string): Promise<(OwnershipHistory & { customer?: Customer })[]>;
}

// Default implementation using window.electronAPI or direct database
export class TerrainService implements ITerrainService {

    async getAll(): Promise<Terrain[]> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.getTerrains() as Promise<Terrain[]>;
        }
        throw new Error('TerrainService: No database adapter available');
    }

    async getById(id: string): Promise<TerrainWithRelations | null> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            const terrain = await window.electronAPI.db.getTerrain(id) as Terrain | null;
            if (!terrain) return null;

            // Fetch related data
            const [documents, currentOwners, contracts, ownershipHistory] = await Promise.all([
                this.getDocuments(id),
                this.getCurrentOwners(id),
                this.getContracts(id),
                this.getOwnershipHistory(id),
            ]);

            return {
                ...terrain,
                documents,
                currentOwners,
                contracts,
                ownershipHistory,
            };
        }
        throw new Error('TerrainService: No database adapter available');
    }

    async create(data: Omit<Terrain, 'id' | 'createdAt' | 'updatedAt'>): Promise<Terrain> {
        const terrain: Terrain = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.createTerrain(terrain) as Promise<Terrain>;
        }
        throw new Error('TerrainService: No database adapter available');
    }

    async update(id: string, data: Partial<Terrain>): Promise<Terrain | null> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.updateTerrain(id, {
                ...data,
                updatedAt: new Date().toISOString(),
            }) as Promise<Terrain | null>;
        }
        throw new Error('TerrainService: No database adapter available');
    }

    async delete(id: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.deleteTerrain(id);
        }
        throw new Error('TerrainService: No database adapter available');
    }

    async search(query: string): Promise<Terrain[]> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            const results = await window.electronAPI.db.search(query) as { terrains?: Terrain[] };
            return results.terrains || [];
        }
        throw new Error('TerrainService: No database adapter available');
    }

    // Relationship methods - these would call specific IPC handlers
    async getDocuments(terrainId: string): Promise<Document[]> {
        // TODO: Implement via IPC
        return [];
    }

    async linkDocument(terrainId: string, documentId: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.linkDocument(documentId, 'terrain', terrainId);
        }
        return false;
    }

    async unlinkDocument(terrainId: string, documentId: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.unlinkDocument(documentId, 'terrain', terrainId);
        }
        return false;
    }

    async getCurrentOwners(terrainId: string): Promise<Customer[]> {
        // TODO: Implement via IPC - query ownership_history where end_date IS NULL
        return [];
    }

    async getContracts(terrainId: string): Promise<Contract[]> {
        // TODO: Implement via IPC - query contract_terrains
        return [];
    }

    async getOwnershipHistory(terrainId: string): Promise<(OwnershipHistory & { customer?: Customer })[]> {
        // TODO: Implement via IPC
        return [];
    }
}

// Singleton instance
export const terrainService = new TerrainService();

// Customer Service - CRUD operations for individuals and legal entities
import { v4 as uuidv4 } from 'uuid';
import type { Customer, CustomerWithRelations, Document, Terrain, Contract } from '../models';

export interface ICustomerService {
    getAll(): Promise<Customer[]>;
    getById(id: string): Promise<CustomerWithRelations | null>;
    create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer>;
    update(id: string, data: Partial<Customer>): Promise<Customer | null>;
    delete(id: string): Promise<boolean>;
    search(query: string): Promise<Customer[]>;

    // Relationships
    getDocuments(customerId: string): Promise<Document[]>;
    linkDocument(customerId: string, documentId: string): Promise<boolean>;
    unlinkDocument(customerId: string, documentId: string): Promise<boolean>;
    getTerrains(customerId: string): Promise<Terrain[]>;
    getContracts(customerId: string): Promise<Contract[]>;
}

export class CustomerService implements ICustomerService {

    async getAll(): Promise<Customer[]> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.getCustomers() as Promise<Customer[]>;
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async getById(id: string): Promise<CustomerWithRelations | null> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            const customer = await window.electronAPI.db.getCustomer(id) as Customer | null;
            if (!customer) return null;

            const [documents, terrains, contracts] = await Promise.all([
                this.getDocuments(id),
                this.getTerrains(id),
                this.getContracts(id),
            ]);

            return { ...customer, documents, terrains, contracts };
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async create(data: Omit<Customer, 'id' | 'createdAt' | 'updatedAt'>): Promise<Customer> {
        const customer: Customer = {
            ...data,
            id: uuidv4(),
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
        };

        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.createCustomer(customer) as Promise<Customer>;
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async update(id: string, data: Partial<Customer>): Promise<Customer | null> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.updateCustomer(id, {
                ...data,
                updatedAt: new Date().toISOString(),
            }) as Promise<Customer | null>;
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async delete(id: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.deleteCustomer(id);
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async search(query: string): Promise<Customer[]> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            const results = await window.electronAPI.db.search(query) as { customers?: Customer[] };
            return results.customers || [];
        }
        throw new Error('CustomerService: No database adapter available');
    }

    async getDocuments(customerId: string): Promise<Document[]> {
        return [];
    }

    async linkDocument(customerId: string, documentId: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.linkDocument(documentId, 'customer', customerId);
        }
        return false;
    }

    async unlinkDocument(customerId: string, documentId: string): Promise<boolean> {
        if (typeof window !== 'undefined' && 'electronAPI' in window) {
            return window.electronAPI.db.unlinkDocument(documentId, 'customer', customerId);
        }
        return false;
    }

    async getTerrains(customerId: string): Promise<Terrain[]> {
        return [];
    }

    async getContracts(customerId: string): Promise<Contract[]> {
        return [];
    }
}

export const customerService = new CustomerService();

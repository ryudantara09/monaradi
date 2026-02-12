import axios from 'axios';
import type { Terrain, Customer, Contract } from '@/types';

const api = axios.create({
    baseURL: '/api',
    headers: {
        'Content-Type': 'application/json',
    },
});

// ==========================================
// TERRAINS
// ==========================================

export async function fetchTerrains(): Promise<Terrain[]> {
    const { data } = await api.get('/terrains');
    return data;
}

export async function fetchTerrain(id: string): Promise<Terrain> {
    const { data } = await api.get(`/terrains/${id}`);
    return data;
}

export async function createTerrain(terrain: Partial<Terrain>): Promise<Terrain> {
    const { data } = await api.post('/terrains', terrain);
    return data;
}

export async function updateTerrain(id: string, terrain: Partial<Terrain>): Promise<Terrain> {
    const { data } = await api.put(`/terrains/${id}`, terrain);
    return data;
}

export async function deleteTerrain(id: string): Promise<void> {
    await api.delete(`/terrains/${id}`);
}

// ==========================================
// CUSTOMERS
// ==========================================

export async function fetchCustomers(): Promise<Customer[]> {
    const { data } = await api.get('/customers');
    return data;
}

export async function fetchCustomer(id: string): Promise<Customer> {
    const { data } = await api.get(`/customers/${id}`);
    return data;
}

export async function createCustomer(customer: Partial<Customer>): Promise<Customer> {
    const { data } = await api.post('/customers', customer);
    return data;
}

export async function updateCustomer(id: string, customer: Partial<Customer>): Promise<Customer> {
    const { data } = await api.put(`/customers/${id}`, customer);
    return data;
}

export async function deleteCustomer(id: string): Promise<void> {
    await api.delete(`/customers/${id}`);
}

// ==========================================
// CONTRACTS
// ==========================================

export async function fetchContracts(): Promise<Contract[]> {
    const { data } = await api.get('/contracts');
    return data;
}

export async function fetchContract(id: string): Promise<Contract> {
    const { data } = await api.get(`/contracts/${id}`);
    return data;
}

export interface CreateContractPayload {
    contractNumber?: string;
    type: string;
    status?: string;
    startDate?: string;
    endDate?: string;
    terms?: string;
    notes?: string;
    parties?: { customerId: string; role: string }[];
    terrainIds?: string[];
}

export async function createContract(payload: CreateContractPayload): Promise<Contract> {
    const { data } = await api.post('/contracts', payload);
    return data;
}

export async function updateContract(id: string, contract: Partial<Contract>): Promise<Contract> {
    const { data } = await api.put(`/contracts/${id}`, contract);
    return data;
}

export async function deleteContract(id: string): Promise<void> {
    await api.delete(`/contracts/${id}`);
}

// ==========================================
// DOCUMENTS
// ==========================================

export async function fetchDocuments(params?: { linked?: boolean; type?: string }): Promise<any[]> {
    const { data } = await api.get('/documents', { params });
    return data;
}

export async function linkDocument(documentId: string, entityType: string, entityId: string): Promise<void> {
    await api.post(`/documents/${documentId}/link`, { entityType, entityId });
}

export async function updateDocument(id: string, updates: { name?: string; type?: string }): Promise<any> {
    const { data } = await api.put(`/documents/${id}`, updates);
    return data;
}

export async function deleteDocument(id: string): Promise<void> {
    await api.delete(`/documents/${id}`);
}

export async function uploadDocument(formData: FormData): Promise<any> {
    const { data } = await api.post('/documents', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    });
    return data;
}

// ==========================================
// PARCELS
// ==========================================

export async function fetchParcels(): Promise<any[]> {
    const { data } = await api.get('/parcels');
    return data;
}

export async function createParcel(parcel: any): Promise<any> {
    const { data } = await api.post('/parcels', parcel);
    return data;
}

export async function updateParcel(id: string, parcel: any): Promise<any> {
    const { data } = await api.put(`/parcels/${id}`, parcel);
    return data;
}

export async function deleteParcel(id: string): Promise<void> {
    await api.delete(`/parcels/${id}`);
}

// Contract Relations
export async function addContractParty(contractId: string, customerId: string, role: string): Promise<void> {
    await api.post(`/contracts/${contractId}/parties`, { customerId, role });
}

export async function removeContractParty(contractId: string, customerId: string, role: string): Promise<void> {
    await api.delete(`/contracts/${contractId}/parties/${customerId}/${role}`);
}

export async function linkContractTerrain(contractId: string, terrainId: string): Promise<void> {
    await api.post(`/contracts/${contractId}/terrains`, { terrainId });
}

export async function unlinkContractTerrain(contractId: string, terrainId: string): Promise<void> {
    await api.delete(`/contracts/${contractId}/terrains/${terrainId}`);
}

// ==========================================
// DASHBOARD STATS
// ==========================================

export interface DashboardStats {
    terrains: number;
    customers: number;
    contracts: number;
    activeContracts: number;
}

export async function fetchDashboardStats(): Promise<DashboardStats> {
    const [terrains, customers, contracts] = await Promise.all([
        fetchTerrains(),
        fetchCustomers(),
        fetchContracts(),
    ]);

    return {
        terrains: terrains.length,
        customers: customers.length,
        contracts: contracts.length,
        activeContracts: contracts.filter(c => c.status === 'active').length,
    };
}

export default api;

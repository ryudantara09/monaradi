import { contextBridge, ipcRenderer } from 'electron';

// Expose protected methods to the renderer process
contextBridge.exposeInMainWorld('electronAPI', {
    // Database operations
    db: {
        // Terrains
        getTerrains: () => ipcRenderer.invoke('db:getTerrains'),
        getTerrain: (id: string) => ipcRenderer.invoke('db:getTerrain', id),
        createTerrain: (data: unknown) => ipcRenderer.invoke('db:createTerrain', data),
        updateTerrain: (id: string, data: unknown) => ipcRenderer.invoke('db:updateTerrain', id, data),
        deleteTerrain: (id: string) => ipcRenderer.invoke('db:deleteTerrain', id),

        // Customers
        getCustomers: () => ipcRenderer.invoke('db:getCustomers'),
        getCustomer: (id: string) => ipcRenderer.invoke('db:getCustomer', id),
        createCustomer: (data: unknown) => ipcRenderer.invoke('db:createCustomer', data),
        updateCustomer: (id: string, data: unknown) => ipcRenderer.invoke('db:updateCustomer', id, data),
        deleteCustomer: (id: string) => ipcRenderer.invoke('db:deleteCustomer', id),

        // Contracts
        getContracts: () => ipcRenderer.invoke('db:getContracts'),
        getContract: (id: string) => ipcRenderer.invoke('db:getContract', id),
        createContract: (data: unknown) => ipcRenderer.invoke('db:createContract', data),
        updateContract: (id: string, data: unknown) => ipcRenderer.invoke('db:updateContract', id, data),
        deleteContract: (id: string) => ipcRenderer.invoke('db:deleteContract', id),

        // Transactions
        getTransactions: () => ipcRenderer.invoke('db:getTransactions'),
        getTransaction: (id: string) => ipcRenderer.invoke('db:getTransaction', id),
        createTransaction: (data: unknown) => ipcRenderer.invoke('db:createTransaction', data),
        updateTransaction: (id: string, data: unknown) => ipcRenderer.invoke('db:updateTransaction', id, data),
        deleteTransaction: (id: string) => ipcRenderer.invoke('db:deleteTransaction', id),

        // Documents
        getDocuments: () => ipcRenderer.invoke('db:getDocuments'),
        getDocument: (id: string) => ipcRenderer.invoke('db:getDocument', id),
        linkDocument: (docId: string, entityType: string, entityId: string) =>
            ipcRenderer.invoke('db:linkDocument', docId, entityType, entityId),
        unlinkDocument: (docId: string, entityType: string, entityId: string) =>
            ipcRenderer.invoke('db:unlinkDocument', docId, entityType, entityId),

        // Search
        search: (query: string) => ipcRenderer.invoke('db:search', query),
    },

    // Google Drive operations
    drive: {
        authenticate: () => ipcRenderer.invoke('drive:authenticate'),
        disconnect: () => ipcRenderer.invoke('drive:disconnect'),
        getAuthStatus: () => ipcRenderer.invoke('drive:getAuthStatus'),
        setWatchedFolder: (folderId: string) => ipcRenderer.invoke('drive:setWatchedFolder', folderId),
        syncDocuments: () => ipcRenderer.invoke('drive:syncDocuments'),
        getFile: (fileId: string) => ipcRenderer.invoke('drive:getFile', fileId),
        listFolders: () => ipcRenderer.invoke('drive:listFolders'),
    },

    // App events
    onDocumentsSync: (callback: (docs: unknown[]) => void) => {
        ipcRenderer.on('documents:synced', (_event, docs) => callback(docs));
    },
});

// Type declaration for window.electronAPI
export interface ElectronAPI {
    db: {
        getTerrains: () => Promise<unknown[]>;
        getTerrain: (id: string) => Promise<unknown>;
        createTerrain: (data: unknown) => Promise<unknown>;
        updateTerrain: (id: string, data: unknown) => Promise<unknown>;
        deleteTerrain: (id: string) => Promise<boolean>;
        getCustomers: () => Promise<unknown[]>;
        getCustomer: (id: string) => Promise<unknown>;
        createCustomer: (data: unknown) => Promise<unknown>;
        updateCustomer: (id: string, data: unknown) => Promise<unknown>;
        deleteCustomer: (id: string) => Promise<boolean>;
        getContracts: () => Promise<unknown[]>;
        getContract: (id: string) => Promise<unknown>;
        createContract: (data: unknown) => Promise<unknown>;
        updateContract: (id: string, data: unknown) => Promise<unknown>;
        deleteContract: (id: string) => Promise<boolean>;
        getTransactions: () => Promise<unknown[]>;
        getTransaction: (id: string) => Promise<unknown>;
        createTransaction: (data: unknown) => Promise<unknown>;
        updateTransaction: (id: string, data: unknown) => Promise<unknown>;
        deleteTransaction: (id: string) => Promise<boolean>;
        getDocuments: () => Promise<unknown[]>;
        getDocument: (id: string) => Promise<unknown>;
        linkDocument: (docId: string, entityType: string, entityId: string) => Promise<boolean>;
        unlinkDocument: (docId: string, entityType: string, entityId: string) => Promise<boolean>;
        search: (query: string) => Promise<unknown>;
    };
    drive: {
        authenticate: () => Promise<boolean>;
        disconnect: () => Promise<void>;
        getAuthStatus: () => Promise<{ connected: boolean; email?: string }>;
        setWatchedFolder: (folderId: string) => Promise<void>;
        syncDocuments: () => Promise<unknown[]>;
        getFile: (fileId: string) => Promise<ArrayBuffer>;
        listFolders: () => Promise<unknown[]>;
    };
    onDocumentsSync: (callback: (docs: unknown[]) => void) => void;
}

declare global {
    interface Window {
        electronAPI: ElectronAPI;
    }
}

// Electron Database Bridge - Renderer process side
// This bridges calls to the main process where better-sqlite3 runs

import type { DatabaseAdapter } from './database';

export class ElectronDatabaseBridge implements DatabaseAdapter {
    async initialize(): Promise<void> {
        // Database is initialized in main process
        // This just verifies the connection
        const result = await window.electronAPI.db.getTerrains();
        console.log('[ElectronDatabaseBridge] Connected, test query returned:', result?.length ?? 0, 'terrains');
    }

    async close(): Promise<void> {
        // Database is managed by main process
        console.log('[ElectronDatabaseBridge] Close requested (no-op in renderer)');
    }

    async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number }> {
        // For direct SQL execution, we'd need an IPC channel
        // Most operations go through the typed API instead
        console.warn('[ElectronDatabaseBridge] Direct SQL not recommended, use typed API');
        return { changes: 0, lastInsertRowid: 0 };
    }

    async get<T>(sql: string, params?: unknown[]): Promise<T | undefined> {
        console.warn('[ElectronDatabaseBridge] Direct SQL not recommended, use typed API');
        return undefined;
    }

    async all<T>(sql: string, params?: unknown[]): Promise<T[]> {
        console.warn('[ElectronDatabaseBridge] Direct SQL not recommended, use typed API');
        return [];
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        // Transactions in Electron should be handled in main process
        // For renderer, we just execute the function
        return fn();
    }
}

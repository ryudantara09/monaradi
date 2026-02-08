// Platform adapter interface for database operations
// This allows the same business logic to work on both Electron (better-sqlite3) and Capacitor (SQLite plugin)

export interface DatabaseAdapter {
    // Core operations
    initialize(): Promise<void>;
    close(): Promise<void>;

    // Query operations
    run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number }>;
    get<T>(sql: string, params?: unknown[]): Promise<T | undefined>;
    all<T>(sql: string, params?: unknown[]): Promise<T[]>;

    // Transaction support
    transaction<T>(fn: () => Promise<T>): Promise<T>;
}

// Platform detection
export function getPlatform(): 'electron' | 'capacitor' | 'web' {
    if (typeof window !== 'undefined') {
        if ('electronAPI' in window) {
            return 'electron';
        }
        // @ts-expect-error Capacitor global
        if (typeof Capacitor !== 'undefined' && Capacitor.isNativePlatform()) {
            return 'capacitor';
        }
    }
    return 'web';
}

// Factory function to get the appropriate adapter
let dbAdapter: DatabaseAdapter | null = null;

export async function getDatabase(): Promise<DatabaseAdapter> {
    if (dbAdapter) {
        return dbAdapter;
    }

    const platform = getPlatform();

    switch (platform) {
        case 'electron':
            // In Electron, database operations go through IPC
            // The actual adapter lives in the main process
            const { ElectronDatabaseBridge } = await import('./database.electron-bridge');
            dbAdapter = new ElectronDatabaseBridge();
            break;

        case 'capacitor':
            const { CapacitorDatabaseAdapter } = await import('./database.capacitor');
            dbAdapter = new CapacitorDatabaseAdapter();
            break;

        default:
            throw new Error('Database not available on this platform');
    }

    await dbAdapter.initialize();
    return dbAdapter;
}

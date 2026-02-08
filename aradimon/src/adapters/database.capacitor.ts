// Capacitor Database Adapter
// Uses @capacitor-community/sqlite for mobile platforms

import type { DatabaseAdapter } from './database';

// Note: You'll need to install @capacitor-community/sqlite
// npm install @capacitor-community/sqlite

export class CapacitorDatabaseAdapter implements DatabaseAdapter {
    private db: unknown = null;
    private dbName = 'aradimon';

    async initialize(): Promise<void> {
        try {
            // Dynamic import to avoid issues on non-Capacitor platforms
            const { CapacitorSQLite, SQLiteConnection } = await import('@capacitor-community/sqlite');

            const sqlite = new SQLiteConnection(CapacitorSQLite);

            // Check connection consistency
            const retCC = await sqlite.checkConnectionsConsistency();
            const isConn = (await sqlite.isConnection(this.dbName, false)).result;

            if (retCC.result && isConn) {
                this.db = await sqlite.retrieveConnection(this.dbName, false);
            } else {
                this.db = await sqlite.createConnection(
                    this.dbName,
                    false,
                    'no-encryption',
                    1,
                    false
                );
            }

            // @ts-expect-error Dynamic typing for Capacitor plugin
            await this.db.open();

            // Execute schema
            const schema = await this.loadSchema();
            // @ts-expect-error Dynamic typing for Capacitor plugin
            await this.db.execute(schema);

            console.log('[CapacitorDatabaseAdapter] Database initialized');
        } catch (error) {
            console.error('[CapacitorDatabaseAdapter] Failed to initialize:', error);
            throw error;
        }
    }

    private async loadSchema(): Promise<string> {
        // In production, schema would be bundled with the app
        // For now, return the essential tables
        return `
      PRAGMA foreign_keys = ON;
      
      CREATE TABLE IF NOT EXISTS terrains (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        address TEXT,
        latitude REAL,
        longitude REAL,
        map_reference TEXT,
        area_size REAL,
        area_unit TEXT DEFAULT 'sqm',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS customers (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL DEFAULT 'individual',
        name TEXT NOT NULL,
        email TEXT,
        phone TEXT,
        address TEXT,
        id_number TEXT,
        legal_reg_number TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS contracts (
        id TEXT PRIMARY KEY,
        contract_number TEXT,
        type TEXT NOT NULL,
        status TEXT NOT NULL DEFAULT 'draft',
        start_date TEXT,
        end_date TEXT,
        terms TEXT,
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
        type TEXT NOT NULL,
        transaction_date TEXT NOT NULL,
        price REAL NOT NULL,
        currency TEXT NOT NULL DEFAULT 'USD',
        notes TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        updated_at TEXT NOT NULL DEFAULT (datetime('now'))
      );
      
      CREATE TABLE IF NOT EXISTS documents (
        id TEXT PRIMARY KEY,
        google_drive_id TEXT NOT NULL UNIQUE,
        name TEXT NOT NULL,
        mime_type TEXT,
        type TEXT DEFAULT 'other',
        size_bytes INTEGER,
        thumbnail_url TEXT,
        uploaded_at TEXT,
        created_at TEXT NOT NULL DEFAULT (datetime('now')),
        is_linked INTEGER NOT NULL DEFAULT 0
      );
      
      CREATE TABLE IF NOT EXISTS app_settings (
        key TEXT PRIMARY KEY,
        value TEXT
      );
    `;
    }

    async close(): Promise<void> {
        if (this.db) {
            // @ts-expect-error Dynamic typing for Capacitor plugin
            await this.db.close();
            this.db = null;
        }
    }

    async run(sql: string, params?: unknown[]): Promise<{ changes: number; lastInsertRowid: number }> {
        if (!this.db) throw new Error('Database not initialized');

        // @ts-expect-error Dynamic typing for Capacitor plugin
        const result = await this.db.run(sql, params || []);
        return {
            changes: result.changes?.changes ?? 0,
            lastInsertRowid: result.changes?.lastId ?? 0,
        };
    }

    async get<T>(sql: string, params?: unknown[]): Promise<T | undefined> {
        if (!this.db) throw new Error('Database not initialized');

        // @ts-expect-error Dynamic typing for Capacitor plugin
        const result = await this.db.query(sql, params || []);
        return result.values?.[0] as T | undefined;
    }

    async all<T>(sql: string, params?: unknown[]): Promise<T[]> {
        if (!this.db) throw new Error('Database not initialized');

        // @ts-expect-error Dynamic typing for Capacitor plugin
        const result = await this.db.query(sql, params || []);
        return (result.values || []) as T[];
    }

    async transaction<T>(fn: () => Promise<T>): Promise<T> {
        if (!this.db) throw new Error('Database not initialized');

        // @ts-expect-error Dynamic typing for Capacitor plugin
        await this.db.execute('BEGIN TRANSACTION');
        try {
            const result = await fn();
            // @ts-expect-error Dynamic typing for Capacitor plugin
            await this.db.execute('COMMIT');
            return result;
        } catch (error) {
            // @ts-expect-error Dynamic typing for Capacitor plugin
            await this.db.execute('ROLLBACK');
            throw error;
        }
    }
}

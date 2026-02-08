// Electron Main Process Database Handler
// Uses better-sqlite3 for SQLite operations

import { app, ipcMain } from 'electron';
import path from 'path';
import fs from 'fs';
import Database from 'better-sqlite3';

let db: Database.Database | null = null;

// Get database path in user data directory
function getDatabasePath(): string {
    const userDataPath = app.getPath('userData');
    return path.join(userDataPath, 'aradimon.db');
}

// Initialize database
export function initDatabase(): void {
    const dbPath = getDatabasePath();
    console.log('[Database] Initializing at:', dbPath);

    // Ensure directory exists
    const dir = path.dirname(dbPath);
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }

    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
    db.pragma('foreign_keys = ON');

    // Run schema
    createTables();

    console.log('[Database] Initialized successfully');
}

// Create tables
function createTables(): void {
    if (!db) return;

    db.exec(`
    -- Terrains
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
    
    -- Customers
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
    
    -- Contracts
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
    
    -- Transactions
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
    
    -- Documents
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
    
    -- Junction Tables
    CREATE TABLE IF NOT EXISTS contract_parties (
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      role TEXT NOT NULL,
      PRIMARY KEY (contract_id, customer_id, role)
    );
    
    CREATE TABLE IF NOT EXISTS contract_terrains (
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
      PRIMARY KEY (contract_id, terrain_id)
    );
    
    CREATE TABLE IF NOT EXISTS terrain_documents (
      terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      PRIMARY KEY (terrain_id, document_id)
    );
    
    CREATE TABLE IF NOT EXISTS customer_documents (
      customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      PRIMARY KEY (customer_id, document_id)
    );
    
    CREATE TABLE IF NOT EXISTS contract_documents (
      contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
      document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
      PRIMARY KEY (contract_id, document_id)
    );
    
    CREATE TABLE IF NOT EXISTS app_settings (
      key TEXT PRIMARY KEY,
      value TEXT
    );
    
    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_terrains_name ON terrains(name);
    CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
    CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
    CREATE INDEX IF NOT EXISTS idx_documents_is_linked ON documents(is_linked);
  `);
}

// Register IPC handlers
export function registerDatabaseHandlers(): void {
    // ============ TERRAINS ============
    ipcMain.handle('db:getTerrains', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM terrains ORDER BY created_at DESC').all();
    });

    ipcMain.handle('db:getTerrain', (_event, id: string) => {
        if (!db) return null;
        return db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);
    });

    ipcMain.handle('db:createTerrain', (_event, terrain: Record<string, unknown>) => {
        if (!db) return null;
        const stmt = db.prepare(`
      INSERT INTO terrains (id, name, address, latitude, longitude, map_reference, area_size, area_unit, notes, created_at, updated_at)
      VALUES (@id, @name, @address, @latitude, @longitude, @mapReference, @areaSize, @areaUnit, @notes, @createdAt, @updatedAt)
    `);
        stmt.run(terrain);
        return terrain;
    });

    ipcMain.handle('db:updateTerrain', (_event, id: string, updates: Record<string, unknown>) => {
        if (!db) return null;
        const fields = Object.keys(updates).map(k => `${toSnakeCase(k)} = @${k}`).join(', ');
        const stmt = db.prepare(`UPDATE terrains SET ${fields} WHERE id = @id`);
        stmt.run({ ...updates, id });
        return db.prepare('SELECT * FROM terrains WHERE id = ?').get(id);
    });

    ipcMain.handle('db:deleteTerrain', (_event, id: string) => {
        if (!db) return false;
        const result = db.prepare('DELETE FROM terrains WHERE id = ?').run(id);
        return result.changes > 0;
    });

    // ============ CUSTOMERS ============
    ipcMain.handle('db:getCustomers', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM customers ORDER BY created_at DESC').all();
    });

    ipcMain.handle('db:getCustomer', (_event, id: string) => {
        if (!db) return null;
        return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    });

    ipcMain.handle('db:createCustomer', (_event, customer: Record<string, unknown>) => {
        if (!db) return null;
        const stmt = db.prepare(`
      INSERT INTO customers (id, type, name, email, phone, address, id_number, legal_reg_number, notes, created_at, updated_at)
      VALUES (@id, @type, @name, @email, @phone, @address, @idNumber, @legalRegNumber, @notes, @createdAt, @updatedAt)
    `);
        stmt.run(customer);
        return customer;
    });

    ipcMain.handle('db:updateCustomer', (_event, id: string, updates: Record<string, unknown>) => {
        if (!db) return null;
        const fields = Object.keys(updates).map(k => `${toSnakeCase(k)} = @${k}`).join(', ');
        const stmt = db.prepare(`UPDATE customers SET ${fields} WHERE id = @id`);
        stmt.run({ ...updates, id });
        return db.prepare('SELECT * FROM customers WHERE id = ?').get(id);
    });

    ipcMain.handle('db:deleteCustomer', (_event, id: string) => {
        if (!db) return false;
        const result = db.prepare('DELETE FROM customers WHERE id = ?').run(id);
        return result.changes > 0;
    });

    // ============ CONTRACTS ============
    ipcMain.handle('db:getContracts', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM contracts ORDER BY created_at DESC').all();
    });

    ipcMain.handle('db:getContract', (_event, id: string) => {
        if (!db) return null;
        const contract = db.prepare('SELECT * FROM contracts WHERE id = ?').get(id) as any;
        if (!contract) return null;

        // Fetch relations
        const terrains = db.prepare(`
            SELECT t.* FROM terrains t
            JOIN contract_terrains ct ON ct.terrain_id = t.id
            WHERE ct.contract_id = ?
        `).all(id);

        const parties = db.prepare(`
            SELECT c.*, cp.role FROM customers c
            JOIN contract_parties cp ON cp.customer_id = c.id
            WHERE cp.contract_id = ?
        `).all(id);

        return { ...contract, terrains, parties };
    });

    ipcMain.handle('db:createContract', (_event, contract: Record<string, unknown>) => {
        if (!db) return null;

        const { terrains, parties, ...contractData } = contract as any;

        const stmt = db.prepare(`
            INSERT INTO contracts (id, contract_number, type, status, start_date, end_date, terms, notes, created_at, updated_at)
            VALUES (@id, @contractNumber, @type, @status, @startDate, @endDate, @terms, @notes, @createdAt, @updatedAt)
        `);

        const insertTerrain = db.prepare('INSERT INTO contract_terrains (contract_id, terrain_id) VALUES (?, ?)');
        const insertParty = db.prepare('INSERT INTO contract_parties (contract_id, customer_id, role) VALUES (?, ?, ?)');

        db.transaction(() => {
            stmt.run(contractData);

            if (Array.isArray(terrains)) {
                for (const terrainId of terrains) {
                    insertTerrain.run(contractData.id, terrainId);
                }
            }

            if (Array.isArray(parties)) {
                for (const party of parties) {
                    insertParty.run(contractData.id, party.customerId, party.role);
                }
            }
        })();

        return contract;
    });

    ipcMain.handle('db:updateContract', (_event, id: string, updates: Record<string, unknown>) => {
        if (!db) return null;

        const { terrains, parties, ...contractData } = updates as any;

        // Update main contract fields
        if (Object.keys(contractData).length > 0) {
            const fields = Object.keys(contractData).map(k => `${toSnakeCase(k)} = @${k}`).join(', ');
            const stmt = db.prepare(`UPDATE contracts SET ${fields} WHERE id = @id`);
            stmt.run({ ...contractData, id });
        }

        // Update relations if provided
        if (terrains || parties) {
            db.transaction(() => {
                if (terrains && Array.isArray(terrains)) {
                    db!.prepare('DELETE FROM contract_terrains WHERE contract_id = ?').run(id);
                    const insertTerrain = db!.prepare('INSERT INTO contract_terrains (contract_id, terrain_id) VALUES (?, ?)');
                    for (const terrainId of terrains) {
                        insertTerrain.run(id, terrainId);
                    }
                }

                if (parties && Array.isArray(parties)) {
                    db!.prepare('DELETE FROM contract_parties WHERE contract_id = ?').run(id);
                    const insertParty = db!.prepare('INSERT INTO contract_parties (contract_id, customer_id, role) VALUES (?, ?, ?)');
                    for (const party of parties) {
                        insertParty.run(id, party.customerId, party.role);
                    }
                }
            })();
        }

        return db.prepare('SELECT * FROM contracts WHERE id = ?').get(id);
    });

    ipcMain.handle('db:deleteContract', (_event, id: string) => {
        if (!db) return false;
        const result = db.prepare('DELETE FROM contracts WHERE id = ?').run(id);
        return result.changes > 0;
    });

    ipcMain.handle('db:addContractParty', (_event, contractId: string, customerId: string, role: string) => {
        if (!db) return false;
        try {
            db.prepare('INSERT INTO contract_parties (contract_id, customer_id, role) VALUES (?, ?, ?)').run(contractId, customerId, role);
            return true;
        } catch (e) { console.error(e); return false; }
    });

    ipcMain.handle('db:addContractTerrain', (_event, contractId: string, terrainId: string) => {
        if (!db) return false;
        try {
            db.prepare('INSERT INTO contract_terrains (contract_id, terrain_id) VALUES (?, ?)').run(contractId, terrainId);
            return true;
        } catch (e) { console.error(e); return false; }
    });

    // ============ TRANSACTIONS ============
    ipcMain.handle('db:getTransactions', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM transactions ORDER BY transaction_date DESC').all();
    });

    ipcMain.handle('db:createTransaction', (_event, transaction: Record<string, unknown>) => {
        if (!db) return null;
        const stmt = db.prepare(`
      INSERT INTO transactions (id, contract_id, type, transaction_date, price, currency, notes, created_at, updated_at)
      VALUES (@id, @contractId, @type, @transactionDate, @price, @currency, @notes, @createdAt, @updatedAt)
    `);
        stmt.run(transaction);
        return transaction;
    });

    // ============ DOCUMENTS ============
    ipcMain.handle('db:getDocuments', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM documents ORDER BY created_at DESC').all();
    });

    ipcMain.handle('db:getUnlinkedDocuments', () => {
        if (!db) return [];
        return db.prepare('SELECT * FROM documents WHERE is_linked = 0 ORDER BY created_at DESC').all();
    });

    ipcMain.handle('db:upsertDocument', (_event, doc: Record<string, unknown>) => {
        if (!db) return null;
        const stmt = db.prepare(`
      INSERT INTO documents (id, google_drive_id, name, mime_type, type, size_bytes, thumbnail_url, uploaded_at, created_at, is_linked)
      VALUES (@id, @googleDriveId, @name, @mimeType, @type, @sizeBytes, @thumbnailUrl, @uploadedAt, @createdAt, @isLinked)
      ON CONFLICT(google_drive_id) DO UPDATE SET
        name = @name,
        mime_type = @mimeType,
        size_bytes = @sizeBytes,
        thumbnail_url = @thumbnailUrl
    `);
        stmt.run(doc);
        return doc;
    });

    ipcMain.handle('db:linkDocument', (_event, documentId: string, entityType: string, entityId: string) => {
        if (!db) return false;
        try {
            const tableName = `${entityType}_documents`;
            const idColumn = `${entityType}_id`;
            db.prepare(`INSERT OR IGNORE INTO ${tableName} (${idColumn}, document_id) VALUES (?, ?)`).run(entityId, documentId);
            db.prepare('UPDATE documents SET is_linked = 1 WHERE id = ?').run(documentId);
            return true;
        } catch (error) {
            console.error('[Database] Error linking document:', error);
            return false;
        }
    });

    ipcMain.handle('db:unlinkDocument', (_event, documentId: string, entityType: string, entityId: string) => {
        if (!db) return false;
        try {
            const tableName = `${entityType}_documents`;
            const idColumn = `${entityType}_id`;
            db.prepare(`DELETE FROM ${tableName} WHERE ${idColumn} = ? AND document_id = ?`).run(entityId, documentId);

            // Check if document is still linked to anything
            const stillLinked =
                db.prepare('SELECT 1 FROM terrain_documents WHERE document_id = ?').get(documentId) ||
                db.prepare('SELECT 1 FROM customer_documents WHERE document_id = ?').get(documentId) ||
                db.prepare('SELECT 1 FROM contract_documents WHERE document_id = ?').get(documentId);

            if (!stillLinked) {
                db.prepare('UPDATE documents SET is_linked = 0 WHERE id = ?').run(documentId);
            }
            return true;
        } catch (error) {
            console.error('[Database] Error unlinking document:', error);
            return false;
        }
    });

    // ============ SEARCH ============
    ipcMain.handle('db:search', (_event, query: string) => {
        if (!db) return { terrains: [], customers: [], contracts: [] };
        const searchPattern = `%${query}%`;

        const terrains = db.prepare('SELECT * FROM terrains WHERE name LIKE ? OR address LIKE ?').all(searchPattern, searchPattern);
        const customers = db.prepare('SELECT * FROM customers WHERE name LIKE ? OR email LIKE ?').all(searchPattern, searchPattern);
        const contracts = db.prepare('SELECT * FROM contracts WHERE contract_number LIKE ? OR notes LIKE ?').all(searchPattern, searchPattern);

        return { terrains, customers, contracts };
    });

    // ============ STATS ============
    ipcMain.handle('db:getStats', () => {
        if (!db) return { terrains: 0, customers: 0, contracts: 0, documents: 0 };

        const terrains = (db.prepare('SELECT COUNT(*) as count FROM terrains').get() as { count: number }).count;
        const customers = (db.prepare('SELECT COUNT(*) as count FROM customers').get() as { count: number }).count;
        const contracts = (db.prepare('SELECT COUNT(*) as count FROM contracts WHERE status = ?').get('active') as { count: number }).count;
        const documents = (db.prepare('SELECT COUNT(*) as count FROM documents').get() as { count: number }).count;

        return { terrains, customers, contracts, documents };
    });

    // ============ SETTINGS ============
    ipcMain.handle('db:getSetting', (_event, key: string) => {
        if (!db) return null;
        const row = db.prepare('SELECT value FROM app_settings WHERE key = ?').get(key) as { value: string } | undefined;
        return row?.value ?? null;
    });

    ipcMain.handle('db:setSetting', (_event, key: string, value: string) => {
        if (!db) return false;
        db.prepare('INSERT OR REPLACE INTO app_settings (key, value) VALUES (?, ?)').run(key, value);
        return true;
    });
}

// Helper: convert camelCase to snake_case
function toSnakeCase(str: string): string {
    return str.replace(/[A-Z]/g, letter => `_${letter.toLowerCase()}`);
}

// Close database
export function closeDatabase(): void {
    if (db) {
        db.close();
        db = null;
        console.log('[Database] Closed');
    }
}

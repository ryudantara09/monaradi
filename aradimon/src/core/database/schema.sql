-- Aradimon Database Schema
-- SQLite database for land/terrain management

-- Enable foreign keys
PRAGMA foreign_keys = ON;

-- ============================================
-- CORE TABLES
-- ============================================

-- Terrains (Land parcels)
CREATE TABLE IF NOT EXISTS terrains (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    address TEXT,
    latitude REAL,
    longitude REAL,
    map_reference TEXT,
    area_size REAL,
    area_unit TEXT DEFAULT 'sqm' CHECK(area_unit IN ('sqm', 'sqft', 'hectare', 'acre')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Customers (Individuals or legal entities)
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    type TEXT NOT NULL DEFAULT 'individual' CHECK(type IN ('individual', 'legal_entity')),
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

-- Contracts (Ownership, sale, purchase, lease agreements)
CREATE TABLE IF NOT EXISTS contracts (
    id TEXT PRIMARY KEY,
    contract_number TEXT,
    type TEXT NOT NULL CHECK(type IN ('ownership', 'sale', 'purchase', 'lease', 'other')),
    status TEXT NOT NULL DEFAULT 'draft' CHECK(status IN ('draft', 'active', 'expired', 'cancelled')),
    start_date TEXT,
    end_date TEXT,
    terms TEXT,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Transactions (Sales and purchases)
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    contract_id TEXT REFERENCES contracts(id) ON DELETE SET NULL,
    type TEXT NOT NULL CHECK(type IN ('sale', 'purchase')),
    transaction_date TEXT NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'USD',
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

-- Documents (Files stored in Google Drive)
CREATE TABLE IF NOT EXISTS documents (
    id TEXT PRIMARY KEY,
    google_drive_id TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    mime_type TEXT,
    type TEXT DEFAULT 'other' CHECK(type IN ('contract_photo', 'legal_doc', 'satellite_image', 'pdf', 'other')),
    size_bytes INTEGER,
    thumbnail_url TEXT,
    uploaded_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    is_linked INTEGER NOT NULL DEFAULT 0
);

-- ============================================
-- JUNCTION TABLES (Many-to-Many relationships)
-- ============================================

-- Contract Parties (Links customers to contracts with roles)
CREATE TABLE IF NOT EXISTS contract_parties (
    contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('owner', 'buyer', 'seller', 'lessor', 'lessee', 'party')),
    PRIMARY KEY (contract_id, customer_id, role)
);

-- Contract Terrains (Links terrains to contracts)
CREATE TABLE IF NOT EXISTS contract_terrains (
    contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, terrain_id)
);

-- Transaction Parties (Links customers to transactions as buyers/sellers)
CREATE TABLE IF NOT EXISTS transaction_parties (
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK(role IN ('buyer', 'seller')),
    PRIMARY KEY (transaction_id, customer_id, role)
);

-- Transaction Terrains (Links terrains to transactions)
CREATE TABLE IF NOT EXISTS transaction_terrains (
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, terrain_id)
);

-- Ownership History (Tracks historical ownership of terrains)
CREATE TABLE IF NOT EXISTS ownership_history (
    id TEXT PRIMARY KEY,
    terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    start_date TEXT NOT NULL,
    end_date TEXT,
    notes TEXT
);

-- ============================================
-- DOCUMENT LINKING TABLES
-- ============================================

-- Terrain Documents
CREATE TABLE IF NOT EXISTS terrain_documents (
    terrain_id TEXT NOT NULL REFERENCES terrains(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (terrain_id, document_id)
);

-- Customer Documents
CREATE TABLE IF NOT EXISTS customer_documents (
    customer_id TEXT NOT NULL REFERENCES customers(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (customer_id, document_id)
);

-- Contract Documents
CREATE TABLE IF NOT EXISTS contract_documents (
    contract_id TEXT NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (contract_id, document_id)
);

-- Transaction Documents
CREATE TABLE IF NOT EXISTS transaction_documents (
    transaction_id TEXT NOT NULL REFERENCES transactions(id) ON DELETE CASCADE,
    document_id TEXT NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    PRIMARY KEY (transaction_id, document_id)
);

-- ============================================
-- APP SETTINGS
-- ============================================

CREATE TABLE IF NOT EXISTS app_settings (
    key TEXT PRIMARY KEY,
    value TEXT
);

-- ============================================
-- INDEXES
-- ============================================

CREATE INDEX IF NOT EXISTS idx_terrains_name ON terrains(name);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_contracts_status ON contracts(status);
CREATE INDEX IF NOT EXISTS idx_contracts_type ON contracts(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_documents_drive_id ON documents(google_drive_id);
CREATE INDEX IF NOT EXISTS idx_documents_is_linked ON documents(is_linked);
CREATE INDEX IF NOT EXISTS idx_ownership_history_terrain ON ownership_history(terrain_id);
CREATE INDEX IF NOT EXISTS idx_ownership_history_customer ON ownership_history(customer_id);

-- ============================================
-- TRIGGERS
-- ============================================

-- Update timestamp trigger for terrains
CREATE TRIGGER IF NOT EXISTS update_terrain_timestamp 
AFTER UPDATE ON terrains
BEGIN
    UPDATE terrains SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update timestamp trigger for customers
CREATE TRIGGER IF NOT EXISTS update_customer_timestamp 
AFTER UPDATE ON customers
BEGIN
    UPDATE customers SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update timestamp trigger for contracts
CREATE TRIGGER IF NOT EXISTS update_contract_timestamp 
AFTER UPDATE ON contracts
BEGIN
    UPDATE contracts SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update timestamp trigger for transactions
CREATE TRIGGER IF NOT EXISTS update_transaction_timestamp 
AFTER UPDATE ON transactions
BEGIN
    UPDATE transactions SET updated_at = datetime('now') WHERE id = NEW.id;
END;

-- Update is_linked flag when document is linked to any entity
CREATE TRIGGER IF NOT EXISTS update_document_linked_terrain
AFTER INSERT ON terrain_documents
BEGIN
    UPDATE documents SET is_linked = 1 WHERE id = NEW.document_id;
END;

CREATE TRIGGER IF NOT EXISTS update_document_linked_customer
AFTER INSERT ON customer_documents
BEGIN
    UPDATE documents SET is_linked = 1 WHERE id = NEW.document_id;
END;

CREATE TRIGGER IF NOT EXISTS update_document_linked_contract
AFTER INSERT ON contract_documents
BEGIN
    UPDATE documents SET is_linked = 1 WHERE id = NEW.document_id;
END;

CREATE TRIGGER IF NOT EXISTS update_document_linked_transaction
AFTER INSERT ON transaction_documents
BEGIN
    UPDATE documents SET is_linked = 1 WHERE id = NEW.document_id;
END;

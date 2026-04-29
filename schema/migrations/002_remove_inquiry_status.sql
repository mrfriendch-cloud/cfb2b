-- Migration: Remove status column from inquiries table
-- Date: 2026-04-29
-- Description: Remove the status column as it's no longer needed

-- SQLite doesn't support DROP COLUMN directly, so we need to:
-- 1. Create a new table without the status column
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to original name
-- 5. Recreate indexes

-- Step 1: Create new inquiries table without status column
CREATE TABLE IF NOT EXISTS inquiries_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  country TEXT,
  message TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Step 2: Copy data from old table to new table
INSERT INTO inquiries_new (id, product_id, name, email, company, phone, country, message, created_at, updated_at)
SELECT id, product_id, name, email, company, phone, country, message, created_at, updated_at
FROM inquiries;

-- Step 3: Drop old table
DROP TABLE inquiries;

-- Step 4: Rename new table to original name
ALTER TABLE inquiries_new RENAME TO inquiries;

-- Step 5: Recreate indexes (without status index)
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);

-- Note: The idx_inquiries_status index is intentionally not recreated as the status column no longer exists

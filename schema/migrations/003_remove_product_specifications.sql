-- Migration: Remove specifications column from products table
-- Date: 2026-04-29
-- Description: Remove the specifications column as it's no longer needed

-- SQLite doesn't support DROP COLUMN directly, so we need to:
-- 1. Create a new table without the specifications column
-- 2. Copy data from old table to new table
-- 3. Drop old table
-- 4. Rename new table to original name
-- 5. Recreate indexes

-- Step 1: Create new products table without specifications column
CREATE TABLE IF NOT EXISTS products_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  detailed_description TEXT,
  image_url TEXT,
  gallery_images TEXT,
  category_id INTEGER,
  price REAL DEFAULT NULL,
  quantity INTEGER DEFAULT NULL,
  is_featured BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Step 2: Copy data from old table to new table (excluding specifications)
INSERT INTO products_new (id, name, description, detailed_description, image_url, gallery_images, category_id, price, quantity, is_featured, is_active, created_at, updated_at)
SELECT id, name, description, detailed_description, image_url, gallery_images, category_id, price, quantity, is_featured, is_active, created_at, updated_at
FROM products;

-- Step 3: Drop old table
DROP TABLE products;

-- Step 4: Rename new table to original name
ALTER TABLE products_new RENAME TO products;

-- Step 5: Recreate indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);

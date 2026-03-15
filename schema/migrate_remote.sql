-- Migration: bring remote D1 up to current schema

-- 1. Create categories table (missing from remote)
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add category_id column to products (if not exists)
ALTER TABLE products ADD COLUMN category_id INTEGER REFERENCES categories(id);

-- 3. Create indexes
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);

-- 4. Seed admins
INSERT OR IGNORE INTO admins (username, password_hash, email, role)
VALUES
('admin123', '240be518fabd2724ddb6f04eeb1da5967448d7e831c08c8fa822809f74c720a9', 'admin@example.com', 'admin'),
('staff', '10176e7b7b24d317acfcf8d2064cfd2f24e154f7b5a96603077d5ef813d6a6b6', 'staff@example.com', 'admin');

-- 5. Seed categories
INSERT OR IGNORE INTO categories (id, name, description)
VALUES
(1, 'Industrial', 'Heavy duty industrial equipment and materials'),
(2, 'Technology', 'Advanced technological solutions and devices'),
(3, 'Equipment', 'Professional grade tools and equipment');

-- 6. Seed products (using category_id)
INSERT OR IGNORE INTO products (id, name, description, detailed_description, specifications, image_url, category_id, is_featured)
VALUES
(1, 'Sample Product 1', 'High-quality industrial product', 'This is a detailed description of our flagship product...', 'Material: Steel\nDimensions: 100x50x30cm\nWeight: 25kg', '/images/product1.jpg', 1, 1),
(2, 'Sample Product 2', 'Innovative technology solution', 'Advanced technology product with superior performance...', 'Power: 220V\nCapacity: 500L\nCertification: CE, ISO9001', '/images/product2.jpg', 2, 1),
(3, 'Sample Product 3', 'Premium quality equipment', 'Reliable equipment for professional use...', 'Model: XYZ-3000\nWarranty: 2 years\nOrigin: Made in China', '/images/product3.jpg', 3, 0);

-- B2B Website Database Schema for Cloudflare D1

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT UNIQUE NOT NULL,
  description TEXT,
  image_url TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Products Table
CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  name TEXT NOT NULL,
  description TEXT,
  detailed_description TEXT,
  specifications TEXT,
  image_url TEXT,
  gallery_images TEXT, -- JSON array of image URLs
  category_id INTEGER,
  price REAL DEFAULT NULL,
  quantity INTEGER DEFAULT NULL,
  is_featured BOOLEAN DEFAULT 0,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (category_id) REFERENCES categories(id)
);

-- Inquiries Table
CREATE TABLE IF NOT EXISTS inquiries (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  product_id INTEGER,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  company TEXT,
  phone TEXT,
  country TEXT,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'pending', -- pending, processing, completed
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Admins Table
CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  email TEXT,
  role TEXT DEFAULT 'admin', -- super_admin, admin
  last_login DATETIME,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_category_id ON products(category_id);
CREATE INDEX IF NOT EXISTS idx_products_featured ON products(is_featured);
CREATE INDEX IF NOT EXISTS idx_inquiries_status ON inquiries(status);
CREATE INDEX IF NOT EXISTS idx_inquiries_product ON inquiries(product_id);


INSERT OR IGNORE INTO admins (username, password_hash, email, role)
VALUES
('admin123', '12d2c410aae289aa4a586e6851cc55bd7b8b47d470f5cceef5f08653af8cf62d', 'admin@example.com', 'admin'),
('staff', '64b3d16d8723524ef0bfde63fbef11deadabbe34b47963d1c56e80feab497bce', 'staff@example.com', 'admin');

-- Insert sample categories
INSERT OR IGNORE INTO categories (id, name, description)
VALUES
(1, 'Industrial', 'Heavy duty industrial equipment and materials'),
(2, 'Technology', 'Advanced technological solutions and devices'),
(3, 'Equipment', 'Professional grade tools and equipment');

-- Insert sample products
INSERT OR IGNORE INTO products (id, name, description, detailed_description, specifications, image_url, category_id, is_featured)
VALUES
(1, 'Sample Product 1', 'High-quality industrial product', 'This is a detailed description of our flagship product...', 'Material: Steel\nDimensions: 100x50x30cm\nWeight: 25kg', '/images/product1.jpg', 1, 1),
(2, 'Sample Product 2', 'Innovative technology solution', 'Advanced technology product with superior performance...', 'Power: 220V\nCapacity: 500L\nCertification: CE, ISO9001', '/images/product2.jpg', 2, 1),
(3, 'Sample Product 3', 'Premium quality equipment', 'Reliable equipment for professional use...', 'Model: XYZ-3000\nWarranty: 2 years\nOrigin: Made in China', '/images/product3.jpg', 3, 0);

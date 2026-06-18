-- SEO Optimization System Database Migration
-- This migration adds tables for URL management, redirects, SEO settings, and performance tracking

-- Product Slugs Table
-- Maps product IDs to SEO-friendly URL slugs
CREATE TABLE IF NOT EXISTS product_slugs (
  product_id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
);

-- Create index for fast slug lookups
CREATE INDEX IF NOT EXISTS idx_product_slugs_slug ON product_slugs(slug);

-- Redirects Table
-- Manages 301 redirects for changed URLs to preserve SEO value
CREATE TABLE IF NOT EXISTS redirects (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  from_url TEXT UNIQUE NOT NULL,
  to_url TEXT NOT NULL,
  status_code INTEGER DEFAULT 301,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create index for fast redirect resolution
CREATE INDEX IF NOT EXISTS idx_redirects_from_url ON redirects(from_url);

-- SEO Settings Table
-- Stores configuration key-value pairs for the SEO system
CREATE TABLE IF NOT EXISTS seo_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  description TEXT,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Performance Metrics Table
-- Tracks Core Web Vitals and other performance metrics
CREATE TABLE IF NOT EXISTS performance_metrics (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  metric_name TEXT NOT NULL, -- LCP, FID, CLS, etc.
  metric_value REAL NOT NULL,
  metric_delta REAL,
  page_url TEXT NOT NULL,
  page_type TEXT, -- home, category, product
  user_agent TEXT,
  timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance metrics analysis
CREATE INDEX IF NOT EXISTS idx_performance_metrics_name ON performance_metrics(metric_name);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_page_type ON performance_metrics(page_type);
CREATE INDEX IF NOT EXISTS idx_performance_metrics_timestamp ON performance_metrics(timestamp);

-- Insert default SEO settings
INSERT OR IGNORE INTO seo_settings (key, value, description)
VALUES
  ('base_url', 'https://yourdomain.com', 'Base URL for the website (used in canonical URLs and sitemaps)'),
  ('site_name', 'B2B Product Exhibition', 'Official site name for meta tags and structured data'),
  ('logo_url', 'https://yourdomain.com/images/logo.png', 'Company logo URL for Organization schema'),
  ('email', 'contact@yourdomain.com', 'Contact email for Organization schema'),
  ('phone', '+1-234-567-8900', 'Contact phone for Organization schema'),
  ('default_meta_description', 'High-quality industrial products and B2B solutions for businesses worldwide.', 'Default meta description for pages without specific descriptions'),
  ('default_og_image', 'https://yourdomain.com/images/og-default.jpg', 'Default Open Graph image for social sharing'),
  ('twitter_handle', '@yourbusiness', 'Twitter handle for Twitter Card tags'),
  ('brand_name', 'B2B Product Exhibition', 'Brand name for Product schema'),
  ('currency', 'USD', 'Default currency for product pricing');

-- Comment: This migration should be run using:
-- wrangler d1 execute DB_NAME --file=./schema/seo-migration.sql --local (for local development)
-- wrangler d1 execute DB_NAME --file=./schema/seo-migration.sql --remote (for production)

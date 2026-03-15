-- Migration: add price and quantity to products table
ALTER TABLE products ADD COLUMN price REAL DEFAULT NULL;
ALTER TABLE products ADD COLUMN quantity INTEGER DEFAULT NULL;

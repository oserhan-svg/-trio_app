-- Database Schema for Emlak Takip MVP

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'consultant')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Properties Table
CREATE TABLE IF NOT EXISTS properties (
    id SERIAL PRIMARY KEY,
    external_id VARCHAR(255) UNIQUE, -- ID from sahibinden.com
    title VARCHAR(255) NOT NULL,
    price DECIMAL(12, 2) NOT NULL,
    size_m2 DECIMAL(10, 2),
    rooms VARCHAR(50),
    district VARCHAR(100),
    neighborhood VARCHAR(100),
    url TEXT NOT NULL,
    seller_phone VARCHAR(50),
    last_scraped TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Property History Table (for price tracking)
CREATE TABLE IF NOT EXISTS property_history (
    id SERIAL PRIMARY KEY,
    property_id INTEGER REFERENCES properties(id) ON DELETE CASCADE,
    price DECIMAL(12, 2) NOT NULL,
    change_type VARCHAR(50), -- 'initial', 'price_increase', 'price_decrease'
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX idx_properties_external_id ON properties(external_id);
CREATE INDEX idx_properties_last_scraped ON properties(last_scraped);

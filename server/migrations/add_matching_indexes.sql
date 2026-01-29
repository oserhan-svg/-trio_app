-- Migration: Add database indexes for matching optimization
-- This migration creates indexes to speed up the matching queries

-- Index for price range queries on active sale listings
CREATE INDEX IF NOT EXISTS idx_property_price_type ON "Property" (listing_type, price) WHERE status != 'removed';

-- Index for neighborhood text search (case-insensitive)
CREATE INDEX IF NOT EXISTS idx_property_neighborhood_lower ON "Property" (LOWER(neighborhood));

-- Index for district text search (case-insensitive) 
CREATE INDEX IF NOT EXISTS idx_property_district_lower ON "Property" (LOWER(district));

-- Index for rooms filtering
CREATE INDEX IF NOT EXISTS idx_property_rooms ON "Property" (rooms) WHERE status != 'removed';

-- Composite index for common matching queries (listing type + status + created_at)
CREATE INDEX IF NOT EXISTS idx_property_status_created ON "Property" (listing_type, status, created_at DESC);

-- Index for clientProperty recent matches query (status + added_at)
CREATE INDEX IF NOT EXISTS idx_clientproperty_status_added ON "ClientProperty" (status, added_at DESC);

-- Index for demand lookup by client
CREATE INDEX IF NOT EXISTS idx_demand_client ON "Demand" (client_id);

-- Analyze tables to update query planner statistics
ANALYZE "Property";
ANALYZE "ClientProperty";
ANALYZE "Demand";

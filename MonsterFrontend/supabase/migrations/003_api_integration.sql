-- API Integration Tables Migration
-- This migration adds tables for managing external API integrations

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- API Integration Configuration
CREATE TABLE api_integrations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL, -- shopify, woocommerce, rapidapi, fakestore, etc.
    api_url TEXT,
    api_key TEXT, -- encrypted
    api_secret TEXT, -- encrypted
    is_active BOOLEAN DEFAULT true,
    sync_interval_minutes INTEGER DEFAULT 60, -- default 1 hour
    last_sync_at TIMESTAMP WITH TIME ZONE,
    config JSONB DEFAULT '{}', -- provider-specific configuration
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Sync History/Logs
CREATE TABLE api_sync_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    sync_type VARCHAR(20) NOT NULL, -- full, incremental, manual
    status VARCHAR(20) NOT NULL DEFAULT 'pending', -- pending, running, completed, failed
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    products_created INTEGER DEFAULT 0,
    products_updated INTEGER DEFAULT 0,
    products_failed INTEGER DEFAULT 0,
    error_message TEXT,
    details JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- External Product Mapping
CREATE TABLE external_product_mappings (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    integration_id UUID NOT NULL REFERENCES api_integrations(id) ON DELETE CASCADE,
    external_id VARCHAR(255) NOT NULL,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    external_data JSONB DEFAULT '{}', -- cached API response
    last_synced_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    sync_status VARCHAR(20) DEFAULT 'synced', -- synced, failed, pending
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(integration_id, external_id)
);

-- Create indexes for better performance
CREATE INDEX idx_api_integrations_provider ON api_integrations(provider);
CREATE INDEX idx_api_integrations_active ON api_integrations(is_active);
CREATE INDEX idx_api_sync_logs_integration ON api_sync_logs(integration_id);
CREATE INDEX idx_api_sync_logs_status ON api_sync_logs(status);
CREATE INDEX idx_api_sync_logs_started_at ON api_sync_logs(started_at DESC);
CREATE INDEX idx_external_product_mappings_integration ON external_product_mappings(integration_id);
CREATE INDEX idx_external_product_mappings_external_id ON external_product_mappings(external_id);
CREATE INDEX idx_external_product_mappings_product ON external_product_mappings(product_id);

-- Create function to update updated_at timestamp for api_integrations and external_product_mappings
CREATE TRIGGER update_api_integrations_updated_at 
    BEFORE UPDATE ON api_integrations 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_external_product_mappings_updated_at 
    BEFORE UPDATE ON external_product_mappings 
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert default FakeStoreAPI integration
INSERT INTO api_integrations (name, provider, api_url, is_active, sync_interval_minutes, config) VALUES
('FakeStoreAPI', 'fakestore', 'https://fakestoreapi.com', true, 60, '{}');

-- Create views for easier queries
CREATE VIEW api_sync_summary AS
SELECT 
    ai.id as integration_id,
    ai.name as integration_name,
    ai.provider,
    ai.is_active,
    ai.last_sync_at,
    COUNT(sl.id) as total_syncs,
    COUNT(CASE WHEN sl.status = 'completed' THEN 1 END) as completed_syncs,
    COUNT(CASE WHEN sl.status = 'failed' THEN 1 END) as failed_syncs,
    COALESCE(SUM(sl.products_created), 0) as total_products_created,
    COALESCE(SUM(sl.products_updated), 0) as total_products_updated
FROM api_integrations ai
LEFT JOIN api_sync_logs sl ON ai.id = sl.integration_id
GROUP BY ai.id, ai.name, ai.provider, ai.is_active, ai.last_sync_at;

-- Add RLS policies for admin access only
ALTER TABLE api_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE api_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE external_product_mappings ENABLE ROW LEVEL SECURITY;

-- Policy for api_integrations - only admins can manage
CREATE POLICY "Admins can manage api integrations" ON api_integrations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'admin'
        )
    );

-- Policy for api_sync_logs - only admins can view
CREATE POLICY "Admins can view sync logs" ON api_sync_logs
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'admin'
        )
    );

-- Policy for external_product_mappings - only admins can manage
CREATE POLICY "Admins can manage product mappings" ON external_product_mappings
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM users
            WHERE users.id = auth.uid()
            AND users.user_type = 'admin'
        )
    );
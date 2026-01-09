-- Complete Monster Backend Database Setup
-- Run this script in Supabase SQL Editor to create all missing tables, storage buckets, and configurations

-- =====================================================
-- 1. ADD MISSING COLUMNS TO EXISTING TABLES
-- =====================================================

-- Add missing columns to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS gender TEXT CHECK (gender IN ('male', 'female', 'unisex', 'kids')),
ADD COLUMN IF NOT EXISTS target_audience TEXT CHECK (target_audience IN ('men', 'women', 'kids', 'adults', 'unisex')),
ADD COLUMN IF NOT EXISTS product_type TEXT,
ADD COLUMN IF NOT EXISTS wholesale_price DECIMAL(10,2),
ADD COLUMN IF NOT EXISTS image_url TEXT,
ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'draft'));

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_products_gender ON products(gender);
CREATE INDEX IF NOT EXISTS idx_products_target_audience ON products(target_audience);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- =====================================================
-- 2. CREATE MISSING TABLES
-- =====================================================

-- Discounts table
CREATE TABLE IF NOT EXISTS discounts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    code VARCHAR(50) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed_amount', 'free_shipping')),
    value DECIMAL(10,2) NOT NULL,
    min_order_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    usage_limit INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price rules table
CREATE TABLE IF NOT EXISTS price_rules (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    rule_type VARCHAR(50) NOT NULL CHECK (rule_type IN ('bulk_discount', 'seasonal', 'flash_sale', 'clearance')),
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    category_id UUID REFERENCES categories(id) ON DELETE CASCADE,
    discount_percentage DECIMAL(5,2),
    fixed_price DECIMAL(10,2),
    min_quantity INTEGER,
    valid_from TIMESTAMP WITH TIME ZONE,
    valid_until TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Stock movements table
CREATE TABLE IF NOT EXISTS stock_movements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('in', 'out', 'adjustment', 'return', 'damage')),
    quantity_change INTEGER NOT NULL,
    previous_quantity INTEGER NOT NULL,
    new_quantity INTEGER NOT NULL,
    reference_type VARCHAR(50), -- 'order', 'purchase', 'adjustment', 'return'
    reference_id UUID,
    notes TEXT,
    created_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin low stock alerts table
CREATE TABLE IF NOT EXISTS admin_low_stock_alerts (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    product_variant_id UUID REFERENCES product_variants(id) ON DELETE CASCADE,
    product_id UUID REFERENCES products(id) ON DELETE CASCADE,
    current_stock INTEGER NOT NULL,
    threshold_level INTEGER NOT NULL,
    alert_level VARCHAR(20) DEFAULT 'warning' CHECK (alert_level IN ('warning', 'critical', 'out_of_stock')),
    is_resolved BOOLEAN DEFAULT false,
    resolved_at TIMESTAMP WITH TIME ZONE,
    resolved_by UUID,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =====================================================
-- 3. CREATE INDEXES FOR PERFORMANCE
-- =====================================================

-- Discounts indexes
CREATE INDEX IF NOT EXISTS idx_discounts_code ON discounts(code);
CREATE INDEX IF NOT EXISTS idx_discounts_active ON discounts(is_active);
CREATE INDEX IF NOT EXISTS idx_discounts_validity ON discounts(valid_from, valid_until);

-- Price rules indexes
CREATE INDEX IF NOT EXISTS idx_price_rules_product ON price_rules(product_id);
CREATE INDEX IF NOT EXISTS idx_price_rules_category ON price_rules(category_id);
CREATE INDEX IF NOT EXISTS idx_price_rules_active ON price_rules(is_active);

-- Stock movements indexes
CREATE INDEX IF NOT EXISTS idx_stock_movements_variant ON stock_movements(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_product ON stock_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_stock_movements_type ON stock_movements(movement_type);
CREATE INDEX IF NOT EXISTS idx_stock_movements_date ON stock_movements(created_at);

-- Admin alerts indexes
CREATE INDEX IF NOT EXISTS idx_admin_alerts_variant ON admin_low_stock_alerts(product_variant_id);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_resolved ON admin_low_stock_alerts(is_resolved);
CREATE INDEX IF NOT EXISTS idx_admin_alerts_level ON admin_low_stock_alerts(alert_level);

-- =====================================================
-- 4. CREATE FUNCTIONS FOR AUTOMATION
-- =====================================================

-- Function to update stock movements automatically
CREATE OR REPLACE FUNCTION update_stock_movement()
RETURNS TRIGGER AS $$
BEGIN
    -- Insert stock movement record when product_variants.stock_quantity changes
    IF TG_OP = 'UPDATE' AND OLD.stock_quantity != NEW.stock_quantity THEN
        INSERT INTO stock_movements (
            product_variant_id,
            product_id,
            movement_type,
            quantity_change,
            previous_quantity,
            new_quantity,
            reference_type,
            reference_id
        ) VALUES (
            NEW.id,
            NEW.product_id,
            CASE 
                WHEN NEW.stock_quantity > OLD.stock_quantity THEN 'in'
                WHEN NEW.stock_quantity < OLD.stock_quantity THEN 'out'
                ELSE 'adjustment'
            END,
            NEW.stock_quantity - OLD.stock_quantity,
            OLD.stock_quantity,
            NEW.stock_quantity,
            'manual',
            NULL
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic stock movement logging
DROP TRIGGER IF EXISTS trigger_stock_movement ON product_variants;
CREATE TRIGGER trigger_stock_movement
    AFTER UPDATE OF stock_quantity ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION update_stock_movement();

-- Function to create low stock alerts
CREATE OR REPLACE FUNCTION create_low_stock_alert()
RETURNS TRIGGER AS $$
BEGIN
    -- Create alert when stock falls below threshold
    IF NEW.stock_quantity <= NEW.min_stock_level THEN
        INSERT INTO admin_low_stock_alerts (
            product_variant_id,
            product_id,
            current_stock,
            threshold_level,
            alert_level
        ) VALUES (
            NEW.id,
            NEW.product_id,
            NEW.stock_quantity,
            NEW.min_stock_level,
            CASE 
                WHEN NEW.stock_quantity = 0 THEN 'out_of_stock'
                WHEN NEW.stock_quantity <= (NEW.min_stock_level * 0.5) THEN 'critical'
                ELSE 'warning'
            END
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic low stock alerts
DROP TRIGGER IF EXISTS trigger_low_stock_alert ON product_variants;
CREATE TRIGGER trigger_low_stock_alert
    AFTER UPDATE OF stock_quantity ON product_variants
    FOR EACH ROW
    EXECUTE FUNCTION create_low_stock_alert();

-- =====================================================
-- 5. STORAGE BUCKETS SETUP
-- =====================================================

-- Products images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-images',
    'product-images',
    true,
    10485760, -- 10MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Product galleries bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'product-galleries',
    'product-galleries',
    true,
    20971520, -- 20MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- Category images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'category-images',
    'category-images',
    true,
    5242880, -- 5MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- User avatars bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
    'user-avatars',
    'user-avatars',
    false, -- Private by default
    2097152, -- 2MB limit
    ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
) ON CONFLICT (id) DO UPDATE SET
    public = EXCLUDED.public,
    file_size_limit = EXCLUDED.file_size_limit,
    allowed_mime_types = EXCLUDED.allowed_mime_types;

-- =====================================================
-- 6. STORAGE POLICIES
-- =====================================================

-- Product images policies (public read)
CREATE POLICY "Public access for product images" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-images');

CREATE POLICY "Authenticated users can upload product images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-images' AND 
        auth.role() = 'authenticated'
    );

-- Product galleries policies
CREATE POLICY "Public access for product galleries" ON storage.objects
    FOR SELECT USING (bucket_id = 'product-galleries');

CREATE POLICY "Authenticated users can upload gallery images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'product-galleries' AND 
        auth.role() = 'authenticated'
    );

-- Category images policies
CREATE POLICY "Public access for category images" ON storage.objects
    FOR SELECT USING (bucket_id = 'category-images');

CREATE POLICY "Admin users can upload category images" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'category-images' AND 
        auth.role() = 'authenticated'
    );

-- User avatars policies (private)
CREATE POLICY "Users can view their own avatar" ON storage.objects
    FOR SELECT USING (
        bucket_id = 'user-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can upload their own avatar" ON storage.objects
    FOR INSERT WITH CHECK (
        bucket_id = 'user-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can update their own avatar" ON storage.objects
    FOR UPDATE USING (
        bucket_id = 'user-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

CREATE POLICY "Users can delete their own avatar" ON storage.objects
    FOR DELETE USING (
        bucket_id = 'user-avatars' AND 
        auth.uid()::text = (storage.foldername(name))[1]
    );

-- =====================================================
-- 7. SAMPLE DATA FOR TESTING
-- =====================================================

-- Insert sample discounts
INSERT INTO discounts (code, name, type, value, min_order_amount, valid_from, valid_until, is_active) VALUES
('WELCOME10', 'Welcome Discount', 'percentage', 10.00, 50.00, NOW(), NOW() + INTERVAL '30 days', true),
('SAVE20', 'Save Big', 'fixed_amount', 20.00, 100.00, NOW(), NOW() + INTERVAL '7 days', true)
ON CONFLICT (code) DO NOTHING;

-- Insert sample price rules
INSERT INTO price_rules (name, rule_type, discount_percentage, min_quantity, valid_from, valid_until, is_active) VALUES
('Bulk Discount', 'bulk_discount', 15.00, 5, NOW(), NOW() + INTERVAL '90 days', true),
('Flash Sale', 'flash_sale', 25.00, 1, NOW(), NOW() + INTERVAL '24 hours', true)
ON CONFLICT DO NOTHING;

-- =====================================================
-- 8. ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all new tables
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_low_stock_alerts ENABLE ROW LEVEL SECURITY;

-- Create policies for authenticated access
CREATE POLICY "Allow authenticated users to read discounts" ON discounts
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read price rules" ON price_rules
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read stock movements" ON stock_movements
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allow authenticated users to read admin alerts" ON admin_low_stock_alerts
    FOR SELECT USING (auth.role() = 'authenticated');

-- Service role policies (for backend operations)
CREATE POLICY "Allow service role full access to discounts" ON discounts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to price rules" ON price_rules
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to stock movements" ON stock_movements
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Allow service role full access to admin alerts" ON admin_low_stock_alerts
    FOR ALL USING (auth.role() = 'service_role');

-- =====================================================
-- 9. COMPLETION MESSAGE
-- =====================================================

SELECT 'Complete database and storage setup finished successfully!' as status,
       'Tables: discounts, price_rules, stock_movements, admin_low_stock_alerts' as tables_created,
       'Storage: product-images, product-galleries, category-images, user-avatars' as storage_buckets,
       'Features: Auto stock tracking, Low stock alerts, Discount management' as features_enabled;
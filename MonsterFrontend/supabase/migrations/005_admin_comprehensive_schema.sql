-- Comprehensive Admin Panel Database Schema
-- This migration fixes all field mismatches and adds missing admin functionality

-- Create comprehensive product_stock table for better inventory management
CREATE TABLE IF NOT EXISTS product_stock (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(10) NOT NULL,
    quantity INTEGER DEFAULT 0,
    min_stock_level INTEGER DEFAULT 5,
    max_stock_level INTEGER DEFAULT 100,
    location VARCHAR(100), -- Warehouse location
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, size)
);

-- Create order_status_history table for tracking order status changes
CREATE TABLE IF NOT EXISTS order_status_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
    old_status VARCHAR(50),
    new_status VARCHAR(50) NOT NULL,
    changed_by UUID REFERENCES users(id),
    notes TEXT,
    changed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create product_media table for better media management
CREATE TABLE IF NOT EXISTS product_media (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    media_url TEXT NOT NULL,
    media_type VARCHAR(20) NOT NULL CHECK (media_type IN ('image', 'video')),
    alt_text VARCHAR(255),
    display_order INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    file_size INTEGER,
    mime_type VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create admin_notifications table for system notifications
CREATE TABLE IF NOT EXISTS admin_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    type VARCHAR(50) NOT NULL, -- 'low_stock', 'new_order', 'system_alert'
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    severity VARCHAR(20) DEFAULT 'info' CHECK (severity IN ('info', 'warning', 'error', 'success')),
    is_read BOOLEAN DEFAULT false,
    action_url TEXT,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Update products table with additional fields for admin functionality
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS slug VARCHAR(255) UNIQUE,
ADD COLUMN IF NOT EXISTS meta_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS tags TEXT[],
ADD COLUMN IF NOT EXISTS colors TEXT[],
ADD COLUMN IF NOT EXISTS weight DECIMAL(8,2),
ADD COLUMN IF NOT EXISTS dimensions JSONB,
ADD COLUMN IF NOT EXISTS seo_title VARCHAR(255),
ADD COLUMN IF NOT EXISTS seo_description TEXT;

-- Ensure all required fields exist and have proper defaults
UPDATE products SET
    slug = LOWER(REGEXP_REPLACE(COALESCE(product_title, name), '[^a-zA-Z0-9]+', '-', 'g')),
    target_audience = COALESCE(target_audience, 'buyer'),
    moq = COALESCE(moq, 1),
    stock_alert_threshold = COALESCE(stock_alert_threshold, 10),
    gender = COALESCE(gender, 'Unisex'),
    is_active = COALESCE(is_active, true),
    is_featured = COALESCE(is_featured, false)
WHERE slug IS NULL OR target_audience IS NULL OR moq IS NULL;

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_product_stock_product_id ON product_stock(product_id);
CREATE INDEX IF NOT EXISTS idx_product_stock_size ON product_stock(size);
CREATE INDEX IF NOT EXISTS idx_product_stock_low_stock ON product_stock(quantity, min_stock_level);
CREATE INDEX IF NOT EXISTS idx_order_status_history_order_id ON order_status_history(order_id);
CREATE INDEX IF NOT EXISTS idx_order_status_history_changed_at ON order_status_history(changed_at);
CREATE INDEX IF NOT EXISTS idx_product_media_product_id ON product_media(product_id);
CREATE INDEX IF NOT EXISTS idx_product_media_display_order ON product_media(display_order);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_type ON admin_notifications(type);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_is_read ON admin_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_admin_notifications_created_at ON admin_notifications(created_at);

-- Create function to generate unique slugs
CREATE OR REPLACE FUNCTION generate_unique_slug(title TEXT, table_name TEXT, exclude_id UUID DEFAULT NULL)
RETURNS TEXT AS $$
DECLARE
    base_slug TEXT;
    final_slug TEXT;
    counter INTEGER := 1;
BEGIN
    -- Generate base slug
    base_slug := LOWER(REGEXP_REPLACE(title, '[^a-zA-Z0-9]+', '-', 'g'));
    base_slug := TRIM(BOTH '-' FROM base_slug);
    
    -- Ensure slug is not empty
    IF base_slug = '' THEN
        base_slug := 'product';
    END IF;
    
    final_slug := base_slug;
    
    -- Check for uniqueness
    LOOP
        IF exclude_id IS NULL THEN
            IF NOT EXISTS (SELECT 1 FROM products WHERE slug = final_slug) THEN
                EXIT;
            END IF;
        ELSE
            IF NOT EXISTS (SELECT 1 FROM products WHERE slug = final_slug AND id != exclude_id) THEN
                EXIT;
            END IF;
        END IF;
        
        final_slug := base_slug || '-' || counter;
        counter := counter + 1;
    END LOOP;
    
    RETURN final_slug;
END;
$$ LANGUAGE plpgsql;

-- Create function to automatically update product slug
CREATE OR REPLACE FUNCTION update_product_slug()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.product_title IS NOT NULL AND (NEW.slug IS NULL OR NEW.slug = '') THEN
        NEW.slug := generate_unique_slug(NEW.product_title, 'products', NEW.id);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically update slug
DROP TRIGGER IF EXISTS trigger_update_product_slug ON products;
CREATE TRIGGER trigger_update_product_slug
    BEFORE INSERT OR UPDATE ON products
    FOR EACH ROW
    EXECUTE FUNCTION update_product_slug();

-- Create function to log order status changes
CREATE OR REPLACE FUNCTION log_order_status_change()
RETURNS TRIGGER AS $$
BEGIN
    IF OLD.status IS DISTINCT FROM NEW.status THEN
        INSERT INTO order_status_history (order_id, old_status, new_status, changed_at)
        VALUES (NEW.id, OLD.status, NEW.status, NOW());
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to log order status changes
DROP TRIGGER IF EXISTS trigger_log_order_status_change ON orders;
CREATE TRIGGER trigger_log_order_status_change
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION log_order_status_change();

-- Create view for active products (for admin dashboard)
CREATE OR REPLACE VIEW admin_active_products AS
SELECT 
    p.*,
    c.name as category_name,
    COALESCE(SUM(pv.stock_quantity), 0) as total_stock,
    COUNT(CASE WHEN pv.stock_quantity <= pv.min_stock_level THEN 1 END) as low_stock_variants
FROM products p
LEFT JOIN categories c ON p.category_id = c.id
LEFT JOIN product_variants pv ON p.id = pv.product_id
GROUP BY p.id, c.name;

-- Create view for order summary (for admin dashboard)
CREATE OR REPLACE VIEW admin_order_summary AS
SELECT 
    status,
    COUNT(*) as order_count,
    SUM(total_amount) as total_revenue,
    AVG(total_amount) as average_order_value,
    MIN(created_at) as oldest_order,
    MAX(created_at) as newest_order
FROM orders
GROUP BY status;

-- Create view for low stock alerts
CREATE OR REPLACE VIEW admin_low_stock_alerts AS
SELECT 
    pv.*,
    p.product_title,
    p.base_price,
    c.name as category_name
FROM product_variants pv
JOIN products p ON pv.product_id = p.id
JOIN categories c ON p.category_id = c.id
WHERE pv.stock_quantity <= pv.min_stock_level
ORDER BY pv.stock_quantity ASC;

-- Insert default admin settings if not exists
INSERT INTO admin_settings (key, value, description) VALUES
('enable_low_stock_alerts', 'true', 'Enable low stock notifications'),
('enable_order_notifications', 'true', 'Enable new order notifications'),
('default_low_stock_threshold', '5', 'Default threshold for low stock alerts'),
('auto_generate_slugs', 'true', 'Automatically generate product slugs'),
('max_products_per_page', '50', 'Maximum products to display per page in admin'),
('enable_product_reviews', 'true', 'Enable product review system'),
('enable_inventory_tracking', 'true', 'Enable detailed inventory tracking')
ON CONFLICT (key) DO NOTHING;

-- Create RLS policies for admin tables
ALTER TABLE product_stock ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_status_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE product_media ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_notifications ENABLE ROW LEVEL SECURITY;

-- Admin policies for product_stock
CREATE POLICY "Admin can manage product stock" ON product_stock
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Admin policies for order_status_history
CREATE POLICY "Admin can view order status history" ON order_status_history
FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Admin policies for product_media
CREATE POLICY "Admin can manage product media" ON product_media
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Admin policies for admin_notifications
CREATE POLICY "Admin can manage notifications" ON admin_notifications
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));
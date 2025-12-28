-- Enhanced Media Support for Products
-- Add video support and enhanced media fields

-- Add video support to products table
ALTER TABLE products 
ADD COLUMN videos TEXT[], -- Array of video URLs
ADD COLUMN media_order INTEGER[] DEFAULT ARRAY[]::INTEGER[], -- Order of media files
ADD COLUMN compression_info JSONB DEFAULT '{}', -- Compression metadata
ADD COLUMN file_sizes JSONB DEFAULT '{}', -- Original and compressed file sizes
ADD COLUMN media_type VARCHAR(20) DEFAULT 'image' CHECK (media_type IN ('image', 'video', 'mixed'));

-- Update existing products to have default values
UPDATE products SET 
  media_type = CASE 
    WHEN array_length(images, 1) > 0 THEN 'image'
    ELSE 'image'
  END
WHERE media_type IS NULL;

-- Create media_files table for better media management
CREATE TABLE IF NOT EXISTS media_files (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    file_url TEXT NOT NULL,
    file_type VARCHAR(20) NOT NULL CHECK (file_type IN ('image', 'video')),
    file_name VARCHAR(255) NOT NULL,
    file_size BIGINT NOT NULL,
    compressed_size BIGINT,
    compression_ratio DECIMAL(5,2),
    mime_type VARCHAR(100),
    width INTEGER,
    height INTEGER,
    duration INTEGER, -- For videos in seconds
    order_index INTEGER DEFAULT 0,
    is_primary BOOLEAN DEFAULT false,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for media_files table
CREATE INDEX idx_media_files_product_id ON media_files(product_id);
CREATE INDEX idx_media_files_type ON media_files(file_type);
CREATE INDEX idx_media_files_order ON media_files(order_index);
CREATE INDEX idx_media_files_primary ON media_files(is_primary) WHERE is_primary = true;

-- Create triggers for media_files updated_at
CREATE TRIGGER update_media_files_updated_at 
    BEFORE UPDATE ON media_files 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add enhanced product fields for better management
ALTER TABLE products 
ADD COLUMN bulk_discount_percentage DECIMAL(5,2) DEFAULT 0,
ADD COLUMN minimum_order_quantity INTEGER DEFAULT 1,
ADD COLUMN maximum_order_quantity INTEGER INTEGER,
ADD COLUMN wholesale_minimum_order INTEGER DEFAULT 30,
ADD COLUMN stock_tracking_enabled BOOLEAN DEFAULT true,
ADD COLUMN low_stock_threshold INTEGER DEFAULT 5,
ADD COLUMN out_of_stock_message TEXT,
ADD COLUMN pre_order_available BOOLEAN DEFAULT false,
ADD COLUMN pre_order_message TEXT;

-- Add product variants table for better size/color management
CREATE TABLE IF NOT EXISTS product_variants_enhanced (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    size VARCHAR(10) NOT NULL,
    color VARCHAR(50),
    color_hex VARCHAR(7),
    sku VARCHAR(100) UNIQUE NOT NULL,
    stock_quantity INTEGER DEFAULT 0,
    reserved_quantity INTEGER DEFAULT 0, -- For pending orders
    available_quantity INTEGER GENERATED ALWAYS AS (stock_quantity - reserved_quantity) STORED,
    min_stock_level INTEGER DEFAULT 5,
    max_stock_level INTEGER DEFAULT 1000,
    base_price DECIMAL(10,2) NOT NULL,
    wholesale_price DECIMAL(10,2),
    cost_price DECIMAL(10,2),
    weight DECIMAL(8,2), -- in grams
    dimensions JSONB, -- {length, width, height}
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(product_id, size, color)
);

-- Create indexes for product_variants_enhanced
CREATE INDEX idx_product_variants_enhanced_product ON product_variants_enhanced(product_id);
CREATE INDEX idx_product_variants_enhanced_size ON product_variants_enhanced(size);
CREATE INDEX idx_product_variants_enhanced_stock ON product_variants_enhanced(stock_quantity);
CREATE INDEX idx_product_variants_enhanced_available ON product_variants_enhanced(available_quantity);
CREATE INDEX idx_product_variants_enhanced_sku ON product_variants_enhanced(sku);

-- Create triggers for product_variants_enhanced updated_at
CREATE TRIGGER update_product_variants_enhanced_updated_at 
    BEFORE UPDATE ON product_variants_enhanced 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Add customer type support to orders
ALTER TABLE orders 
ADD COLUMN customer_type VARCHAR(20) DEFAULT 'buyer' CHECK (customer_type IN ('buyer', 'wholeseller')),
ADD COLUMN wholesale_order_details JSONB DEFAULT '{}', -- For wholesale specific data
ADD COLUMN size_distribution JSONB DEFAULT '{}'; -- Size-wise quantity distribution

-- Add customer type support to order_items
ALTER TABLE order_items 
ADD COLUMN size VARCHAR(10),
ADD COLUMN color VARCHAR(50),
ADD COLUMN customer_type VARCHAR(20) DEFAULT 'buyer',
ADD COLUMN wholesale_price DECIMAL(10,2);

-- Create function to automatically generate variant SKUs
CREATE OR REPLACE FUNCTION generate_variant_sku()
RETURNS TRIGGER AS $$
DECLARE
    base_sku TEXT;
    variant_sku TEXT;
    counter INTEGER := 1;
BEGIN
    -- Get base SKU from product
    SELECT sku INTO base_sku FROM products WHERE id = NEW.product_id;
    
    IF base_sku IS NULL THEN
        RAISE EXCEPTION 'Product not found for SKU generation';
    END IF;
    
    -- Generate variant SKU
    variant_sku := base_sku || '-' || UPPER(NEW.size);
    
    IF NEW.color IS NOT NULL THEN
        variant_sku := variant_sku || '-' || UPPER(REPLACE(NEW.color, ' ', ''));
    END IF;
    
    -- Check if SKU exists and increment if needed
    WHILE EXISTS (SELECT 1 FROM product_variants_enhanced WHERE sku = variant_sku AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::UUID)) LOOP
        counter := counter + 1;
        variant_sku := base_sku || '-' || UPPER(NEW.size) || '-' || counter;
        IF NEW.color IS NOT NULL THEN
            variant_sku := base_sku || '-' || UPPER(NEW.size) || '-' || UPPER(REPLACE(NEW.color, ' ', '')) || '-' || counter;
        END IF;
    END LOOP;
    
    NEW.sku := variant_sku;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for automatic SKU generation
CREATE TRIGGER generate_variant_sku_trigger
    BEFORE INSERT OR UPDATE ON product_variants_enhanced
    FOR EACH ROW
    EXECUTE FUNCTION generate_variant_sku();

-- Insert sample data for testing
INSERT INTO products (name, description, short_description, sku, category_id, base_price, wholesale_price, cost_price, gender, product_type, is_active, is_featured) 
SELECT 
    'Men''s Premium Cotton Shirt',
    'High-quality cotton shirt perfect for casual and formal occasions. Made from 100% premium cotton with modern fit design.',
    'Premium cotton shirt with modern fit',
    'MEN-SHIRT-' || EXTRACT(EPOCH FROM NOW())::bigint,
    (SELECT id FROM categories WHERE slug = 'men-shirts' LIMIT 1),
    899,
    699,
    499,
    'men',
    'Shirt',
    true,
    true
WHERE NOT EXISTS (SELECT 1 FROM products WHERE name = 'Men''s Premium Cotton Shirt');

-- Create variants for the sample product
DO $$
DECLARE
    product_uuid UUID;
BEGIN
    SELECT id INTO product_uuid FROM products WHERE name = 'Men''s Premium Cotton Shirt' LIMIT 1;
    
    IF product_uuid IS NOT NULL THEN
        INSERT INTO product_variants_enhanced (product_id, size, stock_quantity, base_price, wholesale_price) VALUES
        (product_uuid, 'S', 25, 899, 699),
        (product_uuid, 'M', 30, 899, 699),
        (product_uuid, 'L', 28, 899, 699),
        (product_uuid, 'XL', 20, 899, 699),
        (product_uuid, 'XXL', 15, 899, 699)
        ON CONFLICT (product_id, size, color) DO NOTHING;
    END IF;
END $$;

-- Create views for easier queries
CREATE OR REPLACE VIEW product_variants_summary AS
SELECT 
    p.id as product_id,
    p.name as product_name,
    p.gender,
    p.product_type,
    p.base_price,
    p.wholesale_price,
    p.is_active,
    COUNT(pv.id) as total_variants,
    SUM(pv.stock_quantity) as total_stock,
    SUM(pv.available_quantity) as available_stock,
    STRING_AGG(DISTINCT pv.size, ', ' ORDER BY pv.size) as available_sizes
FROM products p
LEFT JOIN product_variants_enhanced pv ON p.id = pv.product_id AND pv.is_active = true
GROUP BY p.id, p.name, p.gender, p.product_type, p.base_price, p.wholesale_price, p.is_active;

-- Create function to get low stock products
CREATE OR REPLACE FUNCTION get_low_stock_products(threshold INTEGER DEFAULT 5)
RETURNS TABLE (
    product_id UUID,
    product_name TEXT,
    size VARCHAR(10),
    current_stock INTEGER,
    threshold INTEGER,
    available_quantity INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        pvs.product_id,
        p.name as product_name,
        pvs.size,
        pvs.stock_quantity as current_stock,
        pvs.min_stock_level as threshold,
        pvs.available_quantity
    FROM product_variants_enhanced pvs
    JOIN products p ON pvs.product_id = p.id
    WHERE pvs.stock_quantity <= pvs.min_stock_level 
    AND p.is_active = true
    AND pvs.is_active = true
    ORDER BY pvs.stock_quantity ASC;
END;
$$ LANGUAGE plpgsql;

-- Add RLS policies for media_files
ALTER TABLE media_files ENABLE ROW LEVEL SECURITY;

-- Policy for admin access to media files
CREATE POLICY "Admin can manage media files" ON media_files
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Policy for public read access to media files
CREATE POLICY "Public can read media files" ON media_files
FOR SELECT
USING (true);

-- Add RLS policies for product_variants_enhanced
ALTER TABLE product_variants_enhanced ENABLE ROW LEVEL SECURITY;

-- Policy for admin access to product variants
CREATE POLICY "Admin can manage product variants" ON product_variants_enhanced
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Policy for public read access to product variants
CREATE POLICY "Public can read product variants" ON product_variants_enhanced
FOR SELECT
USING (true);

-- Add comments for documentation
COMMENT ON TABLE media_files IS 'Stores detailed information about product media files including compression data';
COMMENT ON TABLE product_variants_enhanced IS 'Enhanced product variants with better stock management and customer type support';
COMMENT ON COLUMN products.customer_type IS 'Type of customer: buyer or wholeseller';
COMMENT ON COLUMN products.wholesale_minimum_order IS 'Minimum quantity for wholesale orders (default 30)';
COMMENT ON COLUMN product_variants_enhanced.available_quantity IS 'Stock available for sale (stock - reserved)';
COMMENT ON FUNCTION generate_variant_sku() IS 'Automatically generates unique SKUs for product variants';
-- Add new fields for enhanced product management
ALTER TABLE products
ADD COLUMN target_audience VARCHAR(20) CHECK (target_audience IN ('buyer', 'wholesaler', 'both')) DEFAULT 'buyer',
ADD COLUMN moq INTEGER DEFAULT 1,
ADD COLUMN per_unit_price DECIMAL(10,2),
ADD COLUMN stock_alert_threshold INTEGER DEFAULT 10,
ADD COLUMN generic_key VARCHAR(255),
ADD COLUMN unique_key VARCHAR(255) UNIQUE,
ADD COLUMN sub_category VARCHAR(100),
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('Men', 'Women', 'Unisex')) DEFAULT 'Unisex';

-- Update existing products with default values
UPDATE products SET
    target_audience = 'buyer',
    moq = 1,
    stock_alert_threshold = 10,
    gender = 'Unisex'
WHERE target_audience IS NULL;

-- Rename name to product_title for consistency
ALTER TABLE products RENAME COLUMN name TO product_title;

-- Add indexes for new fields
CREATE INDEX idx_products_target_audience ON products(target_audience);
CREATE INDEX idx_products_generic_key ON products(generic_key);
CREATE INDEX idx_products_unique_key ON products(unique_key);
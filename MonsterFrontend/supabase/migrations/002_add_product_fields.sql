-- Add gender and product_type fields to products table
ALTER TABLE products 
ADD COLUMN gender VARCHAR(10) CHECK (gender IN ('men', 'women', 'unisex')) DEFAULT 'unisex',
ADD COLUMN product_type VARCHAR(50) NOT NULL DEFAULT 'general',
ADD COLUMN slug VARCHAR(255) UNIQUE;

-- Create function to generate product slug
CREATE OR REPLACE FUNCTION generate_product_slug()
RETURNS TEXT AS $$
BEGIN
    RETURN LOWER(REPLACE(REPLACE(REPLACE(NEW.name, ' ', '-'), '&', 'and'), '`', ''));
END;
$$ LANGUAGE plpgsql;

-- Create trigger to automatically generate slug
CREATE TRIGGER set_product_slug 
    BEFORE INSERT OR UPDATE ON products 
    FOR EACH ROW 
    EXECUTE FUNCTION generate_product_slug();

-- Update existing products with default values
UPDATE products SET 
    gender = 'unisex',
    product_type = 'general'
WHERE gender IS NULL OR product_type IS NULL;

-- Add indexes for better performance
CREATE INDEX idx_products_gender ON products(gender);
CREATE INDEX idx_products_product_type ON products(product_type);
CREATE INDEX idx_products_category_active ON products(category_id, is_active);

-- Add product sizes JSON field for better size management
ALTER TABLE products 
ADD COLUMN available_sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'];

-- Update the category structure to include gender
UPDATE categories SET 
    name = 'Men\'s Clothing',
    description = 'Men\'s clothing and accessories'
WHERE slug = 'men';

UPDATE categories SET 
    name = 'Women\'s Clothing', 
    description = 'Women\'s clothing and accessories'
WHERE slug = 'women';

-- Create product types as categories
INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Shirts', 'shirts', 'Shirts and blouses', id, true 
FROM categories WHERE slug = 'men'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Pants', 'pants', 'Pants and trousers', id, true 
FROM categories WHERE slug = 'men'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Jackets', 'jackets', 'Jackets and coats', id, true 
FROM categories WHERE slug = 'men'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'T-Shirts', 't-shirts', 'T-Shirts and casual wear', id, true 
FROM categories WHERE slug = 'men'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Dresses', 'dresses', 'Dresses and formal wear', id, true 
FROM categories WHERE slug = 'women'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Tops', 'tops', 'Tops and blouses', id, true 
FROM categories WHERE slug = 'women'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Bottoms', 'bottoms', 'Pants, skirts, and shorts', id, true 
FROM categories WHERE slug = 'women'
ON CONFLICT (slug) DO NOTHING;

INSERT INTO categories (name, slug, description, parent_id, is_active) 
SELECT 'Tops', 'womens-tops', 'Women\'s tops and blouses', id, true 
FROM categories WHERE slug = 'women'
ON CONFLICT (slug) DO NOTHING;
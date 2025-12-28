-- Discounts/Coupons table
CREATE TABLE discounts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    code VARCHAR(50) UNIQUE NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('percentage', 'fixed')),
    value DECIMAL(10,2) NOT NULL,
    description TEXT,
    min_purchase DECIMAL(10,2) DEFAULT 0,
    max_uses INTEGER,
    used_count INTEGER DEFAULT 0,
    valid_from TIMESTAMP WITH TIME ZONE NOT NULL,
    valid_until TIMESTAMP WITH TIME ZONE NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price history for tracking price changes
CREATE TABLE price_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    old_price DECIMAL(10,2),
    new_price DECIMAL(10,2) NOT NULL,
    change_reason VARCHAR(255),
    changed_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Price rules for bulk pricing
CREATE TABLE price_rules (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('category', 'product', 'user_type')),
    target_id UUID,
    min_quantity INTEGER,
    discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed')),
    discount_value DECIMAL(10,2) NOT NULL,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Admin activity logs
CREATE TABLE admin_activity_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    admin_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100),
    entity_id UUID,
    changes JSONB,
    ip_address VARCHAR(45),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Analytics events
CREATE TABLE analytics_events (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type VARCHAR(100) NOT NULL,
    user_id UUID REFERENCES users(id) ON DELETE SET NULL,
    data JSONB,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX idx_discounts_code ON discounts(code);
CREATE INDEX idx_discounts_valid_from_until ON discounts(valid_from, valid_until);
CREATE INDEX idx_price_history_product_id ON price_history(product_id);
CREATE INDEX idx_price_rules_active ON price_rules(is_active);
CREATE INDEX idx_admin_logs_admin_id ON admin_activity_logs(admin_id);
CREATE INDEX idx_admin_logs_created_at ON admin_activity_logs(created_at);
CREATE INDEX idx_analytics_events_type ON analytics_events(event_type);
CREATE INDEX idx_analytics_events_created_at ON analytics_events(created_at);

-- Add RLS (Row Level Security) policies
ALTER TABLE discounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_history ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_activity_logs ENABLE ROW LEVEL SECURITY;

-- Discount policies
CREATE POLICY "Admin can manage discounts" ON discounts
FOR ALL
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Price history policies
CREATE POLICY "Admin can view price history" ON price_history
FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

CREATE POLICY "Admin can create price history" ON price_history
FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

-- Admin logs policies
CREATE POLICY "Admin can view own logs" ON admin_activity_logs
FOR SELECT
USING (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

CREATE POLICY "Admin can create logs" ON admin_activity_logs
FOR INSERT
WITH CHECK (auth.uid() IN (
    SELECT id FROM users WHERE user_type = 'admin'
));

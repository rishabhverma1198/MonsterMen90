-- Create admin user (execute in Supabase SQL Editor)
INSERT INTO users (id, email, full_name, user_type, phone, is_active, created_at, updated_at)
VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'admin@monstermen90.com',
  'System Administrator',
  'admin',
  '+91-9876543210',
  true,
  NOW(),
  NOW()
)
ON CONFLICT (id) DO UPDATE SET
  email = EXCLUDED.email,
  full_name = EXCLUDED.full_name,
  user_type = EXCLUDED.user_type,
  phone = EXCLUDED.phone,
  is_active = EXCLUDED.is_active,
  updated_at = NOW();
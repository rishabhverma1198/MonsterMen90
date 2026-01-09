-- =====================================================
-- FIX USERS TABLE STRUCTURE (If needed)
-- Run this ONLY if users table structure is wrong
-- =====================================================

-- First, check current structure (run 005_check_users_table_structure.sql)

-- If users table doesn't have 'id' column, it might be using different primary key
-- Common alternatives: 'user_id', 'uuid', or linked to auth.users

-- Option 1: If table uses 'user_id' instead of 'id'
-- SELECT user_id, email, user_type, is_active FROM users;

-- Option 2: If table is linked to auth.users via foreign key
-- Check if there's a relationship:
SELECT 
    tc.constraint_name,
    tc.table_name,
    kcu.column_name,
    ccu.table_name AS foreign_table_name,
    ccu.column_name AS foreign_column_name
FROM information_schema.table_constraints AS tc
JOIN information_schema.key_column_usage AS kcu
  ON tc.constraint_name = kcu.constraint_name
JOIN information_schema.constraint_column_usage AS ccu
  ON ccu.constraint_name = tc.constraint_name
WHERE tc.constraint_type = 'FOREIGN KEY'
AND tc.table_name = 'users';

-- Option 3: If users table doesn't exist, create it
-- (Only run if table doesn't exist)
/*
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT,
    user_type VARCHAR(20) DEFAULT 'buyer' CHECK (user_type IN ('buyer', 'wholeseller', 'admin')),
    phone VARCHAR(20),
    avatar_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
*/


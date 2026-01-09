-- =====================================================
-- CHECK USERS TABLE STRUCTURE
-- Run this first to see actual column names
-- =====================================================

-- Step 1: Check if users table exists and get its structure
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- Step 2: Check primary key
SELECT 
    constraint_name,
    constraint_type
FROM information_schema.table_constraints
WHERE table_schema = 'public'
AND table_name = 'users';

-- Step 3: Try to see sample data (if any)
SELECT * FROM users LIMIT 5;

-- Step 4: Check if auth.users exists (Supabase Auth table)
SELECT 
    column_name,
    data_type
FROM information_schema.columns
WHERE table_schema = 'auth'
AND table_name = 'users'
ORDER BY ordinal_position
LIMIT 10;


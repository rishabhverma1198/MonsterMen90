-- =====================================================
-- SAFE ADMIN USER CHECK (Works with any table structure)
-- =====================================================

-- This query will work regardless of column names
-- It first checks the structure, then queries accordingly

-- Step 1: Get all column names from users table
DO $$
DECLARE
    col_names TEXT;
    query_text TEXT;
BEGIN
    -- Get column names
    SELECT string_agg(column_name, ', ')
    INTO col_names
    FROM information_schema.columns
    WHERE table_schema = 'public'
    AND table_name = 'users';
    
    RAISE NOTICE 'Users table columns: %', col_names;
END $$;

-- Step 2: Try different possible column names
-- Try with 'id'
SELECT 'Checking with id column...' as check_type;
SELECT * FROM users WHERE user_type = 'admin' LIMIT 1;

-- If above fails, try with 'user_id'
-- SELECT * FROM users WHERE user_type = 'admin' LIMIT 1;

-- Step 3: List all admin users (works with any primary key)
SELECT 
    * 
FROM users 
WHERE user_type = 'admin'
LIMIT 10;

-- Step 4: Check specific columns if they exist
SELECT 
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'id') 
        THEN 'id column exists'
        ELSE 'id column does NOT exist'
    END as id_column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_id') 
        THEN 'user_id column exists'
        ELSE 'user_id column does NOT exist'
    END as user_id_column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'email') 
        THEN 'email column exists'
        ELSE 'email column does NOT exist'
    END as email_column_check,
    CASE 
        WHEN EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'users' AND column_name = 'user_type') 
        THEN 'user_type column exists'
        ELSE 'user_type column does NOT exist'
    END as user_type_column_check;


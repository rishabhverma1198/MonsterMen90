-- =====================================================
-- STEP 1: CHECK USERS TABLE STRUCTURE
-- Run this FIRST to see actual column names
-- =====================================================

-- Get all columns from users table
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default,
    ordinal_position
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;

-- =====================================================
-- STEP 2: CHECK IF TABLE EXISTS
-- =====================================================

SELECT 
    table_name,
    table_type
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'users';

-- =====================================================
-- STEP 3: TRY TO SEE SAMPLE DATA (if table exists)
-- =====================================================

-- This will show what columns actually exist
SELECT * FROM users LIMIT 1;

-- =====================================================
-- STEP 4: CHECK PRIMARY KEY
-- =====================================================

SELECT 
    kcu.column_name,
    kcu.ordinal_position
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_schema = 'public'
AND tc.table_name = 'users'
AND tc.constraint_type = 'PRIMARY KEY';


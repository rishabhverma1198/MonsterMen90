-- =====================================================
-- CREATE OR FIX USERS TABLE
-- Run this AFTER checking structure (008_check_table_structure.sql)
-- =====================================================

-- Step 1: Check if users table exists
DO $$
BEGIN
    -- If table doesn't exist, create it
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'users'
    ) THEN
        RAISE NOTICE 'Creating users table...';
        
        CREATE TABLE users (
            id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
            email TEXT UNIQUE NOT NULL,
            full_name TEXT,
            user_type VARCHAR(20) DEFAULT 'buyer' 
                CHECK (user_type IN ('buyer', 'wholeseller', 'admin')),
            phone VARCHAR(20),
            avatar_url TEXT,
            is_active BOOLEAN DEFAULT true,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
            updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
        );
        
        RAISE NOTICE 'Users table created successfully';
    ELSE
        RAISE NOTICE 'Users table already exists';
    END IF;
END $$;

-- Step 2: Add missing columns if table exists but columns are missing
DO $$
BEGIN
    -- Add user_type if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'user_type'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN user_type VARCHAR(20) DEFAULT 'buyer' 
        CHECK (user_type IN ('buyer', 'wholeseller', 'admin'));
        RAISE NOTICE 'Added user_type column';
    END IF;
    
    -- Add is_active if missing
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'is_active'
    ) THEN
        ALTER TABLE users 
        ADD COLUMN is_active BOOLEAN DEFAULT true;
        RAISE NOTICE 'Added is_active column';
    END IF;
    
    -- Add id column if missing (should reference auth.users)
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_schema = 'public'
        AND table_name = 'users' 
        AND column_name = 'id'
    ) THEN
        -- Check if there's another primary key column
        -- If yes, we might need to rename it
        RAISE NOTICE 'id column missing - check if another primary key exists';
    END IF;
END $$;

-- Step 3: Enable RLS
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Step 4: Verify structure
SELECT 
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
AND table_name = 'users'
ORDER BY ordinal_position;


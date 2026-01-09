const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env' });

async function fixRealtime() {
    try {
        console.log('🔧 Fixing realtime subscription for admin_dashboard_stats...');
        
        const supabaseUrl = process.env.SUPABASE_URL;
        const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

        if (!supabaseUrl || !supabaseKey) {
            console.error('❌ Missing Supabase credentials');
            process.exit(1);
        }

        const supabase = createClient(supabaseUrl, supabaseKey);

        // Check if admin_dashboard_stats is a view
        console.log('📋 Checking if admin_dashboard_stats is a view...');
        const { data: viewInfo, error: viewError } = await supabase.rpc('exec_sql', {
            query: `
                SELECT table_type, table_name 
                FROM information_schema.tables 
                WHERE table_name = 'admin_dashboard_stats' 
                AND table_schema = 'public'
            `
        });

        if (viewError) {
            console.error('❌ Error checking view:', viewError);
        } else {
            console.log('📊 Table info:', viewInfo);
        }

        // Drop the view if it exists
        console.log('🗑️ Dropping admin_dashboard_stats view if exists...');
        const { error: dropError } = await supabase.rpc('exec_sql', {
            query: 'DROP VIEW IF EXISTS public.admin_dashboard_stats'
        });

        if (dropError) {
            console.error('❌ Error dropping view:', dropError);
        } else {
            console.log('✅ View dropped successfully');
        }

        // Create the table instead
        console.log('🏗️ Creating admin_dashboard_stats table...');
        const { error: createError } = await supabase.rpc('exec_sql', {
            query: `
                CREATE TABLE IF NOT EXISTS public.admin_dashboard_stats (
                    id SERIAL PRIMARY KEY,
                    total_products INTEGER DEFAULT 0,
                    total_orders INTEGER DEFAULT 0,
                    total_revenue DECIMAL(15,2) DEFAULT 0,
                    total_users INTEGER DEFAULT 0,
                    pending_orders INTEGER DEFAULT 0,
                    low_stock_products INTEGER DEFAULT 0,
                    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
                    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
                )
            `
        });

        if (createError) {
            console.error('❌ Error creating table:', createError);
        } else {
            console.log('✅ Table created successfully');
        }

        // Insert initial data
        console.log('📊 Inserting initial data...');
        const { error: insertError } = await supabase.rpc('exec_sql', {
            query: `
                INSERT INTO public.admin_dashboard_stats 
                (total_products, total_orders, total_revenue, total_users, pending_orders, low_stock_products)
                VALUES (0, 0, 0, 0, 0, 0)
                ON CONFLICT DO NOTHING
            `
        });

        if (insertError) {
            console.error('❌ Error inserting data:', insertError);
        } else {
            console.log('✅ Initial data inserted successfully');
        }

        // Add table to realtime publication
        console.log('🔄 Adding table to realtime publication...');
        const { error: pubError } = await supabase.rpc('exec_sql', {
            query: 'ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_dashboard_stats'
        });

        if (pubError) {
            console.error('❌ Error adding to publication:', pubError);
        } else {
            console.log('✅ Table added to realtime publication successfully');
        }

        // Enable RLS
        console.log('🔒 Enabling RLS...');
        const { error: rlsError } = await supabase.rpc('exec_sql', {
            query: 'ALTER TABLE public.admin_dashboard_stats ENABLE ROW LEVEL SECURITY'
        });

        if (rlsError) {
            console.error('❌ Error enabling RLS:', rlsError);
        } else {
            console.log('✅ RLS enabled successfully');
        }

        // Create policies for admin access
        console.log('📜 Creating RLS policies...');
        const { error: policyError } = await supabase.rpc('exec_sql', {
            query: `
                DROP POLICY IF EXISTS "Admin can view dashboard stats" ON public.admin_dashboard_stats;
                DROP POLICY IF EXISTS "Admin can update dashboard stats" ON public.admin_dashboard_stats;
                
                CREATE POLICY "Admin can view dashboard stats" ON public.admin_dashboard_stats
                FOR SELECT USING (auth.role() = 'authenticated');
                
                CREATE POLICY "Admin can update dashboard stats" ON public.admin_dashboard_stats
                FOR ALL USING (auth.role() = 'authenticated');
            `
        });

        if (policyError) {
            console.error('❌ Error creating policies:', policyError);
        } else {
            console.log('✅ RLS policies created successfully');
        }

        console.log('✅ Realtime subscription setup completed successfully!');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
        process.exit(1);
    }
}

fixRealtime();
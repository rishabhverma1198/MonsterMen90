#!/usr/bin/env node

/**
 * 🔧 Fix Realtime Publication Error
 * Converts admin_dashboard_stats view to table to enable realtime functionality
 */

const { Pool } = require('pg');

const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function fixRealtimeView() {
  log('\n🔧 FIXING REALTIME VIEW ISSUE', 'bright');
  log('=' .repeat(50), 'magenta');

  const supabaseUrl = process.env.SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  
  if (!supabaseUrl || !serviceKey) {
    throw new Error('Missing Supabase credentials');
  }

  // Extract project reference from URL
  const projectRef = supabaseUrl.replace('https://', '').replace('.supabase.co', '');
  const connectionString = `postgresql://postgres:${serviceKey}@db.${projectRef}.supabase.co:5432/postgres`;

  const pool = new Pool({
    connectionString: connectionString,
    ssl: {
      rejectUnauthorized: false
    }
  });

  try {
    log('Testing database connection...');
    const client = await pool.connect();
    log('✅ Database connection successful', 'green');
    client.release();

    // Step 1: Drop the view if it exists
    log('Dropping admin_dashboard_stats view...');
    try {
      await pool.query('DROP VIEW IF EXISTS admin_dashboard_stats');
      log('✅ View dropped successfully', 'green');
    } catch (error) {
      if (error.message.includes('does not exist')) {
        log('ℹ️ View does not exist (may have been already dropped)', 'cyan');
      } else {
        throw error;
      }
    }

    // Step 2: Create the table version
    log('Creating admin_dashboard_stats table...');
    await pool.query(`
      CREATE TABLE admin_dashboard_stats (
        total_products INTEGER DEFAULT 0,
        total_orders INTEGER DEFAULT 0,
        pending_orders INTEGER DEFAULT 0,
        total_revenue DECIMAL(10,2) DEFAULT 0,
        last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);
    log('✅ Table created successfully', 'green');

    // Step 3: Insert initial data
    log('Inserting initial dashboard stats...');
    await pool.query(`
      INSERT INTO admin_dashboard_stats (total_products, total_orders, pending_orders, total_revenue)
      VALUES (0, 0, 0, 0);
    `);
    log('✅ Initial data inserted', 'green');

    // Step 4: Remove from realtime publication if it exists
    log('Removing from realtime publication...');
    try {
      await pool.query('ALTER PUBLICATION supabase_realtime DROP TABLE admin_dashboard_stats');
      log('✅ Removed from realtime publication', 'green');
    } catch (error) {
      if (error.message.includes('does not exist in publication')) {
        log('ℹ️ Table not in publication (may have been already removed)', 'cyan');
      } else {
        throw error;
      }
    }

    // Step 5: Add to realtime publication
    log('Adding to realtime publication...');
    try {
      await pool.query('ALTER PUBLICATION supabase_realtime ADD TABLE admin_dashboard_stats');
      log('✅ Added to realtime publication successfully', 'green');
    } catch (error) {
      if (error.message.includes('cannot add relation')) {
        log('❌ Error: Still cannot add to publication. This might be a Supabase limitation.', 'red');
        throw error;
      } else {
        throw error;
      }
    }

    // Step 6: Create a function to update the stats
    log('Creating function to update dashboard stats...');
    await pool.query(`
      CREATE OR REPLACE FUNCTION update_dashboard_stats()
      RETURNS TRIGGER AS $$
      DECLARE
        new_total_products INTEGER;
        new_total_orders INTEGER;
        new_pending_orders INTEGER;
        new_total_revenue DECIMAL(10,2);
      BEGIN
        -- Calculate new stats
        SELECT COUNT(*) INTO new_total_products FROM products;
        SELECT COUNT(*) INTO new_total_orders FROM orders;
        SELECT COUNT(*) INTO new_pending_orders FROM orders WHERE status = 'pending';
        SELECT COALESCE(SUM(total_amount), 0) INTO new_total_revenue FROM orders WHERE payment_status = 'paid';
        
        -- Update the table
        UPDATE admin_dashboard_stats SET
          total_products = new_total_products,
          total_orders = new_total_orders,
          pending_orders = new_pending_orders,
          total_revenue = new_total_revenue,
          last_updated = NOW();
          
        RETURN NULL;
      END;
      $$ LANGUAGE plpgsql;
    `);
    log('✅ Update function created', 'green');

    // Step 7: Create triggers to auto-update stats
    log('Creating triggers for auto-updates...');
    
    // Product changes trigger
    await pool.query(`
      CREATE TRIGGER trigger_update_dashboard_stats_products
      AFTER INSERT OR UPDATE OR DELETE ON products
      FOR EACH STATEMENT
      EXECUTE FUNCTION update_dashboard_stats();
    `);
    
    // Order changes trigger
    await pool.query(`
      CREATE TRIGGER trigger_update_dashboard_stats_orders
      AFTER INSERT OR UPDATE OR DELETE ON orders
      FOR EACH STATEMENT
      EXECUTE FUNCTION update_dashboard_stats();
    `);
    
    log('✅ Triggers created', 'green');

    // Step 8: Initial stats calculation
    log('Calculating initial stats...');
    await pool.query('SELECT update_dashboard_stats()');
    log('✅ Initial stats calculated', 'green');

    log('\n🎉 REALTIME VIEW FIX COMPLETED!', 'bright');
    log('=' .repeat(50), 'green');
    
    log('\n✅ What was fixed:', 'cyan');
    log('- Converted admin_dashboard_stats view to table', 'cyan');
    log('- Added table to realtime publication', 'cyan');
    log('- Created auto-update triggers', 'cyan');
    log('- Enabled realtime updates for dashboard stats', 'cyan');
    
    log('\n🚀 Your realtime functionality should now work!', 'bright');
    log('You can now use realtime subscriptions for admin dashboard stats.', 'green');

    await pool.end();
    return true;

  } catch (error) {
    log(`\n❌ Fix failed: ${error.message}`, 'red');
    await pool.end();
    return false;
  }
}

// Run the fix
fixRealtimeView().then(success => {
  if (success) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}).catch(error => {
  log(`\n💥 Unexpected error: ${error.message}`, 'red');
  process.exit(1);
});
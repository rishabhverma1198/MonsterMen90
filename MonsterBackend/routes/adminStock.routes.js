import express from 'express';
import { supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse } from '../utils/response.util.js';

const router = express.Router();

// ✅ All admin routes require authentication and admin role
router.use(authenticateUser, requireAdmin);

// Get stock overview (admin)
router.get('/overview', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('products')
      .select(`
        *,
        product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(res, error.message, 'Failed to fetch stock overview', 500);
    }

    // Calculate stock statistics
    const stats = data?.map(product => {
      const totalStock = product.product_variants?.reduce((sum, variant) => 
        sum + (variant.stock_quantity || 0), 0) || 0;
      
      return {
        ...product,
        total_stock: totalStock,
        low_stock: product.product_variants?.some(v => 
          (v.stock_quantity || 0) <= (v.min_stock_level || 10)) || false
      };
    }) || [];

    return successResponse(res, stats || [], 'Stock overview fetched successfully');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Get stock movements (admin)
router.get('/movements', async (req, res) => {
  try {
    const { product_id, limit = 50 } = req.query;
    
    let query = supabaseAdmin
      .from('stock_movements')
      .select(`
        *,
        product_variants(*)
      `)
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (product_id) {
      query = query.eq('product_id', product_id);
    }

    const { data, error } = await query;

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Create stock movement (admin)
router.post('/movements', async (req, res) => {
  try {
    const movement = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('stock_movements')
      .insert([{
        ...movement,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Failed to create stock movement', 500);
    }

    // Update stock quantity
    if (movement.product_variant_id && movement.quantity_change) {
      await supabaseAdmin
        .from('product_variants')
        .update({
          stock_quantity: movement.new_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', movement.product_variant_id);
    }

    return successResponse(res, data?.[0] || null, 'Stock movement created successfully');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Get stock alerts (admin)
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .select(`
        *,
        products(name, brand),
        stock_movements(*)
      `)
      .lte('stock_quantity', 10)
      .order('stock_quantity', { ascending: true });

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Update stock threshold (admin)
router.patch('/threshold/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { min_stock_level } = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('product_variants')
      .update({ 
        min_stock_level,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Failed to update stock threshold', 500);
    }

    return successResponse(res, data?.[0] || null, 'Stock threshold updated successfully');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

export default router;
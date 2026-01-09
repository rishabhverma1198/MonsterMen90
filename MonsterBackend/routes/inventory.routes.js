import express from 'express';
import { supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.util.js';
import { validateParams, validateBody } from '../utils/validation.util.js';
import { stockSchemas, commonSchemas } from '../utils/validation.util.js';
import { z } from 'zod';

const router = express.Router();

// ✅ All admin routes require authentication and admin role
router.use(authenticateUser, requireAdmin);

// Get all inventory items (admin)
router.get('/',
  async (_, res) => {
    try {
      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .select(`
          *,
          products(name, brand, category_id)
        `)
        .order('updated_at', { ascending: false });

      if (error) {
        return errorResponse(res, error.message, 'Failed to fetch inventory', 500);
      }

      return successResponse(res, data || [], 'Inventory fetched successfully');
    } catch (error) {
      console.error('Get inventory error:', error);
      return errorResponse(res, error.message, 'Failed to fetch inventory', 500);
    }
  }
);

// Get low stock alerts (admin) - MUST come before /:id/stock route
router.get('/low-stock',
  async (_, res) => {
    try {
      // First try to get from admin_low_stock_alerts table
      const { data: alertsData, error: alertsError } = await supabaseAdmin
        .from('admin_low_stock_alerts')
        .select(`
          *,
          product_variants(*),
          products(name, brand)
        `)
        .eq('is_resolved', false)
        .order('created_at', { ascending: false });

      if (!alertsError && alertsData) {
        return successResponse(res, alertsData, 'Low stock alerts fetched successfully');
      }

      // Fallback: Calculate from product_variants
      console.warn('[Inventory] admin_low_stock_alerts table not found, calculating from product_variants');
      
      const { data: variantsData, error: variantsError } = await supabaseAdmin
        .from('product_variants')
        .select(`
          *,
          products(name, brand)
        `)
        .lte('stock_quantity', 10)
        .order('stock_quantity', { ascending: true });

      if (variantsError) {
        return errorResponse(res, variantsError.message, 'Failed to fetch low stock items', 500);
      }

      return successResponse(res, variantsData || [], 'Low stock items fetched successfully');
    } catch (error) {
      console.error('Get low stock error:', error);
      return errorResponse(res, error.message, 'Failed to fetch low stock items', 500);
    }
  }
);

// Update inventory stock (admin)
router.patch('/:id/stock',
  validateParams(z.object({ id: commonSchemas.uuid })),
  validateBody(stockSchemas.update),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { stock_quantity, min_stock_level } = req.body;
      
      const updateData = {
        updated_at: new Date().toISOString()
      };

      if (stock_quantity !== undefined) {
        updateData.stock_quantity = stock_quantity;
      }

      if (min_stock_level !== undefined) {
        updateData.min_stock_level = min_stock_level;
      }

      const { data, error } = await supabaseAdmin
        .from('product_variants')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return notFoundResponse(res, 'Product variant not found');
        }
        return errorResponse(res, error.message, 'Failed to update stock', 500);
      }

      if (!data) {
        return notFoundResponse(res, 'Product variant not found');
      }

      return successResponse(res, data, 'Stock updated successfully');
    } catch (error) {
      console.error('Update stock error:', error);
      return errorResponse(res, error.message, 'Failed to update stock', 500);
    }
  }
);

export default router;

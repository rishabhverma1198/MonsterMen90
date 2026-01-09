import express from 'express';
import { supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';
import { validateQuery, validateParams } from '../utils/validation.util.js';
import { orderSchemas, commonSchemas } from '../utils/validation.util.js';
import { z } from 'zod';

const router = express.Router();

// ✅ All admin routes require authentication and admin role
router.use(authenticateUser, requireAdmin);

// Get daily sales analytics (admin) - MUST come before /:id route
router.get('/analytics/daily-sales',
  async (req, res) => {
    try {
      // Try to get from daily_sales view/table if it exists
      // Otherwise, calculate from orders table
      const { data: dailySalesData, error: dailySalesError } = await supabaseAdmin
        .from('daily_sales')
        .select('*')
        .order('day', { ascending: false })
        .limit(30);

      if (dailySalesError) {
        // If daily_sales table doesn't exist, calculate from orders
        console.warn('[Analytics] daily_sales table not found, calculating from orders');
        
        const { data: ordersData, error: ordersError } = await supabaseAdmin
          .from('orders')
          .select('created_at, total_amount, status')
          .eq('status', 'delivered')
          .gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
          .order('created_at', { ascending: false });

        if (ordersError) {
          return errorResponse(res, ordersError.message, 'Failed to fetch analytics', 500);
        }

        // Group by day
        const dailySales = (ordersData || []).reduce((acc, order) => {
          const day = new Date(order.created_at).toISOString().split('T')[0];
          if (!acc[day]) {
            acc[day] = { day, total_sales: 0, order_count: 0 };
          }
          acc[day].total_sales += parseFloat(order.total_amount || 0);
          acc[day].order_count += 1;
          return acc;
        }, {});

        const result = Object.values(dailySales).sort((a, b) =>
          new Date(b.day).getTime() - new Date(a.day).getTime()
        );

        return successResponse(res, result, 'Analytics fetched successfully');
      }

      return successResponse(res, dailySalesData || [], 'Analytics fetched successfully');
    } catch (error) {
      console.error('Get analytics error:', error);
      return errorResponse(res, error.message, 'Failed to fetch analytics', 500);
    }
  }
);

// Get all orders (admin) - with pagination and filters
router.get('/',
  validateQuery(orderSchemas.query || z.object({})),
  async (req, res) => {
    try {
      const { status, user_id, page = 1, limit = 20, offset } = req.query;

      let query = supabaseAdmin
        .from('orders')
        .select(`
          *,
          users(full_name, email, phone),
          order_items(*)
        `, { count: 'exact' })
        .order('created_at', { ascending: false });

      if (status) {
        query = query.eq('status', status);
      }

      if (user_id) {
        query = query.eq('user_id', user_id);
      }

      // Apply pagination
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : (page - 1) * limitNum;
      query = query.range(offsetNum, offsetNum + limitNum - 1);

      const { data, error, count } = await query;

      if (error) {
        return errorResponse(res, error.message, 'Failed to fetch orders', 500);
      }

      return paginatedResponse(res,
        data || [],
        {
          page: parseInt(page),
          limit: limitNum,
          total: count || 0,
          hasMore: (offsetNum + limitNum) < (count || 0)
        },
        'Orders fetched successfully'
      );
    } catch (error) {
      console.error('Get orders error:', error);
      return errorResponse(res, error.message, 'Failed to fetch orders', 500);
    }
  }
);

// Get single order (admin)
router.get('/:id',
  validateParams(z.object({ id: commonSchemas.uuid })),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select(`
          *,
          users(full_name, email, phone),
          order_items(*)
        `)
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(res, 'Order not found', 'Order not found', 404);
        }
        return errorResponse(res, error.message, 'Failed to fetch order', 500);
      }

      return successResponse(res, data, 'Order fetched successfully');
    } catch (error) {
      console.error('Get order error:', error);
      return errorResponse(res, error.message, 'Failed to fetch order', 500);
    }
  }
);

// Update order status (admin)
router.put('/:id/status',
  validateParams(z.object({ id: commonSchemas.uuid })),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { status, notes } = req.body;
      
      if (!status) {
        return errorResponse(res, 'Status is required', 'Bad Request', 400);
      }

      const updateData = {
        status,
        updated_at: new Date().toISOString()
      };

      if (notes) {
        updateData.notes = notes;
      }

      // Set timestamps based on status
      if (status === 'shipped') {
        updateData.shipped_at = new Date().toISOString();
      } else if (status === 'delivered') {
        updateData.delivered_at = new Date().toISOString();
      }

      const { data, error } = await supabaseAdmin
        .from('orders')
        .update(updateData)
        .eq('id', id)
        .select(`
          *,
          users(full_name, email),
          order_items(*)
        `)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return errorResponse(res, 'Order not found', 'Order not found', 404);
        }
        return errorResponse(res, error.message, 'Failed to update order status', 500);
      }

      return successResponse(res, data, 'Order status updated successfully');
    } catch (error) {
      console.error('Update order status error:', error);
      return errorResponse(res, error.message, 'Failed to update order status', 500);
    }
  }
);

export default router;

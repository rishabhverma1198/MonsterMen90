import express from 'express';
import { supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, paginatedResponse } from '../utils/response.util.js';

const router = express.Router();

// =====================================================
// PUBLIC ROUTES (No authentication required)
// =====================================================

// Get all categories (public)
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// =====================================================
// ADMIN ROUTES (Require authentication and admin role)
// =====================================================

// ✅ All admin routes require authentication and admin role
router.use(authenticateUser, requireAdmin);

// Get all users (admin)
router.get('/admin', async (req, res) => {
  try {
    const { role, active } = req.query;
    
    let query = supabaseAdmin
      .from('users')
      .select(`
        *,
        user_addresses(*)
      `)
      .order('created_at', { ascending: false });

    if (role) {
      query = query.eq('user_type', role);
    }

    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
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

// Get single user (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .select(`
        *,
        user_addresses(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Update user (admin)
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data?.[0] || null, 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Deactivate user (admin)
router.patch('/admin/:id/deactivate', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('users')
      .update({ is_active: false })
      .eq('id', id)
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data?.[0] || null, 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Get user activity/orders (admin)
router.get('/admin/:id/activity', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('orders')
      .select('*')
      .eq('user_id', id)
      .order('created_at', { ascending: false });

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Get all categories (admin)
router.get('/categories/admin', async (req, res) => {
  try {
    const { data, error } = await supabaseAdmin
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data || [], 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Create category (admin)
router.post('/categories/admin', async (req, res) => {
  try {
    const category = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .insert([category])
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data?.[0] || null, 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Update category (admin)
router.put('/categories/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .update(updates)
      .eq('id', id)
      .select();

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, data?.[0] || null, 'Operation successful');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

// Delete category (admin)
router.delete('/categories/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabaseAdmin
      .from('categories')
      .delete()
      .eq('id', id);

    if (error) {
      return errorResponse(res, error.message, 'Operation failed', 500);
    }

    return successResponse(res, null, 'Category deleted successfully');
  } catch (error) {
    console.error('Route error:', error);
    return errorResponse(res, error.message, 'Operation failed', 500);
  }
});

export default router;
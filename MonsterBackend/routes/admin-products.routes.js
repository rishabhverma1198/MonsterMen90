/**
 * Admin Products Routes
 * Handles all product-related admin operations with proper authentication and authorization
 */

import express from 'express';
import { supabaseAdmin } from '../db/db.js';
import { authenticateUser, requireAdmin } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, notFoundResponse } from '../utils/response.util.js';

const router = express.Router();

// ✅ All admin routes require authentication and admin role
router.use(authenticateUser, requireAdmin);

/**
 * @route GET /api/admin/products
 * @desc Get all products (admin only)
 * @access Private/Admin
 */
router.get('/', async (req, res) => {
    try {
        // Add pagination support
        const { page = 1, limit = 20, search = '', category = '', active } = req.query;
        const offset = (page - 1) * limit;

        // Build query with filters
        let query = supabaseAdmin
            .from('products')
            .select(`
                *,
                categories(name, slug),
                product_variants(*)
            `, { count: 'exact' });

        // Apply search filter
        if (search) {
            query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
        }

        // Apply category filter
        if (category) {
            query = query.eq('category_id', category);
        }

        // Apply active filter
        if (active !== undefined) {
            query = query.eq('is_active', active === 'true');
        }

        // Apply pagination
        query = query.range(offset, offset + parseInt(limit) - 1)
                     .order('created_at', { ascending: false });

        const { data, error, count } = await query;

        if (error) {
            return errorResponse(res, error.message, 'Failed to fetch products', 500);
        }

        // Calculate pagination info
        const totalPages = Math.ceil(count / limit);
        const hasNextPage = parseInt(page) < totalPages;
        const hasPrevPage = parseInt(page) > 1;

        return successResponse(res, {
            products: data || [],
            pagination: {
                currentPage: parseInt(page),
                totalPages,
                totalItems: count,
                itemsPerPage: parseInt(limit),
                hasNextPage,
                hasPrevPage
            }
        }, 'Products fetched successfully');
    } catch (error) {
        console.error('Get products error:', error);
        return errorResponse(res, error.message, 'Failed to fetch products', 500);
    }
});

/**
 * @route GET /api/admin/products/:id
 * @desc Get single product by ID (admin only)
 * @access Private/Admin
 */
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { data, error } = await supabaseAdmin
            .from('products')
            .select(`
                *,
                categories(name, slug),
                product_variants(*)
            `)
            .eq('id', id)
            .single();

        if (error) {
            return errorResponse(res, error.message, 'Operation failed', 500);
        }

        return successResponse(res, data, 'Operation successful');
    } catch (error) {
        console.error('Route error:', error);
        return errorResponse(res, error.message, 'Operation failed', 500);
    }
});

/**
 * @route POST /api/admin/products
 * @desc Create new product (admin only)
 * @access Private/Admin
 */
router.post('/', async (req, res) => {
    try {
        const product = req.body;
        
        // Sanitize input to prevent XSS
        const { sanitizeObject } = require('../utils/validation.util');
        const sanitizedProduct = sanitizeObject(product);
         
        const { data, error } = await supabaseAdmin
            .from('products')
            .insert([{ ...sanitizedProduct, created_at: new Date().toISOString() }])
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

/**
 * @route PUT /api/admin/products/:id
 * @desc Update existing product (admin only)
 * @access Private/Admin
 */
router.put('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        // Sanitize input to prevent XSS
        const { sanitizeObject } = require('../utils/validation.util');
        const sanitizedUpdates = sanitizeObject(req.body);
        const updates = { ...sanitizedUpdates, updated_at: new Date().toISOString() };
         
        const { data, error } = await supabaseAdmin
            .from('products')
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

/**
 * @route DELETE /api/admin/products/:id
 * @desc Delete product (admin only)
 * @access Private/Admin
 */
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        
        const { error } = await supabaseAdmin
            .from('products')
            .delete()
            .eq('id', id);

        if (error) {
            return res.status(500).json({ success: false, error: error.message });
        }

        return successResponse(res, null, 'Product deleted successfully');
    } catch (error) {
        console.error('Route error:', error);
        return errorResponse(res, error.message, 'Operation failed', 500);
    }
});

/**
 * @route POST /api/admin/products/bulk
 * @desc Bulk operations on products (admin only)
 * @access Private/Admin
 */
router.post('/bulk', async (req, res) => {
    try {
        const { operation, productIds, updates } = req.body;
        
        if (operation === 'delete') {
            const { error } = await supabaseAdmin
                .from('products')
                .delete()
                .in('id', productIds);

            if (error) {
                return res.status(500).json({ success: false, error: error.message });
            }
        } else if (operation === 'update') {
            // Sanitize bulk updates
            const { sanitizeObject } = require('../utils/validation.util');
            const sanitizedUpdates = sanitizeObject(updates);
            const { data, error } = await supabaseAdmin
                .from('products')
                .update({ ...sanitizedUpdates, updated_at: new Date().toISOString() })
                .in('id', productIds)
                .select();

            if (error) {
                return res.status(500).json({ success: false, error: error.message });
            }
            
            return successResponse(res, data, 'Bulk operation completed');
        }

        return successResponse(res, null, 'Bulk operation completed');
    } catch (error) {
        console.error('Route error:', error);
        return errorResponse(res, error.message, 'Operation failed', 500);
    }
});

export default router;

import express from 'express';
import { supabase } from '../db/db.js';
import { optionalAuth } from '../middleware/auth.middleware.js';
import { successResponse, errorResponse, notFoundResponse, paginatedResponse } from '../utils/response.util.js';
import { validateQuery, validateParams } from '../utils/validation.util.js';
import { productSchemas, commonSchemas } from '../utils/validation.util.js';
import { z } from 'zod';

const router = express.Router();

// Get products for website (public) - with pagination and filters
router.get('/', 
  optionalAuth,
  validateQuery(productSchemas.query),
  async (req, res) => {
    try {
      const { 
        category, 
        min_price, 
        max_price, 
        in_stock, 
        featured, 
        search,
        page = 1,
        limit = 20,
        offset
      } = req.query;

      let query = supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `, { count: 'exact' })
        .eq('is_active', true);

      // Apply filters
      if (category) {
        query = query.eq('category_id', category);
      }

      if (min_price) {
        query = query.gte('base_price', parseFloat(min_price));
      }

      if (max_price) {
        query = query.lte('base_price', parseFloat(max_price));
      }

      if (featured) {
        query = query.eq('is_featured', true);
      }

      if (search) {
        const escapedSearch = `%${search}%`;
        query = query.or(`name.ilike.${escapedSearch},description.ilike.${escapedSearch},brand.ilike.${escapedSearch}`);
      }

      if (in_stock) {
        // Filter products that have variants with stock
        query = query.gt('product_variants.stock_quantity', 0);
      }

      // Apply pagination
      const limitNum = parseInt(limit);
      const offsetNum = offset ? parseInt(offset) : (page - 1) * limitNum;
      query = query.range(offsetNum, offsetNum + limitNum - 1);

      // Order by featured first, then by creation date
      query = query.order('is_featured', { ascending: false })
                   .order('created_at', { ascending: false });

      const { data, error, count } = await query;

      if (error) {
        return errorResponse(res, error.message, 'Failed to fetch products', 500);
      }

      return paginatedResponse(res, 
        data || [], 
        {
          page: parseInt(page),
          limit: limitNum,
          total: count || 0,
          hasMore: (offsetNum + limitNum) < (count || 0)
        },
        'Products fetched successfully'
      );
    } catch (error) {
      console.error('Get products error:', error);
      return errorResponse(res, error.message, 'Failed to fetch products', 500);
    }
  }
);

// Get single product for website (public)
router.get('/:id',
  optionalAuth,
  validateParams(z.object({ id: commonSchemas.uuid })),
  async (req, res) => {
    try {
      const { id } = req.params;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('id', id)
        .eq('is_active', true)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return notFoundResponse(res, 'Product not found');
        }
        return errorResponse(res, error.message, 'Failed to fetch product', 500);
      }

      return successResponse(res, data, 'Product fetched successfully');
    } catch (error) {
      console.error('Get product error:', error);
      return errorResponse(res, error.message, 'Failed to fetch product', 500);
    }
  }
);

// Get featured products (public)
router.get('/featured/:limit?',
  optionalAuth,
  validateParams(z.object({ 
    limit: z.coerce.number().int().positive().max(100).optional()
  })),
  async (req, res) => {
    try {
      const { limit = 8 } = req.params;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_featured', true)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        return errorResponse(res, error.message, 'Failed to fetch featured products', 500);
      }

      return successResponse(res, data || [], 'Featured products fetched successfully');
    } catch (error) {
      console.error('Get featured products error:', error);
      return errorResponse(res, error.message, 'Failed to fetch featured products', 500);
    }
  }
);

// Get products by gender (public)
router.get('/gender/:gender/:limit?',
  optionalAuth,
  validateParams(z.object({
    gender: z.enum(['men', 'women', 'unisex']),
    limit: z.coerce.number().int().positive().max(100).optional()
  })),
  validateQuery(z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
  })),
  async (req, res) => {
    try {
      const { gender } = req.params;
      const { limit = 20 } = req.query;
      
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('target_audience', gender)
        .eq('is_active', true)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        return errorResponse(res, error.message, 'Failed to fetch products by gender', 500);
      }

      return successResponse(res, data || [], 'Products fetched successfully');
    } catch (error) {
      console.error('Get products by gender error:', error);
      return errorResponse(res, error.message, 'Failed to fetch products by gender', 500);
    }
  }
);

// Search products (public)
router.get('/search/:query',
  optionalAuth,
  validateParams(z.object({
    query: z.string().min(1, 'Search query is required')
  })),
  validateQuery(z.object({
    limit: z.coerce.number().int().positive().max(100).optional()
  })),
  async (req, res) => {
    try {
      const { query } = req.params;
      const { limit = 20 } = req.query;
      
      const escapedSearch = `%${query}%`;
      const { data, error } = await supabase
        .from('products')
        .select(`
          *,
          categories(id, name, slug, parent_id),
          product_variants(id, size, color, stock_quantity, price, sku)
        `)
        .eq('is_active', true)
        .or(`name.ilike.${escapedSearch},description.ilike.${escapedSearch},brand.ilike.${escapedSearch},material.ilike.${escapedSearch}`)
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(parseInt(limit));

      if (error) {
        return errorResponse(res, error.message, 'Failed to search products', 500);
      }

      return successResponse(res, data || [], 'Products found successfully');
    } catch (error) {
      console.error('Search products error:', error);
      return errorResponse(res, error.message, 'Failed to search products', 500);
    }
  }
);

export default router;

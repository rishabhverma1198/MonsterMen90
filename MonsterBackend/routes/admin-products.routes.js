import express from 'express';
import { supabase } from '../db/db.js';

const router = express.Router();

// Get all products (admin)
router.get('/', async (req, res) => {
  try {
    const { category, active, target_audience, search, limit = 20, offset = 0 } = req.query;
    
    let query = supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        product_variants(*)
      `, { count: 'exact' });

    // Apply filters
    if (category) {
      query = query.eq('category_id', category);
    }
    
    if (active !== undefined) {
      query = query.eq('is_active', active === 'true');
    }
    
    if (target_audience) {
      query = query.eq('target_audience', target_audience);
    }
    
    if (search) {
      const escapedSearch = `%${search}%`;
      query = query.or(`name.ilike.${escapedSearch},brand.ilike.${escapedSearch},description.ilike.${escapedSearch}`);
    }

    // Apply pagination
    const limitNum = parseInt(limit);
    const offsetNum = parseInt(offset);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    // Order by creation date
    query = query.order('created_at', { ascending: false });

    const { data, error, count } = await query;

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({
      products: data || [],
      total: count || 0,
      hasMore: (offsetNum + limitNum) < (count || 0)
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product (admin)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name, slug),
        product_variants(*)
      `)
      .eq('id', id)
      .single();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create product (admin)
router.post('/', async (req, res) => {
  try {
    const product = req.body;
    
    // Validate required fields (based on actual database schema)
    if (!product.name || !product.category_id || !product.base_price || !product.sku) {
      return res.status(400).json({ error: 'Missing required fields: name, category_id, base_price, sku' });
    }

    // Generate slug if not provided
    if (!product.slug) {
      const slug = product.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      product.slug = slug;
    }

    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product (admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete product (admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Toggle product status (admin)
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { is_active } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({ 
        is_active, 
        updated_at: new Date().toISOString() 
      })
      .eq('id', id)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get categories (admin)
router.get('/categories', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create category (admin)
router.post('/categories', async (req, res) => {
  try {
    const category = req.body;
    
    if (!category.name) {
      return res.status(400).json({ error: 'Category name is required' });
    }

    // Generate slug
    const slug = category.name.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    
    const { data, error } = await supabase
      .from('categories')
      .insert([{ ...category, slug }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get low stock items (admin)
router.get('/low-stock', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('admin_low_stock_alerts')
      .select('*');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get product variants (admin)
router.get('/:id/variants', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('product_variants')
      .select('*')
      .eq('product_id', id)
      .order('size');

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update variant stock (admin)
router.patch('/variants/:variantId/stock', async (req, res) => {
  try {
    const { variantId } = req.params;
    const { stock_quantity, min_stock_level, price, wholesale_price } = req.body;
    
    const updates = {};
    if (stock_quantity !== undefined) updates.stock_quantity = stock_quantity;
    if (min_stock_level !== undefined) updates.min_stock_level = min_stock_level;
    if (price !== undefined) updates.price = price;
    if (wholesale_price !== undefined) updates.wholesale_price = wholesale_price;
    
    const { data, error } = await supabase
      .from('product_variants')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', variantId)
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
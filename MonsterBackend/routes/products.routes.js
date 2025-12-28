import express from 'express';
import { supabase } from '../db/db.js';

const router = express.Router();

// Get all products (admin)
router.get('/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
        product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get single product (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        categories(name),
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
router.post('/admin', async (req, res) => {
  try {
    const product = req.body;
    
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
router.put('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update(updates)
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
router.delete('/admin/:id', async (req, res) => {
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

// Get products for website (public)
router.get('/', async (req, res) => {
  try {
    const { 
      gender, 
      category, 
      product_type, 
      min_price, 
      max_price, 
      in_stock, 
      featured, 
      search,
      limit = 20,
      offset = 0 
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
    if (gender) {
      // Note: gender column doesn't exist in current schema
      // This filter will be ignored until column is added
      console.log('Warning: gender filter applied but gender column does not exist');
    }

    if (category) {
      query = query.eq('category_id', category);
    }

    if (product_type) {
      // Note: product_type column doesn't exist in current schema
      // This filter will be ignored until column is added
      console.log('Warning: product_type filter applied but product_type column does not exist');
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
    const offsetNum = parseInt(offset);
    query = query.range(offsetNum, offsetNum + limitNum - 1);

    // Order by featured first, then by creation date
    query = query.order('is_featured', { ascending: false })
                 .order('created_at', { ascending: false });

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

// Get single product for website (public)
router.get('/:id', async (req, res) => {
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
        return res.status(404).json({ error: 'Product not found' });
      }
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get featured products (public)
router.get('/featured/:limit?', async (req, res) => {
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
      return res.status(500).json({ error: error.message });
    }

    res.json({ products: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get products by gender (public)
router.get('/gender/:gender/:limit?', async (req, res) => {
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
      .eq('gender', gender)
      .eq('is_active', true)
      .order('is_featured', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(parseInt(limit));

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ products: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Search products (public)
router.get('/search/:query', async (req, res) => {
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
      return res.status(500).json({ error: error.message });
    }

    res.json({ products: data || [] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
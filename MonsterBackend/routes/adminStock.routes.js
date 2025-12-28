import express from 'express';
import { supabase } from '../db/db.js';

const router = express.Router();

// Get stock overview (admin)
router.get('/overview', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select(`
        *,
        product_variants(*)
      `)
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
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

    res.json({ data: stats });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock movements (admin)
router.get('/movements', async (req, res) => {
  try {
    const { product_id, limit = 50 } = req.query;
    
    let query = supabase
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
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create stock movement (admin)
router.post('/movements', async (req, res) => {
  try {
    const movement = req.body;
    
    const { data, error } = await supabase
      .from('stock_movements')
      .insert([{
        ...movement,
        created_at: new Date().toISOString()
      }])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    // Update stock quantity
    if (movement.product_variant_id && movement.quantity_change) {
      await supabase
        .from('product_variants')
        .update({
          stock_quantity: movement.new_quantity,
          updated_at: new Date().toISOString()
        })
        .eq('id', movement.product_variant_id);
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get stock alerts (admin)
router.get('/alerts', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, brand),
        stock_movements(*)
      `)
      .lte('stock_quantity', 10)
      .order('stock_quantity', { ascending: true });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update stock threshold (admin)
router.patch('/threshold/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { min_stock_level } = req.body;
    
    const { data, error } = await supabase
      .from('product_variants')
      .update({ 
        min_stock_level,
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

export default router;
import express from 'express';
import { supabase } from '../db/db.js';

const router = express.Router();

// Get all inventory items (admin)
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('product_variants')
      .select(`
        *,
        products(name, brand, category_id)
      `)
      .order('updated_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update inventory stock (admin)
router.patch('/:id/stock', async (req, res) => {
  try {
    const { id } = req.params;
    const { stock_quantity } = req.body;
    
    const { data, error } = await supabase
      .from('product_variants')
      .update({ 
        stock_quantity,
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

// Get low stock alerts (admin)
router.get('/low-stock', async (req, res) => {
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

export default router;
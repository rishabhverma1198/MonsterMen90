import express from 'express';
import { supabase } from '../db/db.js';

const router = express.Router();

// Get all orders (admin)
router.get('/admin', async (req, res) => {
  try {
    const { status, user } = req.query;
    
    let query = supabase
      .from('orders')
      .select(`
        *,
        users(full_name, email),
        order_items(*)
      `)
      .order('created_at', { ascending: false });

    if (status) {
      query = query.eq('status', status);
    }

    if (user) {
      query = query.eq('user_id', user);
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

// Get single order (admin)
router.get('/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        users(full_name, email, phone),
        order_items(*)
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

// Update order status (admin)
router.put('/admin/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .update({ 
        status, 
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

// Create order (admin)
router.post('/admin', async (req, res) => {
  try {
    const order = req.body;
    
    const { data, error } = await supabase
      .from('orders')
      .insert([order])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get all discounts (admin)
router.get('/discounts/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('discounts')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create discount (admin)
router.post('/discounts/admin', async (req, res) => {
  try {
    const discount = req.body;
    
    const { data, error } = await supabase
      .from('discounts')
      .insert([discount])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update discount (admin)
router.put('/discounts/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;
    
    const { data, error } = await supabase
      .from('discounts')
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

// Delete discount (admin)
router.delete('/discounts/admin/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    const { data, error } = await supabase
      .from('discounts')
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

// Get all price rules (admin)
router.get('/pricing/admin', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('price_rules')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create price rule (admin)
router.post('/pricing/admin', async (req, res) => {
  try {
    const rule = req.body;
    
    const { data, error } = await supabase
      .from('price_rules')
      .insert([rule])
      .select();

    if (error) {
      return res.status(500).json({ error: error.message });
    }

    res.json({ data: data[0] });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update product price (admin)
router.put('/pricing/product/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { price } = req.body;
    
    const { data, error } = await supabase
      .from('products')
      .update({ base_price: price })
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
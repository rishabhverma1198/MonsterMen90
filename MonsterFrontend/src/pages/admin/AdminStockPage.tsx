// components/admin/AdminDashboardWithStock.tsx

import { useState, useEffect } from 'react';
import { supabase } from '@/supabaseClient';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

interface Product {
  id: string;
  title: string;
  stock: number;
  category: string;
  isActive: boolean;
}

export default function AdminProductStockManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [size, setSize] = useState('');
  const [quantity, setQuantity] = useState('');
  const [msg, setMsg] = useState('');

  const fetchProducts = async () => {
    try {
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    }
  };

  useEffect(() => {
    const loadProducts = async () => {
      await fetchProducts();
    };
    loadProducts();
  }, []);

  const updateStock = async () => {
    if (!selectedProduct) return;

    const { data, error } = await supabase.functions.invoke('stock-management', {
      body: {
        productId: selectedProduct.id,
        size,
        quantity: Number(quantity),
      },
    });

    if (error) {
      setMsg('Error updating stock');
      console.error('Function error:', error);
    } else {
      setMsg('Stock updated successfully');
      fetchProducts();
    }
  };

  return (
    <div className="space-y-6">
      {products.map((p) => (
        <div
          key={p.id}
          className="flex justify-between items-center border p-4 rounded-lg"
        >
          <div>
            <p className="font-semibold">{p.title}</p>
            <p className="text-sm text-gray-500">{p.category}</p>
            <Badge variant={p.isActive ? 'default' : 'secondary'}>
              Stock: {p.stock}
            </Badge>
          </div>

          <Button
            onClick={() => {
              setSelectedProduct(p);
              setOpen(true);
              setMsg('');
            }}
          >
            Update Stock
          </Button>
        </div>
      ))}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Stock</DialogTitle>
          </DialogHeader>

          <Input
            placeholder="Size (S / M / L)"
            value={size}
            onChange={(e) => setSize(e.target.value)}
          />

          <Input
            type="number"
            placeholder="Quantity"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
          />

          <Button onClick={updateStock}>Save</Button>

          {msg && <p className="text-sm text-green-600">{msg}</p>}
        </DialogContent>
      </Dialog>
    </div>
  );
}
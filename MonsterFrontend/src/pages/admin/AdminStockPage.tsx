import { useState, useEffect, useMemo } from 'react';
import { supabase } from '@/lib/supabase';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Package, AlertTriangle, Loader2, RefreshCcw } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import { Card, CardContent } from '@/components/ui/card';

interface Product {
  id: string;
  title: string;
  stock: number;
  category: string;
  isActive: boolean;
}

export default function AdminProductStockManager() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Modal State
  const [open, setOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [size, setSize] = useState('M'); // Default size
  const [quantity, setQuantity] = useState('');

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await fetch('/api/products');
      const data = await res.json();
      setProducts(data.products || []);
    } catch (error) {
      toast({ title: "Error", description: "Products fetch nahi ho paye.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProducts(); }, []);

  // Filtering Logic (Scalability ke liye optimized)
  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
      p.category.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [products, searchTerm]);

  const handleUpdateStock = async () => {
    if (!selectedProduct || !quantity) return;

    const qty = parseInt(quantity);
    if (qty <= 0) return toast({ title: "Invalid Input", description: "Quantity 1 se zyada honi chahiye." });

    setIsUpdating(true);
    try {
      const { error } = await supabase.functions.invoke('stock-management', {
        body: { productId: selectedProduct.id, size, quantity: qty },
      });

      if (error) throw error;

      toast({ title: "Success! ✅", description: `${selectedProduct.title} ka stock update ho gaya.` });
      setOpen(false);
      setQuantity('');
      fetchProducts(); // Refresh list
    } catch (err: any) {
      toast({ title: "Update Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsUpdating(false);
    }
  };

  // Helper for stock badges
  const getStockBadge = (stock: number) => {
    if (stock <= 0) return <Badge variant="destructive">Out of Stock</Badge>;
    if (stock < 10) return <Badge className="bg-amber-100 text-amber-700 border-amber-200">Low Stock: {stock}</Badge>;
    return <Badge className="bg-green-100 text-green-700 border-green-200">In Stock: {stock}</Badge>;
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto p-4 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Stock Management</h1>
          <p className="text-muted-foreground text-sm">Products ki quantity aur size-wise variants manage karein.</p>
        </div>
        <Button variant="outline" size="sm" onClick={fetchProducts} disabled={loading}>
          <RefreshCcw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </Button>
      </div>

      {/* Search Bar */}
      <div className="relative group">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
        <Input 
          placeholder="Product ya category dhoondein..." 
          className="pl-10 h-12 rounded-xl shadow-sm border-gray-200" 
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Product List */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-3">
          <Loader2 className="animate-spin text-primary w-10 h-10" />
          <p className="text-muted-foreground animate-pulse">Inventory load ho rahi hai...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4">
          {filteredProducts.map((p) => (
            <Card key={p.id} className="overflow-hidden hover:shadow-md transition-all border-gray-100">
              <CardContent className="p-4 sm:p-6 flex flex-col sm:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-4 text-center sm:text-left">
                  <div className="bg-gray-100 p-3 rounded-lg text-primary">
                    <Package size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg leading-tight">{p.title}</h3>
                    <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">{p.category}</p>
                    <div className="mt-2">{getStockBadge(p.stock)}</div>
                  </div>
                </div>

                <Button 
                  className="w-full sm:w-auto rounded-lg shadow-sm"
                  onClick={() => { setSelectedProduct(p); setOpen(true); }}
                >
                  Update Stock
                </Button>
              </CardContent>
            </Card>
          ))}
          {filteredProducts.length === 0 && (
            <div className="text-center py-20 bg-gray-50 rounded-2xl border border-dashed">
              <AlertTriangle className="mx-auto text-amber-500 mb-2" size={32} />
              <p className="text-gray-500">Koi product nahi mila.</p>
            </div>
          )}
        </div>
      )}

      {/* Stock Update Dialog */}
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-[400px]">
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>{selectedProduct?.title} ke liye naya stock add karein.</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label>Size Select Karein</Label>
              <Select value={size} onValueChange={setSize}>
                <SelectTrigger className="h-11">
                  <SelectValue placeholder="Size" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="S">Small (S)</SelectItem>
                  <SelectItem value="M">Medium (M)</SelectItem>
                  <SelectItem value="L">Large (L)</SelectItem>
                  <SelectItem value="XL">Extra Large (XL)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantity (Pcs)</Label>
              <Input
                type="number"
                placeholder="e.g. 50"
                value={quantity}
                className="h-11"
                onChange={(e) => setQuantity(e.target.value)}
              />
            </div>

            <Button 
              className="w-full h-12 text-md" 
              onClick={handleUpdateStock} 
              disabled={isUpdating}
            >
              {isUpdating ? <Loader2 className="animate-spin mr-2" /> : "Save Changes"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
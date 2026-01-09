import React, { useState, useEffect, useCallback } from 'react';
import { Link } from "react-router-dom";
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Eye } from 'lucide-react';
import BackButton from '@/components/common/BackButton';
import { useCart } from '@/hooks/useCart';
import { useToast } from '@/hooks/use-toast';

const productTypes = [
  'Shirts', 'T-Shirts', 'Pants', 'Jeans', 'Jackets', 'Sweaters', 'Hoodies', 'Shorts', 'Blazers', 'Coats'
];

export default function WomenCollection() {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');
  
  const { upsertItem } = useCart();
  const { toast } = useToast();

  const fetchWomenProducts = useCallback(async () => {
    try {
      setLoading(true);
      const result = await WebsiteProductService.getProductsByGender('women', 50);
      setProducts(result);
    } catch (error) {
      console.error('Error fetching women products:', error);
      toast({ title: "Error", description: "Failed to load products", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchWomenProducts();
  }, [fetchWomenProducts]);

  useEffect(() => {
    let filtered = [...products];
    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()) || p.brand?.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    if (selectedType !== 'all') {
      filtered = filtered.filter(p => p.product_type === selectedType);
    }
    
    const sortFns: Record<string, (a: WebsiteProduct, b: WebsiteProduct) => number> = {
      'price-low': (a, b) => a.base_price - b.base_price,
      'price-high': (a, b) => b.base_price - a.base_price,
      'name': (a, b) => a.name.localeCompare(b.name),
      'newest': (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
    };
    setFilteredProducts([...filtered].sort(sortFns[sortBy] || sortFns['newest']));
  }, [products, searchTerm, selectedType, sortBy]);

  const handleQuickAdd = (product: WebsiteProduct) => {
    const size = product.available_sizes?.[0] || 'Standard';
    upsertItem({
      id: Math.abs(product.id.split('').reduce((a: number, b: string) => {a=((a<<5)-a)+b.charCodeAt(0);return a&a}, 0)),
      name: product.name,
      image: product.images?.[0] || '',
      quantity: 1,
      price: product.base_price,
      sizeBreakup: { [size]: { qty: 1, price: product.base_price } }
    });
    toast({ title: "Added to Cart", description: `${product.name} has been added.` });
  };

  const formatPrice = (price: number) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);

  if (loading) return <div className="max-w-7xl mx-auto px-6 py-12 animate-pulse"><div className="h-8 bg-gray-200 w-1/3 mb-6"></div><div className="grid grid-cols-4 gap-6">{[...Array(8)].map((_, i) => <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>)}</div></div>;

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8"><BackButton to="/buyer" /><h1 className="text-3xl font-bold mt-4">Women Collection</h1></div>
      
      <div className="bg-white p-6 mb-8 border rounded-lg grid grid-cols-1 md:grid-cols-4 gap-4">
        <Input placeholder="Search..." value={searchTerm} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)} />
        <Select value={selectedType} onValueChange={setSelectedType}>
          <SelectTrigger><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent><SelectItem value="all">All Types</SelectItem>{productTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent><SelectItem value="newest">Newest</SelectItem><SelectItem value="price-low">Price: Low-High</SelectItem><SelectItem value="price-high">Price: High-Low</SelectItem></SelectContent>
        </Select>
        <Button variant="outline" onClick={() => { setSearchTerm(''); setSelectedType('all'); setSortBy('newest'); }}>Clear</Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {filteredProducts.map(product => (
          <Card key={product.id} className="group overflow-hidden">
            <div className="relative h-48 bg-gray-100">
              <img src={product.images?.[0]} alt={product.name} className="w-full h-full object-cover" />
              {product.is_featured && <Badge className="absolute top-2 left-2 bg-yellow-500">Featured</Badge>}
            </div>
            <CardContent className="p-4">
              <h3 className="font-bold truncate">{product.name}</h3>
              <p className="text-lg font-bold mt-2">{formatPrice(product.base_price)}</p>
              <div className="flex gap-2 mt-4">
                <Link to={`/buyer/product/${product.id}`} className="flex-1"><Button variant="outline" size="sm" className="w-full"><Eye className="w-4 h-4 mr-1"/> View</Button></Link>
                <Button size="sm" className="flex-1" onClick={() => handleQuickAdd(product)}><ShoppingCart className="w-4 h-4 mr-1"/> Add</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
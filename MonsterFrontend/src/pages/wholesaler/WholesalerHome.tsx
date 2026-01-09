import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Star, Eye, Search, Filter, Package, Loader2, RefreshCcw } from 'lucide-react';
import BackButton from '@/components/common/BackButton';
import { useCart } from '@/context/CartContext';
import { hashStringToNumber } from '@/lib/utils';
import { toast } from '@/hooks/use-toast';

// Constants
export const MIN_WHOLESALE_QUANTITY = 20;
export const WHOLESALE_DISCOUNT_RATE = 0.2;
export const WHOLESALE_PRICE_MULTIPLIER = 0.8;
export const DEFAULT_PAGE_SIZE = 20;

export default function WholesalerHome() {
  const navigate = useNavigate();
  const { upsertItem } = useCart();
  
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // --- Logic: Data Fetching ---
  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const pageSize = DEFAULT_PAGE_SIZE;
      const result = await WebsiteProductService.getProducts(undefined, pageSize, 0);
      setProducts(result?.products || []);
    } catch (error) {
      console.error('Failed to load products:', error);
      toast({ 
        title: "Failed to load products", 
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: "destructive" 
      });
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  // --- Logic: Filtering & Sorting (Optimized with useMemo) ---
  const processedProducts = useMemo(() => {
    let result = [...products];

    if (searchTerm) {
      const lowerTerm = searchTerm.toLowerCase();
      result = result.filter(p => 
        p.name.toLowerCase().includes(lowerTerm) || 
        p.brand?.toLowerCase().includes(lowerTerm)
      );
    }

    if (selectedGender !== 'all') {
      result = result.filter(p => p.gender && p.gender === selectedGender);
    }

    return result.sort((a, b) => {
      if (sortBy === 'price-low') return a.base_price - b.base_price;
      if (sortBy === 'price-high') return b.base_price - a.base_price;
      if (sortBy === 'name') return a.name.localeCompare(b.name);
      return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
    });
  }, [products, searchTerm, selectedGender, sortBy]);

  // --- Logic: Price Calculations ---
  const getWholesalePrice = (product: WebsiteProduct) => {
    // Priority 1: DB se wholesale_price, Priority 2: 20% Discount
    return product.wholesale_price || product.base_price * WHOLESALE_PRICE_MULTIPLIER;
  };

  const formatPrice = (price: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0 }).format(price);

  // --- Handlers ---
  const handleAddToCart = async (product: WebsiteProduct) => {
    setAddingToCart(product.id);
    try {
      const wPrice = getWholesalePrice(product);
      upsertItem({
        id: hashStringToNumber(product.id),
        name: product.name,
        image: product.images?.[0] || '',
        quantity: MIN_WHOLESALE_QUANTITY,
        price: wPrice,
        sizeBreakup: { 'Default': { qty: MIN_WHOLESALE_QUANTITY, price: wPrice } },
        minQty: MIN_WHOLESALE_QUANTITY
      });
      toast({ title: "Added to Cart", description: `${product.name} ki ${MIN_WHOLESALE_QUANTITY} units add ho gayi hain.` });
    } finally {
      setAddingToCart(null);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12 animate-in fade-in duration-500">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-10">
          <div className="space-y-2">
            <BackButton to="/" />
            <h1 className="text-3xl md:text-4xl font-black tracking-tight text-gray-900">Wholesale Center</h1>
            <p className="text-muted-foreground font-medium">Bulk Purchase: Flat 20% Off • MOQ 20 Units</p>
          </div>
          <div className="flex bg-white p-1 rounded-xl shadow-sm border">
            <Link to="/wholesaler/men" className="px-6 py-2 rounded-lg hover:bg-gray-50 text-sm font-bold transition-colors">Men</Link>
            <Link to="/wholesaler/women" className="px-6 py-2 rounded-lg hover:bg-gray-50 text-sm font-bold transition-colors">Women</Link>
          </div>
        </div>

        {/* Global Search & Filters */}
        <Card className="border-none shadow-sm mb-8 overflow-hidden">
          <CardContent className="p-4 md:p-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input 
                placeholder="Product dhoondein..." 
                className="pl-10 h-11 border-gray-200" 
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>
            
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Gender" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Collections</SelectItem>
                <SelectItem value="men">Men's Wear</SelectItem>
                <SelectItem value="women">Women's Wear</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="h-11"><SelectValue placeholder="Sort" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest Arrivals</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" className="h-11 font-bold border-dashed" onClick={() => { setSearchTerm(''); setSelectedGender('all'); }}>
              <RefreshCcw className="w-4 h-4 mr-2" /> Reset
            </Button>
          </CardContent>
        </Card>

        {/* Products Grid */}
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : processedProducts.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-8">
            {processedProducts.map((product) => (
              <ProductGridItem 
                key={product.id} 
                product={product} 
                isAdding={addingToCart === product.id}
                onAdd={() => handleAddToCart(product)}
                onView={() => navigate(`/wholesaler/product/${product.id}`)}
                formatPrice={formatPrice}
                wholesalePrice={getWholesalePrice(product)}
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-24 bg-white rounded-3xl border-2 border-dashed">
            <Package className="h-12 w-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-xl font-bold">Koi products nahi mile</h3>
            <p className="text-muted-foreground mt-1">Filters change karke try karein.</p>
          </div>
        )}
      </div>
    </div>
  );
}

// --- Sub-Components ---

function ProductGridItem({ product, isAdding, onAdd, onView, formatPrice, wholesalePrice }: any) {
  return (
    <Card className="group border-none shadow-sm hover:shadow-xl transition-all duration-300 rounded-2xl overflow-hidden bg-white">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img 
          src={product.images?.[0]} 
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" 
          alt={product.name} 
        />
        <div className="absolute top-3 left-3 flex flex-col gap-2">
          {product.is_featured && <Badge className="bg-yellow-400 text-black border-none"><Star size={10} fill="black" className="mr-1" /> Featured</Badge>}
          <Badge className="bg-blue-600 border-none shadow-lg">Save {Math.round(((product.base_price - wholesalePrice)/product.base_price)*100)}%</Badge>
        </div>
      </div>
      
      <CardContent className="p-4 space-y-3">
        <div>
          <h3 className="font-bold text-gray-900 truncate">{product.name}</h3>
          <p className="text-[11px] text-gray-500 uppercase tracking-widest font-semibold">{product.brand || 'Premium Quality'}</p>
        </div>

        <div className="flex flex-col gap-1">
          <span className="text-[10px] text-gray-400 line-through font-bold">{formatPrice(product.base_price)}</span>
          <div className="flex items-center justify-between">
            <span className="text-lg font-black text-blue-600">{formatPrice(wholesalePrice)}</span>
            <span className="text-[10px] font-bold text-gray-400">MOQ: 20pcs</span>
          </div>
        </div>

        <div className="flex gap-2 pt-2">
          <Button variant="secondary" size="sm" className="flex-1 rounded-lg font-bold" onClick={onView}>View</Button>
          <Button size="sm" className="flex-1 bg-gray-900 rounded-lg" onClick={onAdd} disabled={isAdding}>
            {isAdding ? <Loader2 className="animate-spin w-4 h-4" /> : <ShoppingCart className="w-4 h-4" />}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="aspect-[3/4] bg-gray-200 rounded-2xl" />
      <div className="space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
      </div>
    </div>
  );
}
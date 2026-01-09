import { useState, useEffect, useCallback, useMemo } from 'react';
import { Link } from "react-router-dom";
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ShoppingCart, Star, Eye } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/types/cart-types';
import BackButton from '@/components/common/BackButton';
import SingleSizeModal from '@/components/common/SingleSizeModal';
import { hashStringToNumber } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton'; // Assuming you have a skeleton component

export default function BuyerHome() {
  const [featuredProducts, setFeaturedProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  
  const [sizeModal, setSizeModal] = useState({
    isOpen: false,
    selectedSize: '',
    pendingProduct: null as WebsiteProduct | null,
  });
  
  const { toast } = useToast();
  const { upsertItem } = useCart();

  const fetchFeaturedProducts = useCallback(async () => {
    try {
      setLoading(true);
      const products = await WebsiteProductService.getFeaturedProducts(8);
      setFeaturedProducts(products || []);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast({
        title: "Error",
        description: "Products load nahi ho paye. Please refresh karein.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchFeaturedProducts();
  }, [fetchFeaturedProducts]);

  const addToCartWithSize = async (product: WebsiteProduct, size: string) => {
    try {
      setAddingToCart(product.id);
      
      if (!product.id || !product.base_price) throw new Error('Invalid product data');

      const cartItem: CartItem = {
        id: hashStringToNumber(product.id + size), // Unique ID per size
        name: product.name,
        image: product.images?.[0] || '',
        quantity: 1,
        price: product.base_price,
        sizeBreakup: {
          [size]: { qty: 1, price: product.base_price }
        }
      };

      upsertItem(cartItem);
      
      toast({
        title: "Success",
        description: `${product.name} (Size: ${size}) cart mein add ho gaya!`,
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Cart mein add karne mein problem hui.",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const handleAddToCartClick = (product: WebsiteProduct) => {
    const availableSizes = product.available_sizes || [];
    if (availableSizes.length === 0) {
      addToCartWithSize(product, 'Standard');
    } else {
      setSizeModal({ isOpen: true, selectedSize: '', pendingProduct: product });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price || 0);
  };

  // Loading UI using Skeletons
  if (loading) {
    return (
      <div className="responsive-container py-8 space-y-8">
        <Skeleton className="h-10 w-48" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container py-8 md:py-12 animate-in fade-in duration-500">
      <div className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <BackButton to="/" className="mb-4" />
          <h1 className="text-3xl md:text-4xl font-extrabold text-gray-900 tracking-tight">
            MonsterMen90
          </h1>
          <p className="text-gray-500 mt-1">Premium styles, curated for you.</p>
        </div>
        <Button variant="secondary" asChild className="rounded-full px-6">
          <Link to="/buyer/orders">My Orders</Link>
        </Button>
      </div>

      {featuredProducts.length > 0 ? (
        <section className="mb-16">
          <div className="flex items-center justify-between mb-8">
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Star className="w-6 h-6 text-yellow-500 fill-yellow-500" />
              Featured Collection
            </h2>
            <Link to="/buyer/all-products" className="text-blue-600 font-semibold hover:underline text-sm">
              View All →
            </Link>
          </div>
          
          <div className="responsive-grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard 
                key={product.id}
                product={product}
                onAddToCart={handleAddToCartClick}
                isAdding={addingToCart === product.id}
                formatPrice={formatPrice}
              />
            ))}
          </div>
        </section>
      ) : (
        <EmptyState />
      )}

      {/* Categories */}
      <section className="grid sm:grid-cols-2 gap-6">
        <CategoryCard 
          title="Men" 
          to="/buyer/men" 
          gradient="from-blue-500 to-indigo-600" 
          label="M" 
          desc="Rugged & Refined"
        />
        <CategoryCard 
          title="Women" 
          to="/buyer/women" 
          gradient="from-pink-500 to-rose-600" 
          label="W" 
          desc="Elegant & Bold"
        />
      </section>
      
      <SingleSizeModal
        isOpen={sizeModal.isOpen}
        sizes={sizeModal.pendingProduct?.available_sizes || []}
        selectedSize={sizeModal.selectedSize}
        onClose={() => setSizeModal(prev => ({ ...prev, isOpen: false }))}
        onConfirm={(size) => {
          if (sizeModal.pendingProduct) addToCartWithSize(sizeModal.pendingProduct, size);
          setSizeModal(prev => ({ ...prev, isOpen: false }));
        }}
      />
    </div>
  );
}

// --- Sub-components for cleaner code ---

function ProductCard({ product, onAddToCart, isAdding, formatPrice }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-md hover:shadow-xl transition-all duration-300 group">
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={product.images?.[0] || '/api/placeholder/400/500'}
          alt={product.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-2 right-2 flex flex-col gap-2">
          <Badge className="bg-white/90 text-black backdrop-blur-md uppercase text-[10px]">
            {product.gender}
          </Badge>
        </div>
      </div>
      <CardContent className="p-4 bg-white">
        <h3 className="font-bold text-gray-900 line-clamp-1">{product.name}</h3>
        <p className="text-lg font-black text-orange-600 mt-1">
          {formatPrice(product.base_price)}
        </p>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" size="sm" className="flex-1" asChild>
            <Link to={`/buyer/product/${product.id}`}><Eye className="w-4 h-4 mr-2" />View</Link>
          </Button>
          <Button 
            size="sm" 
            className="flex-1 bg-black hover:bg-gray-800" 
            disabled={isAdding}
            onClick={() => onAddToCart(product)}
          >
            <ShoppingCart className="w-4 h-4 mr-2" />
            {isAdding ? '...' : 'Add'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CategoryCard({ title, to, gradient, label, desc }: any) {
  return (
    <Link to={to} className={`group relative overflow-hidden rounded-2xl p-8 h-48 bg-gradient-to-br ${gradient} text-white transition-all hover:scale-[0.98]`}>
      <div className="relative z-10">
        <span className="text-4xl font-black opacity-40">{label}</span>
        <h3 className="text-2xl font-bold mt-2">{title} Collection</h3>
        <p className="text-white/80 text-sm">{desc}</p>
      </div>
      <div className="absolute right-[-10%] bottom-[-10%] text-9xl font-black opacity-10 group-hover:rotate-12 transition-transform">
        {label}
      </div>
    </Link>
  );
}

function EmptyState() {
  return (
    <div className="text-center py-20 bg-gray-50 rounded-3xl border-2 border-dashed">
      <ShoppingCart className="w-16 h-16 text-gray-300 mx-auto mb-4" />
      <h3 className="text-xl font-bold text-gray-900">Naye products jald aa rahe hain!</h3>
      <p className="text-gray-500">Humari team stock update kar rahi hai.</p>
    </div>
  );
}
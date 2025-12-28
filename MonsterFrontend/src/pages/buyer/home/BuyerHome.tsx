import { useState, useEffect } from 'react';
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

export default function BuyerHome() {
  const [featuredProducts, setFeaturedProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState<string | null>(null);
  const { toast } = useToast();
  const { upsertItem } = useCart();

  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      setLoading(true);
      const products = await WebsiteProductService.getFeaturedProducts(8);
      setFeaturedProducts(products);
    } catch (error) {
      console.error('Error fetching featured products:', error);
      toast({
        title: "Error",
        description: "Failed to load featured products. Please try again.",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (product: WebsiteProduct) => {
    try {
      setAddingToCart(product.id);
      
      // Validate product data
      if (!product.id || !product.name || !product.base_price) {
        throw new Error('Invalid product data');
      }

      // Get the first available image or use a placeholder
      const productImage = product.images && product.images.length > 0 
        ? product.images[0] 
        : '/placeholder-image.jpg';

      // Create cart item with default size (assuming first available size)
      const availableSizes = product.available_sizes || [];
      if (availableSizes.length === 0) {
        throw new Error('No sizes available for this product');
      }

      const defaultSize = availableSizes[0];
      const cartItem: CartItem = {
        id: parseInt(product.id, 10),
        name: product.name,
        image: productImage,
        quantity: 1,
        price: product.base_price,
        sizeBreakup: {
          [defaultSize]: {
            qty: 1,
            price: product.base_price
          }
        }
      };

      upsertItem(cartItem);
      
      toast({
        title: "Success",
        description: `${product.name} added to cart successfully!`,
        variant: "default"
      });
    } catch (error) {
      console.error('Error adding to cart:', error);
      toast({
        title: "Error",
        description: "Failed to add item to cart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setAddingToCart(null);
    }
  };

  const formatPrice = (price: number | undefined | null) => {
    if (price === null || price === undefined || isNaN(price)) {
      return 'Price not available';
    }
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="responsive-container py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <BackButton to="/" className="mb-4" />
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">Welcome to MonsterMen90</h1>
            <p className="text-gray-600 mt-2 text-sm md:text-base">Discover premium clothing for modern men and women</p>
          </div>
          <Link
            to="/buyer/orders"
            className="mobile-touch-target px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition w-full md:w-auto text-center"
          >
            My Orders
          </Link>
        </div>
      </div>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Featured Products</h2>
            <Link
              to="/buyer/all-products"
              className="text-blue-600 hover:text-blue-700 font-medium"
            >
              View All →
            </Link>
          </div>
          
          <div className="responsive-grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
            {featuredProducts.map((product) => (
              <Card key={product.id} className="mobile-card group hover:shadow-lg transition-shadow duration-300 gpu-accelerated">
                <CardContent className="p-0">
                  <div className="relative">
                    {product.images && product.images.length > 0 ? (
                      <img
                        src={product.images[0]}
                        alt={product.name || 'Product image'}
                        className="responsive-image lazy w-full h-40 md:h-48 object-cover rounded-t-lg"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="w-full h-40 md:h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                        <span className="text-gray-400">No Image</span>
                      </div>
                    )}
                    
                    {product.is_featured && (
                      <Badge className="absolute top-2 left-2 bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    
                    <div className="absolute top-2 right-2">
                      <Badge variant="outline" className="bg-white">
                        {product.gender || 'Unisex'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                      {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                      {product.short_description || 'No description available'}
                    </p>
                    
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-lg font-bold text-gray-900">
                        {formatPrice(product.base_price)}
                      </div>
                      {product.brand && (
                        <span className="text-xs text-gray-500">{product.brand}</span>
                      )}
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-1">
                        {(product.available_sizes || []).slice(0, 3).map((size) => (
                          <span
                            key={size}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                          >
                            {size}
                          </span>
                        ))}
                        {(product.available_sizes || []).length > 3 && (
                          <span className="text-xs text-gray-400">+{(product.available_sizes || []).length - 3}</span>
                        )}
                        {(product.available_sizes || []).length === 0 && (
                          <span className="text-xs text-gray-400">No sizes available</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="mt-4 flex space-x-2">
                      <Link to={`/buyer/product/${product.id}`} className="flex-1">
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full"
                          aria-label={`View details for ${product.name}`}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                      </Link>
                      <Button
                        size="sm"
                        className="flex-1"
                        onClick={() => addToCart(product)}
                        disabled={addingToCart === product.id}
                        aria-label={`Add ${product.name} to cart`}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        {addingToCart === product.id ? 'Adding...' : 'Add to Cart'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      )}

      {/* Shop by Category */}
      <section>
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-8">
          <Link
            to="/buyer/men"
            className="mobile-touch-target group border rounded-xl p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200 gpu-accelerated"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <span className="text-lg md:text-2xl text-white font-bold">M</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
              Men Collection
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Shirts, Jeans, T-Shirts, Jackets & more premium clothing for men
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                Shop Now
              </Badge>
            </div>
          </Link>

          <Link
            to="/buyer/women"
            className="mobile-touch-target group border rounded-xl p-6 md:p-8 text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200 gpu-accelerated"
          >
            <div className="w-12 h-12 md:w-16 md:h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <span className="text-lg md:text-2xl text-white font-bold">W</span>
            </div>
            <h3 className="text-lg md:text-xl font-semibold mb-2 text-gray-900">
              Women Collection
            </h3>
            <p className="text-sm md:text-base text-gray-600">
              Tops, Dresses, Ethnic wear, Bottoms & more for women
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-pink-200 text-pink-800">
                Shop Now
              </Badge>
            </div>
          </Link>
        </div>
      </section>

      {/* Empty State */}
      {featuredProducts.length === 0 && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products available yet</h3>
          <p className="text-gray-600 mb-4">
            Our admin team is adding new products. Check back soon!
          </p>
          <Link to="/admin/login">
            <Button variant="outline">
              Admin Login
            </Button>
          </Link>
        </div>
      )}
    </div>
  );
}
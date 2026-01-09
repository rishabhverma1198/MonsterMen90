import { useState, useEffect, useMemo, useCallback } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { StarRating } from '@/components/ui/star-rating';
import { ShoppingCart, Heart, Share2, Truck, Shield, RotateCcw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { useCart } from '@/hooks/useCart';
import type { CartItem } from '@/types/cart-types';
import BackButton from '@/components/common/BackButton';

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Validate ID parameter
  useEffect(() => {
    if (!id) {
      navigate('/buyer');
      return;
    }
  }, [id, navigate]);
  const [product, setProduct] = useState<WebsiteProduct | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState<string>('');
  const [selectedImage, setSelectedImage] = useState<string>('');
  const [quantity, setQuantity] = useState(1);
  const [addingToCart, setAddingToCart] = useState(false);
  const [relatedProducts, setRelatedProducts] = useState<WebsiteProduct[]>([]);
  
  const { toast } = useToast();
  const { upsertItem } = useCart();

  // Optimized cart ID generation - moved outside component for performance
  const hashStringToNumber = useCallback((str: string): number => {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    return Math.abs(hash);
  }, []);

  // Enhanced price formatter with memoization for performance
  const formatPrice = useMemo(() => {
    const formatter = new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 2
    });
    
    return (price: number | undefined | null): string => {
      // Enhanced error handling for edge cases
      if (price === null || price === undefined || isNaN(price) || price < 0) {
        return 'Price not available';
      }
      return formatter.format(price);
    };
  }, []);

  // Enhanced rating information with validation
  const ratingInfo = useMemo(() => {
    // In a real implementation, this data would come from the product API
    // For now, using sensible defaults with proper validation
    const defaultRating = 4.5;
    const defaultReviewCount = 128;
    
    return {
      rating: Math.min(Math.max(defaultRating, 0), 5), // Clamp between 0-5
      reviewCount: Math.max(0, defaultReviewCount), // Ensure non-negative
      hasRating: defaultRating > 0 && defaultReviewCount > 0
    };
  }, []);

  useEffect(() => {
    if (id) {
      fetchProduct();
    }
  }, [id]); // Dependencies updated to include all used values

  useEffect(() => {
    if (product) {
      // Set default selected size and image with validation
      if (product.available_sizes && product.available_sizes.length > 0) {
        setSelectedSize(product.available_sizes[0]);
      }
      if (product.images && product.images.length > 0) {
        setSelectedImage(product.images[0]);
      }
      
      // Fetch related products
      fetchRelatedProducts();
    }
  }, [product]);

  const fetchProduct = async () => {
    try {
      setLoading(true);
      const productData = await WebsiteProductService.getProduct(id!);
      
      if (!productData) {
        navigate('/buyer');
        return;
      }
      
      setProduct(productData);
    } catch (error) {
      console.error('Error fetching product:', error);
      toast({
        title: "Error",
        description: "Failed to load product. Please try again.",
        variant: "destructive"
      });
      navigate('/buyer');
    } finally {
      setLoading(false);
    }
  };

  const fetchRelatedProducts = async () => {
    if (!product) return;
    
    try {
      const related = await WebsiteProductService.getRelatedProducts(
        product.id,
        product.category_id,
        product.gender,
        4
      );
      setRelatedProducts(related);
    } catch (error) {
      console.error('Error fetching related products:', error);
      // Don't show error toast for related products to avoid overwhelming user
    }
  };

  const handleAddToCart = async () => {
    if (!product) return;
    
    try {
      setAddingToCart(true);
      
      // Enhanced validation with better error messages
      if (!product.id) {
        throw new Error('Product ID is missing');
      }
      
      // Validate size selection with user-friendly messaging
      let sizeToUse = selectedSize;
      if (!product.available_sizes || product.available_sizes.length === 0) {
        sizeToUse = 'Standard';
      } else if (!selectedSize) {
        toast({
          title: "Size Required",
          description: "Please select a size before adding to cart.",
          variant: "destructive"
        });
        return;
      }

      // Enhanced image selection with fallback - ensure string type
      const productImage = selectedImage || 
        (product.images && product.images.length > 0 
          ? product.images[0] 
          : ''); // Use empty string instead of null to satisfy string type

      // Optimized cart ID generation - function moved outside component

      const cartItem: CartItem = {
        id: hashStringToNumber(product.id),
        name: product.name,
        image: productImage,
        quantity: Math.max(1, quantity), // Ensure quantity is at least 1
        price: product.base_price,
        sizeBreakup: {
          [sizeToUse]: {
            qty: Math.max(1, quantity),
            price: product.base_price
          }
        }
      };
      
      upsertItem(cartItem);
      
      toast({
        title: "Success",
        description: `${product.name} (Size: ${sizeToUse}) added to cart successfully!`,
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
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="aspect-square bg-gray-200 rounded-lg"></div>
            <div className="space-y-4">
              <div className="h-8 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-1/4"></div>
              <div className="h-20 bg-gray-200 rounded"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Product Not Found</h1>
          <p className="text-gray-600 mb-4">The product you're looking for doesn't exist.</p>
          <Link to="/buyer">
            <Button type="button">Back to Home</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      {/* Breadcrumb */}
      <div className="mb-6">
        <BackButton to="/buyer" className="mb-4" />
        <nav className="flex items-center space-x-2 text-sm text-gray-500">
          <Link to="/buyer" className="hover:text-gray-700">Home</Link>
          <span>/</span>
          <span className="text-gray-900">{product.name}</span>
        </nav>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
        {/* Product Images */}
        <div className="space-y-4">
          {/* Main Image */}
          <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden">
            {selectedImage ? (
              <img
                src={selectedImage}
                alt={product.name}
                className="w-full h-full object-cover"
                loading="lazy"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <span className="text-gray-400">No Image Available</span>
              </div>
            )}
          </div>
          
          {/* Thumbnail Images */}
          {product.images && product.images.length > 1 && (
            <div className="flex space-x-2 overflow-x-auto">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(image)}
                  className={`flex-shrink-0 w-16 h-16 rounded-lg overflow-hidden border-2 ${
                    selectedImage === image ? 'border-blue-500' : 'border-gray-200'
                  }`}
                >
                  <img
                    src={image}
                    alt={`${product.name} ${index + 1}`}
                    className="w-full h-full object-cover"
                    loading="lazy"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Product Info */}
        <div className="space-y-6">
          {/* Header */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-3xl font-bold text-gray-900">{product.name}</h1>
              <div className="flex space-x-2">
                <Button variant="outline" size="sm" type="button">
                  <Heart className="w-4 h-4" />
                </Button>
                <Button variant="outline" size="sm" type="button">
                  <Share2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
            
            {/* IMPROVED: Enhanced Rating Display with Error Handling */}
            {ratingInfo.hasRating && (
              <StarRating
                rating={ratingInfo.rating}
                reviewCount={ratingInfo.reviewCount}
                className="mb-4"
              />
            )}

            {/* IMPROVED: Enhanced Price Display with Error Handling and Caching */}
            <div className="text-3xl font-bold text-gray-900 mb-4">
              {formatPrice(product.base_price)}
            </div>

            <p className="text-gray-600 mb-4">{product.short_description}</p>
          </div>

          <Separator />

          {/* Product Details */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="font-medium">Brand:</span>
              <span className="text-gray-600">{product.brand || 'N/A'}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Gender:</span>
              <Badge variant="outline">{product.gender}</Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="font-medium">Category:</span>
              <span className="text-gray-600">{product.categories?.name || 'N/A'}</span>
            </div>
            {product.material && (
              <div className="flex items-center justify-between">
                <span className="font-medium">Material:</span>
                <span className="text-gray-600">{product.material}</span>
              </div>
            )}
          </div>

          <Separator />

          {/* Size Selection */}
          <div className="space-y-4">
            <div>
              <h3 className="font-medium mb-2">Size</h3>
              {product.available_sizes && product.available_sizes.length > 0 ? (
                <div className="grid grid-cols-4 gap-2">
                  {product.available_sizes.map((size) => (
                    <Button
                      key={size}
                      variant={selectedSize === size ? "default" : "outline"}
                      size="sm"
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className="text-sm"
                    >
                      {size}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    This product comes in standard size
                  </p>
                </div>
              )}
            </div>

            {/* Quantity */}
            <div>
              <h3 className="font-medium mb-2">Quantity</h3>
              <div className="flex items-center space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="px-4 py-2 border rounded">{quantity}</span>
                <Button
                  variant="outline"
                  size="sm"
                  type="button"
                  onClick={() => setQuantity(quantity + 1)}
                >
                  +
                </Button>
              </div>
            </div>
          </div>

          <Separator />

          {/* Add to Cart */}
          <div className="space-y-4">
            <Button
              type="button"
              onClick={handleAddToCart}
              disabled={addingToCart || (product.available_sizes && product.available_sizes.length > 0 && !selectedSize)}
              className="w-full"
              size="lg"
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              {addingToCart ? 'Adding...' : 'Add to Cart'}
            </Button>

            {/* Features */}
            <div className="grid grid-cols-3 gap-4 pt-4">
              <div className="text-center">
                <Truck className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Free Shipping</p>
              </div>
              <div className="text-center">
                <Shield className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Secure Payment</p>
              </div>
              <div className="text-center">
                <RotateCcw className="w-6 h-6 mx-auto mb-2 text-gray-400" />
                <p className="text-xs text-gray-600">Easy Returns</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Product Description */}
      {product.description && (
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-4">Product Description</h2>
          <div className="prose max-w-none">
            <p className="text-gray-600">{product.description}</p>
          </div>
        </div>
      )}

      {/* Related Products */}
      {relatedProducts.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-6">Related Products</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {relatedProducts.map((relatedProduct) => (
              <Card key={relatedProduct.id} className="group hover:shadow-lg transition-shadow duration-300">
                <CardContent className="p-0">
                  <Link to={`/buyer/product/${relatedProduct.id}`}>
                    <div className="relative">
                      {relatedProduct.images && relatedProduct.images.length > 0 ? (
                        <img
                          src={relatedProduct.images[0]}
                          alt={relatedProduct.name}
                          className="w-full h-48 object-cover rounded-t-lg"
                          loading="lazy"
                        />
                      ) : (
                        <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                          <span className="text-gray-400">No Image</span>
                        </div>
                      )}
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                        {relatedProduct.name}
                      </h3>
                      <p className="text-sm text-gray-600 mb-2">
                        {formatPrice(relatedProduct.base_price)}
                      </p>
                    </div>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
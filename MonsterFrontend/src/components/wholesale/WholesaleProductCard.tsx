import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LazyImage } from '@/components/ui/lazy-image';
import { Eye, Package, Star, ShoppingCart } from 'lucide-react';
import { calculateWholesalePrice, calculateSavingsPerUnit, formatWholesalePrice } from '@/lib/wholesale-constants';
import type { WholesaleProductCardProps } from '@/types/wholesale-types';

/**
 * Wholesale-specific product card component
 * Optimized for bulk purchasing with pricing display
 */
export function WholesaleProductCard({
  product,
  onView,
  onAddToCart,
  className = ''
}: WholesaleProductCardProps) {
  const wholesalePrice = calculateWholesalePrice(product.base_price || 0);
  const savingsPerUnit = calculateSavingsPerUnit(product.base_price || 0);

  const handleViewProduct = () => {
    onView(product);
  };

  const handleAddToCart = () => {
    onAddToCart(product);
  };

  return (
    <Card className={`group bg-white dark:bg-gray-800 hover:shadow-2xl hover:-translate-y-1 transition-all duration-300 border border-gray-200 dark:border-gray-700 rounded-2xl overflow-hidden ${className}`}>
      <CardContent className="p-0">
        {/* Product Image */}
        <div className="relative overflow-hidden">
          {product.images && product.images.length > 0 ? (
            <LazyImage
              src={product.images[0]}
              alt={product.name}
              className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
              wrapperClassName="relative overflow-hidden"
            />
          ) : (
            <div className="w-full h-48 sm:h-56 bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 flex items-center justify-center">
              <div className="text-center">
                <Package className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                <span className="text-gray-500 text-sm">No Image</span>
              </div>
            </div>
          )}

          {/* Badges */}
          <div className="absolute top-3 left-3 flex flex-col gap-2">
            {product.is_featured && (
              <Badge className="bg-gradient-to-r from-amber-400 to-orange-500 text-white shadow-lg backdrop-blur-sm">
                <Star className="w-3 h-3 mr-1" />
                Featured
              </Badge>
            )}
            <Badge className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg backdrop-blur-sm">
              <Package className="w-3 h-3 mr-1" />
              Wholesale
            </Badge>
          </div>

          <div className="absolute top-3 right-3">
            <Badge variant="outline" className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm capitalize border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
              {product.gender}
            </Badge>
          </div>

          {/* Hover Overlay */}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-300" />
        </div>

        {/* Product Info */}
        <div className="p-5">
          {/* Title & Description */}
          <div className="mb-4">
            <h3 className="font-bold text-gray-900 dark:text-white text-lg mb-2 line-clamp-1 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
              {product.name}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
              {product.short_description || product.description || 'No description available'}
            </p>
          </div>

          {/* Pricing */}
          <div className="space-y-3 mb-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-500 dark:text-gray-400">Retail Price</span>
              <span className="text-lg font-bold text-gray-900 dark:text-white line-through">
                {formatWholesalePrice(product.base_price || 0)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-green-600 dark:text-green-400 font-semibold">Wholesale Price</span>
              <span className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatWholesalePrice(wholesalePrice)}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-500 dark:text-gray-400">Min. Order</span>
              <span className="font-semibold text-gray-700 dark:text-gray-300">20 pieces</span>
            </div>
          </div>

          {/* Size & Brand */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex flex-wrap gap-1">
              {(product.available_sizes || []).slice(0, 3).map((size) => (
                <span
                  key={size}
                  className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg font-medium"
                >
                  {size}
                </span>
              ))}
              {(product.available_sizes || []).length > 3 && (
                <span className="text-xs text-gray-400 dark:text-gray-500 font-medium">
                  +{(product.available_sizes || []).length - 3}
                </span>
              )}
            </div>
            {product.brand && (
              <span className="text-xs text-gray-500 dark:text-gray-400 font-semibold uppercase tracking-wide">
                {product.brand}
              </span>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-3 mb-4">
            <Button 
              variant="outline" 
              className="flex-1 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-all duration-200"
              onClick={handleViewProduct}
              aria-label={`View details for ${product.name}`}
            >
              <Eye className="w-4 h-4 mr-2" />
              View Details
            </Button>
            <Button 
              className="flex-1 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
              onClick={handleAddToCart}
              aria-label={`Add ${product.name} to wholesale cart`}
            >
              <ShoppingCart className="w-4 h-4 mr-2" />
              Add to Cart
            </Button>
          </div>

          {/* Savings Badge */}
          <div className="text-center py-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-xl border border-green-200 dark:border-green-800">
            <span className="text-sm text-green-700 dark:text-green-400 font-bold">
              🎉 Save {formatWholesalePrice(savingsPerUnit)} per piece
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
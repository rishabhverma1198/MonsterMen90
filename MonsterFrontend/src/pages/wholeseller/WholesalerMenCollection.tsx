import { useState, useEffect } from 'react';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Star, Eye, Search, Filter, Package } from 'lucide-react';
import BackButton from '@/components/common/BackButton';

const productTypes = [
  'Shirts',
  'T-Shirts', 
  'Pants',
  'Jeans',
  'Jackets',
  'Sweaters',
  'Hoodies',
  'Shorts',
  'Blazers',
  'Coats'
];

export default function WholesalerMenCollection() {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchMenProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await WebsiteProductService.getProductsByGender('men', 50);
      setProducts(result);
    } catch (error) {
      console.error('Error fetching men products:', error);
      setError('Failed to load products. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0
    }).format(price);
  };

  const calculateBulkPrice = (basePrice: number) => {
    // Apply 20% discount for wholesale orders
    return basePrice * 0.8;
  };

  // Filter and sort products
  useEffect(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by product type
    if (selectedType !== 'all') {
      filtered = filtered.filter(product => product.product_type === selectedType);
    }

    // Sort products (create a new array to avoid mutation)
    switch (sortBy) {
      case 'price-low':
        filtered = [...filtered].sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price-high':
        filtered = [...filtered].sort((a, b) => b.base_price - a.base_price);
        break;
      case 'name':
        filtered = [...filtered].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered = [...filtered].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedType, sortBy]);

  useEffect(() => {
    fetchMenProducts();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/3 mb-6"></div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(9)].map((_, i) => (
              <div key={i} className="h-64 bg-gray-200 rounded-lg"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="mb-8">
          <BackButton to="/wholeseller" />
        </div>
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-red-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">Error Loading Products</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <Button onClick={fetchMenProducts}>
            Try Again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-8">
        <div className="mb-4">
          <BackButton to="/wholeseller" />
        </div>
        <h1 className="text-3xl font-bold text-gray-900">Men Collection - Wholesale</h1>
        <p className="text-gray-600 mt-2">
          Discover our premium collection of men's fashion for wholesale - {filteredProducts.length} products
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-6 mb-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Search</label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Product Type</label>
            <Select value={selectedType} onValueChange={setSelectedType}>
              <SelectTrigger>
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                {productTypes.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Sort By</label>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="newest">Newest First</SelectItem>
                <SelectItem value="price-low">Price: Low to High</SelectItem>
                <SelectItem value="price-high">Price: High to Low</SelectItem>
                <SelectItem value="name">Name: A to Z</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex items-end">
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
                setSortBy('newest');
              }}
              className="w-full"
            >
              <Filter className="w-4 h-4 mr-2" />
              Clear Filters
            </Button>
          </div>
        </div>
      </div>

      {/* Products Grid */}
      {filteredProducts.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="group hover:shadow-lg transition-shadow duration-300 border-2 border-blue-100">
              <CardContent className="p-0">
                <div className="relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="w-full h-48 object-cover rounded-t-lg"
                    />
                  ) : (
                    <div className="w-full h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
                      <span className="text-gray-400">No Image</span>
                    </div>
                  )}
                  
                  <div className="absolute top-2 left-2 flex gap-2">
                    {product.is_featured && (
                      <Badge className="bg-yellow-500 text-white">
                        <Star className="w-3 h-3 mr-1" />
                        Featured
                      </Badge>
                    )}
                    <Badge className="bg-blue-500 text-white">
                      <Package className="w-3 h-3 mr-1" />
                      Wholesale
                    </Badge>
                  </div>
                  
                  <div className="absolute top-2 right-2">
                    <Badge variant="outline" className="bg-white capitalize">
                      {product.product_type}
                    </Badge>
                  </div>
                </div>
                
                <div className="p-4">
                  <h3 className="font-semibold text-gray-900 mb-1 line-clamp-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-gray-600 mb-2 line-clamp-2">
                    {product.short_description}
                  </p>
                  
                  <div className="space-y-2 mb-4">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-500">Retail Price:</span>
                      <span className="text-lg font-bold text-gray-900">
                        {formatPrice(product.base_price)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-600 font-medium">Wholesale Price (20% off):</span>
                      <span className="text-xl font-bold text-blue-600">
                        {formatPrice(calculateBulkPrice(product.base_price))}
                      </span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-500">Min. Order:</span>
                      <span className="text-sm font-medium text-gray-700">20 pieces</span>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex space-x-1">
                      {product.available_sizes.slice(0, 3).map((size) => (
                        <span
                          key={size}
                          className="text-xs px-2 py-1 bg-gray-100 text-gray-600 rounded"
                        >
                          {size}
                        </span>
                      ))}
                      {product.available_sizes.length > 3 && (
                        <span className="text-xs text-gray-400">+{product.available_sizes.length - 3}</span>
                      )}
                    </div>
                    {product.brand && (
                      <span className="text-xs text-gray-500">{product.brand}</span>
                    )}
                  </div>
                  
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="w-4 h-4 mr-1" />
                      View Details
                    </Button>
                    <Button size="sm" className="flex-1 bg-blue-600 hover:bg-blue-700">
                      <ShoppingCart className="w-4 h-4 mr-1" />
                      Add to Bulk Cart
                    </Button>
                  </div>
                  
                  <div className="mt-2 text-center">
                    <span className="text-xs text-blue-600 font-medium">
                      Bulk savings: {formatPrice(product.base_price - calculateBulkPrice(product.base_price))} per piece
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <ShoppingCart className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products found</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedType !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'No men\'s wholesale products available at the moment'
            }
          </p>
          {(searchTerm || selectedType !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedType('all');
              }}
            >
              Clear Filters
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
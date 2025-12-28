import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { ShoppingCart, Star, Eye, Search, Filter, Package } from 'lucide-react';
import BackButton from '@/components/common/BackButton';

export default function WholesellerHome() {
  const [products, setProducts] = useState<WebsiteProduct[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<WebsiteProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('newest');

  const fetchAllProducts = useCallback(async () => {
    try {
      setLoading(true);
      // Fetch all products for wholeseller without gender filtering
      const result = await WebsiteProductService.getProducts(undefined, 100, 0);
      
      setProducts(result.products);
    } catch (error) {
      console.error('Error fetching products for wholeseller:', error);
      // Set empty array on error to prevent undefined issues
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const filterAndSortProducts = useCallback(() => {
    let filtered = [...products];

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.brand?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Filter by gender (client-side since we fetch all products)
    if (selectedGender !== 'all') {
      filtered = filtered.filter(product => {
        // If gender property exists, use it; otherwise show all products
        return !product.gender || product.gender === selectedGender;
      });
    }

    // Sort products
    switch (sortBy) {
      case 'price-low':
        filtered.sort((a, b) => a.base_price - b.base_price);
        break;
      case 'price-high':
        filtered.sort((a, b) => b.base_price - a.base_price);
        break;
      case 'name':
        filtered.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case 'newest':
      default:
        filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
        break;
    }

    setFilteredProducts(filtered);
  }, [products, searchTerm, selectedGender, sortBy]);

  useEffect(() => {
    fetchAllProducts();
  }, [fetchAllProducts]);

  useEffect(() => {
    filterAndSortProducts();
  }, [filterAndSortProducts]);

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

  return (
    <div className="responsive-container py-8 md:py-12">
      <div className="mb-6 md:mb-8">
        <BackButton to="/" className="mb-4" />
        <h1 className="text-2xl md:text-3xl lg:text-4xl font-bold text-gray-900">
          Wholeseller Dashboard
        </h1>
        <p className="text-gray-600 mt-2 text-sm md:text-base">
          Bulk purchase – minimum order 20 pieces per product • {filteredProducts.length} products available
        </p>
      </div>

      {/* Shop by Category */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold mb-6 text-gray-900">
          Shop by Category
        </h2>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
          <Link
            to="/wholeseller/men"
            className="group border rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-blue-50 to-blue-100 hover:from-blue-100 hover:to-blue-200"
          >
            <div className="w-16 h-16 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-white font-bold">M</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Men Collection
            </h3>
            <p className="text-gray-600">
              Shirts, Jeans, T-Shirts, Jackets & more premium clothing for men
            </p>
            <div className="mt-4">
              <Badge variant="secondary" className="bg-blue-200 text-blue-800">
                Shop Now
              </Badge>
            </div>
          </Link>

          <Link
            to="/wholeseller/women"
            className="group border rounded-xl p-8 text-center hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-pink-50 to-pink-100 hover:from-pink-100 hover:to-pink-200"
          >
            <div className="w-16 h-16 bg-pink-500 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
              <span className="text-2xl text-white font-bold">W</span>
            </div>
            <h3 className="text-xl font-semibold mb-2 text-gray-900">
              Women Collection
            </h3>
            <p className="text-gray-600">
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

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm border p-4 md:p-6 mb-6 md:mb-8">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
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
            <label className="text-sm font-medium text-gray-700">Gender</label>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger>
                <SelectValue placeholder="All Genders" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
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
                setSelectedGender('all');
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
        <div className="responsive-grid sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {filteredProducts.map((product) => (
            <Card key={product.id} className="mobile-card group hover:shadow-lg transition-shadow duration-300 border-2 border-blue-100 gpu-accelerated">
              <CardContent className="p-0">
                <div className="relative">
                  {product.images && product.images.length > 0 ? (
                    <img
                      src={product.images[0]}
                      alt={product.name}
                      className="responsive-image lazy w-full h-40 md:h-48 object-cover rounded-t-lg"
                      loading="lazy"
                      decoding="async"
                    />
                  ) : (
                    <div className="w-full h-40 md:h-48 bg-gray-200 rounded-t-lg flex items-center justify-center">
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
                    {product.gender && (
                      <Badge variant="outline" className="bg-white capitalize">
                        {product.gender}
                      </Badge>
                    )}
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
            <Package className="w-12 h-12 text-gray-400" />
          </div>
          <h3 className="text-xl font-medium text-gray-900 mb-2">No products available</h3>
          <p className="text-gray-600 mb-4">
            {searchTerm || selectedGender !== 'all' 
              ? 'Try adjusting your search or filter criteria' 
              : 'No wholesale products available at the moment'
            }
          </p>
          {(searchTerm || selectedGender !== 'all') && (
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setSelectedGender('all');
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
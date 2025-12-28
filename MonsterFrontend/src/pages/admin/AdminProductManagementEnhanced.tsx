import { useState, useEffect, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  TrendingUp,
  DollarSign,
  Eye,
  EyeOff,
  Video,
  Image as ImageIcon,
  Settings
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';
import { productService, categoryService } from '@/lib/services/admin.service';
import { AuthorizationError, ForbiddenError } from '@/lib/services/authorization.service';
import EnhancedProductForm from '@/components/admin/EnhancedProductForm';
import SizeSelection from '@/components/admin/SizeSelection';
import type { MediaFile } from '@/lib/services/media-compression.service';

interface Product {
  id: string;
  name: string;
  description: string;
  short_description?: string;
  category_id: string;
  gender: 'men' | 'women' | 'unisex';
  product_type: string;
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  images: string[];
  videos?: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  sku?: string;
  available_sizes: string[];
  is_active: boolean;
  is_featured: boolean;
  created_at: string;
  updated_at: string;
  categories?: {
    name: string;
    parent_id?: string;
  };
  product_variants?: Array<{
    id: string;
    size: string;
    color?: string;
    stock_quantity: number;
    available_quantity: number;
    price: number;
  }>;
}

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  gender: 'men' | 'women' | 'unisex';
  productType: string;
  basePrice: number;
  wholesalePrice: number;
  costPrice: number;
  brand: string;
  material: string;
  careInstructions: string;
  sku: string;
  availableSizes: string[];
  isActive: boolean;
  isFeatured: boolean;
  media: MediaFile[];
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  colors: string[];
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  slug: string;
}

export default function AdminProductManagementEnhanced() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedGender, setSelectedGender] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await productService.getProducts({
        active: selectedStatus === 'all' ? undefined : selectedStatus === 'active'
      });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to view products.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to fetch products",
          variant: "destructive"
        });
      }
    } finally {
      setLoading(false);
    }
  }, [selectedStatus]);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts]);

  const fetchCategories = async () => {
    try {
      const { data, error } = await categoryService.getCategories();
      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleSubmit = async (formData: ProductFormData): Promise<void> => {
    try {
      setSubmitting(true);

      const productData = {
        name: formData.name,
        description: formData.description,
        short_description: formData.shortDescription,
        category_id: formData.categoryId,
        gender: formData.gender,
        product_type: formData.productType,
        base_price: formData.basePrice,
        wholesale_price: formData.wholesalePrice,
        cost_price: formData.costPrice,
        available_sizes: formData.availableSizes,
        brand: formData.brand,
        material: formData.material,
        care_instructions: formData.careInstructions,
        sku: formData.sku,
        is_active: formData.isActive,
        is_featured: formData.isFeatured,
        images: formData.media.filter((m: MediaFile) => m.type === 'image').map((m: MediaFile) => m.url),
        videos: formData.media.filter((m: MediaFile) => m.type === 'video').map((m: MediaFile) => m.url),
        media_metadata: formData.media.map((m: MediaFile) => ({
          url: m.url,
          type: m.type,
          originalSize: m.originalSize,
          compressedSize: m.compressedSize,
          format: m.format
        }))
      };

      if (editingProduct) {
        // Update existing product
        const { error } = await productService.updateProduct(editingProduct.id, productData);
        
        if (error) throw error;

        toast({
          title: "Success",
          description: "Product updated successfully"
        });

        setIsEditDialogOpen(false);
        setEditingProduct(null);
      } else {
        // Create new product
        const { error } = await productService.createProduct(productData);
        
        if (error) throw error;

        toast({
          title: "Success",
          description: "Product created successfully"
        });

        setIsAddDialogOpen(false);
      }

      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to save products.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to save product",
          variant: "destructive"
        });
      }
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await productService.deleteProduct(productId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Product deleted successfully"
      });

      fetchProducts();
    } catch (error) {
      console.error('Error deleting product:', error);
      
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        toast({
          title: "Access Denied",
          description: "You don't have permission to delete products.",
          variant: "destructive"
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to delete product",
          variant: "destructive"
        });
      }
    }
  };

  const openEditDialog = (product: Product) => {
    setEditingProduct(product);
    setIsEditDialogOpen(true);
  };

  const resetDialog = () => {
    setIsAddDialogOpen(false);
    setIsEditDialogOpen(false);
    setEditingProduct(null);
  };

  const filteredProducts = products.filter(product => {
    const matchesSearch = product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         product.brand?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesCategory = selectedCategory === 'all' || product.category_id === selectedCategory;
    const matchesGender = selectedGender === 'all' || product.gender === selectedGender;
    const matchesStatus = selectedStatus === 'all' || 
                         (selectedStatus === 'active' && product.is_active) ||
                         (selectedStatus === 'inactive' && !product.is_active);
    
    return matchesSearch && matchesCategory && matchesGender && matchesStatus;
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading products...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Enhanced Product Management</h1>
          <p className="text-gray-600">Manage your complete product catalog with video support</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetDialog}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product with enhanced features including video support
              </DialogDescription>
            </DialogHeader>
            <EnhancedProductForm
              onSubmit={handleSubmit}
              onCancel={() => setIsAddDialogOpen(false)}
              isLoading={submitting}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Enhanced Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Products</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{products.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Products</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.is_active).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">With Videos</CardTitle>
            <Video className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {products.filter(p => p.videos && p.videos.length > 0).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Categories</CardTitle>
            <Filter className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Price</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ₹{Math.round(products.reduce((sum, p) => sum + p.base_price, 0) / products.length || 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Enhanced Features Alert */}
      <Alert>
        <Video className="h-4 w-4" />
        <AlertDescription>
          <strong>New Enhanced Features:</strong> Video upload support, automatic compression, enhanced descriptions, 
          and different size selection for buyers vs wholesalers (30 pieces fixed for wholesale).
        </AlertDescription>
      </Alert>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search products by name, description, or brand..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <select 
              value={selectedCategory} 
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="w-[200px] px-3 py-2 border border-gray-300 rounded-md"
              title="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option key={category.id} value={category.id}>
                  {category.name}
                </option>
              ))}
            </select>
            <select 
              value={selectedGender} 
              onChange={(e) => setSelectedGender(e.target.value)}
              className="w-[150px] px-3 py-2 border border-gray-300 rounded-md"
              title="Filter by gender"
            >
              <option value="all">All Genders</option>
              <option value="men">Men</option>
              <option value="women">Women</option>
              <option value="unisex">Unisex</option>
            </select>
            <select 
              value={selectedStatus} 
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="w-[150px] px-3 py-2 border border-gray-300 rounded-md"
              title="Filter by status"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Manage your product inventory with enhanced media support
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Media</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="flex items-center space-x-3">
                      {product.images && product.images.length > 0 ? (
                        <img
                          src={product.images[0]}
                          alt={product.name}
                          className="w-12 h-12 object-cover rounded-md"
                        />
                      ) : (
                        <div className="w-12 h-12 bg-gray-200 rounded-md flex items-center justify-center">
                          <ImageIcon className="h-6 w-6 text-gray-400" />
                        </div>
                      )}
                      <div>
                        <div className="font-medium">{product.name}</div>
                        <div className="text-sm text-gray-500 truncate max-w-xs">
                          {product.short_description || product.description}
                        </div>
                        <div className="text-xs text-gray-400">
                          SKU: {product.sku || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-1">
                      {product.images && product.images.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <ImageIcon className="w-3 h-3 mr-1" />
                          {product.images.length} img
                        </Badge>
                      )}
                      {product.videos && product.videos.length > 0 && (
                        <Badge variant="outline" className="text-xs">
                          <Video className="w-3 h-3 mr-1" />
                          {product.videos.length} vid
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {product.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.product_type}</TableCell>
                  <TableCell>
                    <div>
                      <div>₹{product.base_price}</div>
                      {product.wholesale_price && (
                        <div className="text-xs text-gray-500">
                          WS: ₹{product.wholesale_price}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center space-x-2">
                      {product.is_active ? (
                        <Badge variant="default">
                          <Eye className="h-3 w-3 mr-1" />
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="secondary">
                          <EyeOff className="h-3 w-3 mr-1" />
                          Inactive
                        </Badge>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    {product.is_featured && (
                      <Badge variant="outline" className="bg-yellow-50 text-yellow-800">
                        Featured
                      </Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openEditDialog(product)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(product.id)}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          
          {filteredProducts.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No products found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || selectedCategory !== 'all' || selectedGender !== 'all' || selectedStatus !== 'all'
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Get started by adding your first product'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit Product Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information with enhanced features
            </DialogDescription>
          </DialogHeader>
          {editingProduct && (
            <EnhancedProductForm
              initialData={{
                name: editingProduct.name,
                description: editingProduct.description,
                shortDescription: editingProduct.short_description || '',
                categoryId: editingProduct.category_id,
                gender: editingProduct.gender,
                productType: editingProduct.product_type,
                basePrice: editingProduct.base_price,
                wholesalePrice: editingProduct.wholesale_price || 0,
                costPrice: editingProduct.cost_price || 0,
                brand: editingProduct.brand || '',
                material: editingProduct.material || '',
                careInstructions: editingProduct.care_instructions || '',
                sku: editingProduct.sku || '',
                availableSizes: editingProduct.available_sizes || [],
                isActive: editingProduct.is_active,
                isFeatured: editingProduct.is_featured,
                media: [], // TODO: Load existing media
                seoTitle: '',
                seoDescription: '',
                tags: [],
                colors: [],
                weight: 0,
                dimensions: { length: 0, width: 0, height: 0 }
              }}
              onSubmit={handleSubmit}
              onCancel={() => setIsEditDialogOpen(false)}
              isLoading={submitting}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Size Selection Demo */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="w-5 h-5 mr-2" />
            Size Selection Demo
          </CardTitle>
          <CardDescription>
            Different size selection logic for buyers vs wholesalers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SizeSelection
            availableSizes={['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL']}
            selectedSizes={['S', 'M', 'L']}
            onSizeChange={(sizes) => console.log('Selected sizes:', sizes)}
            wholesalePrice={699}
            basePrice={899}
          />
        </CardContent>
      </Card>
    </div>
  );
}
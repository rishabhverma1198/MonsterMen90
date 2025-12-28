import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  Plus,
  Edit,
  Trash2,
  Search,
  Filter,
  Package,
  TrendingUp,
  DollarSign,
  Upload,
  X,
  Image as ImageIcon,
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import BackButton from '../../components/common/BackButton';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle, 
  DialogTrigger 
} from '@/components/ui/dialog';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';
import { productService, categoryService } from '@/lib/services/admin.service';
import { AuthorizationError, ForbiddenError } from '@/lib/services/authorization.service';
import { ImageUploadService } from '@/lib/services/image-upload.service';

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  short_description?: string;
  category_id: string;
  gender: 'men' | 'women' | 'unisex';
  product_type: string;
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  images: string[];
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
    price: number;
  }>;
}

interface Category {
  id: string;
  name: string;
  parent_id?: string;
  slug: string;
}

interface ProductFormData {
  name: string;
  description: string;
  short_description: string;
  category_id: string;
  gender: 'men' | 'women' | 'unisex';
  product_type: string;
  base_price: string;
  wholesale_price: string;
  cost_price: string;
  brand: string;
  material: string;
  care_instructions: string;
  sku: string;
  available_sizes: string[];
  is_active: boolean;
  is_featured: boolean;
}

const PRODUCT_TYPES = [
  'Shirts',
  'T-Shirts',
  'Pants',
  'Jeans',
  'Jackets',
  'Dresses',
  'Tops',
  'Bottoms',
  'Skirts',
  'Sweaters',
  'Hoodies',
  'Shorts',
  'Blazers',
  'Coats',
  'Accessories'
];

const AVAILABLE_SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

export default function AdminProductManagement() {
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
  const [uploadingImages, setUploadingImages] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    short_description: '',
    category_id: '',
    gender: 'unisex',
    product_type: '',
    base_price: '',
    wholesale_price: '',
    cost_price: '',
    brand: '',
    material: '',
    care_instructions: '',
    sku: '',
    available_sizes: ['S', 'M', 'L', 'XL'],
    is_active: true,
    is_featured: false
  });

  // Note: selectedFiles state is managed but not directly used in UI
  // Image previews are used for display, selectedFiles for upload logic
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);

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

  const fetchCategories = useCallback(async () => {
    try {
      const { data, error } = await categoryService.getCategories();

      if (error) throw error;
      setCategories(data || []);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  }, []);

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, [fetchProducts, fetchCategories]);

  // Cleanup image previews on unmount to prevent memory leaks
  useEffect(() => {
    return () => {
      // Clean up all image preview URLs when component unmounts
      imagePreviews.forEach(preview => {
        if (preview.startsWith('blob:')) {
          ImageUploadService.revokeImagePreview(preview);
        }
      });
    };
  }, [imagePreviews]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    const validFiles: File[] = [];

    files.forEach((file: File) => {
      const validation = ImageUploadService.validateImageFile(file);
      if (validation.valid) {
        validFiles.push(file);
      } else {
        toast({
          title: "Invalid File",
          description: `${file.name}: ${validation.error}`,
          variant: "destructive"
        });
      }
    });

    setSelectedFiles(prev => [...prev, ...validFiles]);

    // Create previews
    const previews = validFiles.map(file => ImageUploadService.createImagePreview(file));
    setImagePreviews(prev => [...prev, ...previews]);
  };

  const removeImage = (index: number) => {
    // Clean up preview URL
    if (imagePreviews[index]) {
      ImageUploadService.revokeImagePreview(imagePreviews[index]);
    }
    
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
    setImagePreviews(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name.trim()) {
      toast({
        title: "Validation Error",
        description: "Product name is required",
        variant: "destructive"
      });
      return;
    }

    if (!formData.category_id) {
      toast({
        title: "Validation Error", 
        description: "Please select a category",
        variant: "destructive"
      });
      return;
    }

    if (!formData.base_price || parseFloat(formData.base_price) <= 0) {
      toast({
        title: "Validation Error",
        description: "Please enter a valid base price",
        variant: "destructive"
      });
      return;
    }

    try {
      setUploadingImages(true);
      let imageUrls: string[] = [];

      // Upload images if any
      if (selectedFiles.length > 0) {
        imageUrls = await ImageUploadService.uploadImages(selectedFiles);
      }

      const productData = {
        name: formData.name.trim(),
        description: formData.description.trim(),
        short_description: formData.short_description.trim(),
        category_id: formData.category_id,
        gender: formData.gender,
        product_type: formData.product_type,
        base_price: parseFloat(formData.base_price),
        wholesale_price: formData.wholesale_price ? parseFloat(formData.wholesale_price) : undefined,
        cost_price: formData.cost_price ? parseFloat(formData.cost_price) : undefined,
        brand: formData.brand.trim(),
        material: formData.material.trim(),
        care_instructions: formData.care_instructions.trim(),
        sku: formData.sku.trim(),
        available_sizes: formData.available_sizes,
        images: imageUrls,
        is_active: formData.is_active,
        is_featured: formData.is_featured
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

      resetForm();
      fetchProducts();
    } catch (error) {
      console.error('Error saving product:', error);
      
      let errorMessage = "Failed to save product";
      
      if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
        errorMessage = "You don't have permission to save products.";
      } else if (error instanceof Error) {
        if (error.message.includes('Bucket not found') || error.message.includes('storage bucket')) {
          errorMessage = "Image storage is not configured. Please contact administrator to set up Supabase storage bucket.";
        } else if (error.message.includes('Upload failed')) {
          errorMessage = "Image upload failed. Please check your internet connection and try again.";
        } else {
          errorMessage = error.message;
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setUploadingImages(false);
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
    setFormData({
      name: product.name,
      description: product.description || '',
      short_description: product.short_description || '',
      category_id: product.category_id,
      gender: product.gender,
      product_type: product.product_type,
      base_price: product.base_price.toString(),
      wholesale_price: product.wholesale_price?.toString() || '',
      cost_price: product.cost_price?.toString() || '',
      brand: product.brand || '',
      material: product.material || '',
      care_instructions: product.care_instructions || '',
      sku: product.sku || '',
      available_sizes: product.available_sizes || ['S', 'M', 'L', 'XL'],
      is_active: product.is_active,
      is_featured: product.is_featured
    });

    // Set existing images as previews (if they exist)
    if (product.images && product.images.length > 0) {
      setImagePreviews(product.images);
      setSelectedFiles([]); // No new files selected
    } else {
      setImagePreviews([]);
      setSelectedFiles([]);
    }

    setIsEditDialogOpen(true);
  };

  const resetForm = () => {
    // Clean up existing image previews before resetting
    imagePreviews.forEach(preview => {
      if (preview.startsWith('blob:')) {
        ImageUploadService.revokeImagePreview(preview);
      }
    });
    
    setFormData({
      name: '',
      description: '',
      short_description: '',
      category_id: '',
      gender: 'unisex',
      product_type: '',
      base_price: '',
      wholesale_price: '',
      cost_price: '',
      brand: '',
      material: '',
      care_instructions: '',
      sku: '',
      available_sizes: ['S', 'M', 'L', 'XL'],
      is_active: true,
      is_featured: false
    });
    setSelectedFiles([]);
    setImagePreviews([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const toggleSize = (size: string) => {
    setFormData(prev => ({
      ...prev,
      available_sizes: prev.available_sizes.includes(size)
        ? prev.available_sizes.filter(s => s !== size)
        : [...prev.available_sizes, size]
    }));
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
      <div className="mb-6">
        <BackButton to="/admin" />
      </div>
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-gray-600">Manage your complete product catalog</p>
        </div>
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={resetForm}>
              <Plus className="mr-2 h-4 w-4" />
              Add Product
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Add New Product</DialogTitle>
              <DialogDescription>
                Create a new product in your catalog
              </DialogDescription>
            </DialogHeader>
            <ProductForm 
              formData={formData}
              setFormData={setFormData}
              categories={categories}
              imagePreviews={imagePreviews}
              onImageSelect={handleImageSelect}
              onRemoveImage={removeImage}
              fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
              onSubmit={handleSubmit}
              uploading={uploadingImages}
              onToggleSize={toggleSize}
              isEditing={false}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
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
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedGender} onValueChange={setSelectedGender}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by gender" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
            <Select value={selectedStatus} onValueChange={setSelectedStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Products Table */}
      <Card>
        <CardHeader>
          <CardTitle>Products ({filteredProducts.length})</CardTitle>
          <CardDescription>
            Manage your product inventory and details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Gender</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Price</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Featured</TableHead>
                <TableHead>Created</TableHead>
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
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className="capitalize">
                      {product.gender}
                    </Badge>
                  </TableCell>
                  <TableCell>{product.product_type}</TableCell>
                  <TableCell>{product.categories?.name || 'No Category'}</TableCell>
                  <TableCell>₹{product.base_price}</TableCell>
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
                  <TableCell>{new Date(product.created_at).toLocaleDateString()}</TableCell>
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
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Product</DialogTitle>
            <DialogDescription>
              Update product information
            </DialogDescription>
          </DialogHeader>
          <ProductForm 
            formData={formData}
            setFormData={setFormData}
            categories={categories}
            imagePreviews={imagePreviews}
            onImageSelect={handleImageSelect}
            onRemoveImage={removeImage}
            fileInputRef={fileInputRef as React.RefObject<HTMLInputElement>}
            onSubmit={handleSubmit}
            uploading={uploadingImages}
            onToggleSize={toggleSize}
            isEditing={true}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Product Form Component
interface ProductFormProps {
  formData: ProductFormData;
  setFormData: React.Dispatch<React.SetStateAction<ProductFormData>>;
  categories: Category[];
  imagePreviews: string[];
  onImageSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveImage: (index: number) => void;
  fileInputRef: React.RefObject<HTMLInputElement>;
  onSubmit: (e: React.FormEvent) => void;
  uploading: boolean;
  onToggleSize: (size: string) => void;
  isEditing: boolean;
}

function ProductForm({
  formData,
  setFormData,
  categories,
  imagePreviews,
  onImageSelect,
  onRemoveImage,
  fileInputRef,
  onSubmit,
  uploading,
  onToggleSize,
  isEditing
}: ProductFormProps) {
  return (
    <form onSubmit={onSubmit} className="space-y-6">
      {/* Basic Information */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="name">Product Name *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="Enter product name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sku">SKU</Label>
            <Input
              id="sku"
              value={formData.sku}
              onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
              placeholder="Auto-generated if empty"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="short_description">Short Description</Label>
          <Input
            id="short_description"
            value={formData.short_description}
            onChange={(e) => setFormData({ ...formData, short_description: e.target.value })}
            placeholder="Brief product summary"
            maxLength={500}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="description">Full Description</Label>
          <Textarea
            id="description"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={4}
            placeholder="Detailed product description"
          />
        </div>
      </div>

      {/* Category & Classification */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Classification</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={formData.category_id} onValueChange={(value) => setFormData({ ...formData, category_id: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    {category.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="gender">Gender</Label>
            <Select value={formData.gender} onValueChange={(value: 'men' | 'women' | 'unisex') => setFormData({ ...formData, gender: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="men">Men</SelectItem>
                <SelectItem value="women">Women</SelectItem>
                <SelectItem value="unisex">Unisex</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="product_type">Product Type</Label>
            <Select value={formData.product_type} onValueChange={(value) => setFormData({ ...formData, product_type: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Select type" />
              </SelectTrigger>
              <SelectContent>
                {PRODUCT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Pricing</h3>
        <div className="grid grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="base_price">Base Price (₹) *</Label>
            <Input
              id="base_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.base_price}
              onChange={(e) => setFormData({ ...formData, base_price: e.target.value })}
              required
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="wholesale_price">Wholesale Price (₹)</Label>
            <Input
              id="wholesale_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.wholesale_price}
              onChange={(e) => setFormData({ ...formData, wholesale_price: e.target.value })}
              placeholder="0.00"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="cost_price">Cost Price (₹)</Label>
            <Input
              id="cost_price"
              type="number"
              step="0.01"
              min="0"
              value={formData.cost_price}
              onChange={(e) => setFormData({ ...formData, cost_price: e.target.value })}
              placeholder="0.00"
            />
          </div>
        </div>
      </div>

      {/* Product Details */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="brand">Brand</Label>
            <Input
              id="brand"
              value={formData.brand}
              onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
              placeholder="Brand name"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="material">Material</Label>
            <Input
              id="material"
              value={formData.material}
              onChange={(e) => setFormData({ ...formData, material: e.target.value })}
              placeholder="Material composition"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="care_instructions">Care Instructions</Label>
          <Textarea
            id="care_instructions"
            value={formData.care_instructions}
            onChange={(e) => setFormData({ ...formData, care_instructions: e.target.value })}
            rows={2}
            placeholder="Washing and care instructions"
          />
        </div>

        <div className="space-y-2">
          <Label>Available Sizes</Label>
          <div className="flex flex-wrap gap-2">
            {AVAILABLE_SIZES.map((size) => (
              <Button
                key={size}
                type="button"
                variant={formData.available_sizes.includes(size) ? "default" : "outline"}
                size="sm"
                onClick={() => onToggleSize(size)}
                className="w-12 h-8"
              >
                {size}
              </Button>
            ))}
          </div>
        </div>
      </div>

      {/* Images */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Product Images</h3>
        <div className="space-y-4">
          <div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*"
              onChange={onImageSelect}
              className="hidden"
              title="Upload product images"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              className="w-full"
            >
              <Upload className="mr-2 h-4 w-4" />
              Upload Images
            </Button>
            <p className="text-sm text-gray-500 mt-1">
              Supports JPG, PNG, WebP (max 5MB each)
            </p>
          </div>

          {imagePreviews.length > 0 && (
            <div className="grid grid-cols-4 gap-4">
              {imagePreviews.map((preview, index) => (
                <div key={index} className="relative group">
                  <img
                    src={preview}
                    alt={`Preview ${index + 1}`}
                    className="w-full h-24 object-cover rounded-md border"
                  />
                  <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    className="absolute top-1 right-1 h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onRemoveImage(index)}
                  >
                    <X className="h-3 w-3" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Status Settings */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold">Status Settings</h3>
        <div className="flex items-center space-x-6">
          <div className="flex items-center space-x-2">
            <Switch
              id="is_active"
              checked={formData.is_active}
              onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
            />
            <Label htmlFor="is_active">Active (Visible on website)</Label>
          </div>
          <div className="flex items-center space-x-2">
            <Switch
              id="is_featured"
              checked={formData.is_featured}
              onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
            />
            <Label htmlFor="is_featured">Featured Product</Label>
          </div>
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-2 pt-4 border-t">
        <Button type="button" variant="outline" onClick={() => {
          // Reset form and close dialog
          if (fileInputRef.current) {
            fileInputRef.current.value = '';
          }
        }}>
          Cancel
        </Button>
        <Button type="submit" disabled={uploading}>
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {isEditing ? 'Updating...' : 'Creating...'}
            </>
          ) : (
            <>
              <Save className="mr-2 h-4 w-4" />
              {isEditing ? 'Update Product' : 'Create Product'}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
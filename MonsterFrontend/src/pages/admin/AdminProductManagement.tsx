import { useState, useEffect, useCallback, useMemo } from 'react';
import { Plus, Search, Package, TrendingUp, DollarSign, Loader2, Edit, Trash2, Eye } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import { productService, categoryService } from '@/lib/services/admin.service';
import EnhancedProductForm from '@/components/admin/EnhancedProductForm';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// --- Types & Constants ---
const GENDER_OPTIONS = ['men', 'women', 'unisex', 'kids'] as const;

// --- Main Component ---
export default function AdminProductManagement() {
  // State Management
  const [products, setProducts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filters State
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedGender, setSelectedGender] = useState('all');
  const [selectedStatus, setSelectedStatus] = useState('all');

  // Dialog & Form States
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<any | null>(null);
  const [viewingProduct, setViewingProduct] = useState<any | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);

  // --- Data Fetching ---
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.all([
        productService.getProducts(),
        categoryService.getCategories()
      ]);
      setProducts(prodRes.data || []);
      setCategories(catRes.data || []);
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to load products", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // --- Form Actions ---
  const handleCreateNew = () => {
    setEditingProduct(null);
    setIsDialogOpen(true);
  };

  const handleEdit = (product: any) => {
    setEditingProduct(product);
    setIsDialogOpen(true);
  };

  const handleView = (product: any) => {
    setViewingProduct(product);
    setIsViewDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!confirm('Are you sure you want to delete this product?')) return;
    
    try {
      const { error } = await productService.deleteProduct(productId);
      if (error) throw error;
      toast({ title: "Success", description: "Product deleted successfully!" });
      fetchData();
    } catch (err: any) {
      toast({ 
        title: "Error", 
        description: err.message || "Failed to delete product", 
        variant: "destructive" 
      });
    }
  };

  const handleFormClose = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
  };

  const handleFormSuccess = () => {
    setIsDialogOpen(false);
    setEditingProduct(null);
    fetchData();
  };

  // --- Filtering Logic ---
  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const searchStr = (p.name + p.description + p.brand + p.sku).toLowerCase();
      const matchesSearch = searchStr.includes(searchTerm.toLowerCase());
      const matchesCat = selectedCategory === 'all' || p.category_id === selectedCategory;
      const matchesGender = selectedGender === 'all' || p.gender === selectedGender;
      const matchesStatus = selectedStatus === 'all' || 
        (selectedStatus === 'active' && p.is_active) || 
        (selectedStatus === 'inactive' && !p.is_active);
      return matchesSearch && matchesCat && matchesGender && matchesStatus;
    });
  }, [products, searchTerm, selectedCategory, selectedGender, selectedStatus]);

  // --- Stats Calculation ---
  const stats = useMemo(() => ({
    total: products.length,
    active: products.filter(p => p.is_active).length,
    inactive: products.filter(p => !p.is_active).length,
    lowStock: products.filter(p => p.stock_quantity < 10).length,
    totalValue: products.reduce((sum, p) => sum + (p.base_price * (p.stock_quantity || 0)), 0)
  }), [products]);

  // --- Loading State ---
  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
        <span className="ml-2">Loading products...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold">Product Management</h1>
          <p className="text-muted-foreground">Manage your products, inventory, and pricing</p>
        </div>
        <Button onClick={handleCreateNew}>
          <Plus className="mr-2 h-4 w-4" /> Add Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-500" />
              <span className="text-sm text-muted-foreground">Total Products</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              <span className="text-sm text-muted-foreground">Active</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.active}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-gray-500" />
              <span className="text-sm text-muted-foreground">Inactive</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.inactive}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-orange-500" />
              <span className="text-sm text-muted-foreground">Low Stock</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.lowStock}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4">
            <div className="flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-purple-500" />
              <span className="text-sm text-muted-foreground">Total Value</span>
            </div>
            <p className="text-2xl font-bold mt-1">₹{stats.totalValue.toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search products by name, description, brand, or SKU..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              aria-label="Filter by category"
            >
              <option value="all">All Categories</option>
              {categories.map((cat: any) => (
                <option key={cat.id} value={cat.id}>{cat.name}</option>
              ))}
            </select>
            <select
              value={selectedGender}
              onChange={(e) => setSelectedGender(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              aria-label="Filter by gender"
            >
              <option value="all">All Genders</option>
              {GENDER_OPTIONS.map((g) => (
                <option key={g} value={g}>{g.charAt(0).toUpperCase() + g.slice(1)}</option>
              ))}
            </select>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value)}
              className="px-3 py-2 border rounded-md bg-background"
              aria-label="Filter by status"
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
            Showing {filteredProducts.length} of {products.length} products
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredProducts.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              No products found matching your filters
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b text-left">
                    <th className="pb-3 font-medium">Product</th>
                    <th className="pb-3 font-medium">SKU</th>
                    <th className="pb-3 font-medium">Category</th>
                    <th className="pb-3 font-medium">Price</th>
                    <th className="pb-3 font-medium">Stock</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredProducts.map((product: any) => (
                    <tr key={product.id} className="border-b hover:bg-muted/50">
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {product.images?.[0] ? (
                            <img 
                              src={product.images[0]} 
                              alt={product.name}
                              className="h-10 w-10 rounded object-cover"
                            />
                          ) : (
                            <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                              <Package className="h-5 w-5 text-muted-foreground" />
                            </div>
                          )}
                          <div>
                            <p className="font-medium">{product.name}</p>
                            <p className="text-sm text-muted-foreground">{product.brand || 'No brand'}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3">{product.sku || '-'}</td>
                      <td className="py-3">
                        {categories.find((c: any) => c.id === product.category_id)?.name || product.category_id || '-'}
                      </td>
                      <td className="py-3">₹{product.base_price?.toLocaleString()}</td>
                      <td className="py-3">
                        <span className={product.stock_quantity < 10 ? 'text-orange-500 font-medium' : ''}>
                          {product.stock_quantity || 0}
                        </span>
                      </td>
                      <td className="py-3">
                        <Badge variant={product.is_active ? 'default' : 'secondary'}>
                          {product.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleView(product)}
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleEdit(product)}
                            title="Edit"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => handleDelete(product.id)}
                            title="Delete"
                            className="text-red-500 hover:text-red-600"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Add/Edit Product Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={handleFormClose}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingProduct ? 'Edit Product' : 'Add New Product'}</DialogTitle>
          </DialogHeader>
          <EnhancedProductForm
            initialData={editingProduct || undefined}
            onSubmit={handleFormSuccess}
            onCancel={handleFormClose}
          />
        </DialogContent>
      </Dialog>

      {/* View Product Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{viewingProduct?.name}</DialogTitle>
          </DialogHeader>
          {viewingProduct && (
            <div className="space-y-4">
              {viewingProduct.images?.length > 0 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {viewingProduct.images.map((img: string, idx: number) => (
                    <img 
                      key={idx}
                      src={img} 
                      alt={`${viewingProduct.name} ${idx + 1}`}
                      className="h-32 w-32 rounded object-cover flex-shrink-0"
                    />
                  ))}
                </div>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">SKU</p>
                  <p className="font-medium">{viewingProduct.sku || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Brand</p>
                  <p className="font-medium">{viewingProduct.brand || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Base Price</p>
                  <p className="font-medium">₹{viewingProduct.base_price?.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Stock</p>
                  <p className="font-medium">{viewingProduct.stock_quantity || 0}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Category</p>
                  <p className="font-medium">
                    {categories.find((c: any) => c.id === viewingProduct.category_id)?.name || viewingProduct.category_id || '-'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Status</p>
                  <Badge variant={viewingProduct.is_active ? 'default' : 'secondary'}>
                    {viewingProduct.is_active ? 'Active' : 'Inactive'}
                  </Badge>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Description</p>
                <p className="font-medium">{viewingProduct.description || '-'}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Available Sizes</p>
                <div className="flex gap-2 mt-1">
                  {viewingProduct.available_sizes?.map((size: string) => (
                    <Badge key={size} variant="outline">{size}</Badge>
                  ))}
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Search, Filter, DollarSign, TrendingUp, Edit2 } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { productService } from '@/lib/services/admin.service';
import { toast } from '@/hooks/use-toast';

interface Product {
  id: string;
  name: string;
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  category_id: string;
}

export default function AdminPricingManagement() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [prices, setPrices] = useState({
    base_price: 0,
    wholesale_price: 0,
    cost_price: 0
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      setLoading(true);
      const { data, error } = await productService.getProducts();
      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error('Error fetching products:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch products',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (product: Product) => {
    setSelectedProduct(product);
    setPrices({
      base_price: product.base_price,
      wholesale_price: product.wholesale_price || 0,
      cost_price: product.cost_price || 0
    });
    setIsDialogOpen(true);
  };

  const handleSavePrices = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProduct) return;

    try {
      const { error } = await productService.updateProduct(selectedProduct.id, {
        base_price: prices.base_price,
        wholesale_price: prices.wholesale_price,
        cost_price: prices.cost_price
      });

      if (error) throw error;

      toast({
        title: 'Success',
        description: 'Prices updated successfully'
      });

      setIsDialogOpen(false);
      fetchProducts();
    } catch (error) {
      console.error('Error saving prices:', error);
      toast({
        title: 'Error',
        description: 'Failed to save prices',
        variant: 'destructive'
      });
    }
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const calculateMargin = (basePrice: number, costPrice: number) => {
    if (costPrice === 0 || basePrice === 0) return '0.00';
    return (((basePrice - costPrice) / costPrice) * 100).toFixed(2);
  };

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading products...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Price Management</h1>
            <p className="text-gray-600">Manage product pricing and margins</p>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Average Retail Price</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{products.length > 0 ? (products.reduce((sum, p) => sum + p.base_price, 0) / products.length).toFixed(0) : '0'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Product Value</CardTitle>
              <TrendingUp className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                ₹{products.reduce((sum, p) => sum + p.base_price, 0).toLocaleString()}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Products With Wholesale</CardTitle>
              <DollarSign className="w-4 h-4 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {products.filter(p => p.wholesale_price).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search products..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button variant="outline">
                <Filter className="w-4 h-4 mr-2" />
                Filter
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Products Table */}
        <Card>
          <CardHeader>
            <CardTitle>Products ({filteredProducts.length})</CardTitle>
            <CardDescription>Manage retail, wholesale, and cost prices</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Product Name</TableHead>
                    <TableHead>Cost Price</TableHead>
                    <TableHead>Retail Price</TableHead>
                    <TableHead>Wholesale Price</TableHead>
                    <TableHead>Margin %</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredProducts.map((product) => (
                    <TableRow key={product.id}>
                      <TableCell className="font-medium">{product.name}</TableCell>
                      <TableCell>
                        {product.cost_price ? `₹${product.cost_price}` : '-'}
                      </TableCell>
                      <TableCell className="font-semibold">₹{product.base_price}</TableCell>
                      <TableCell>
                        {product.wholesale_price ? `₹${product.wholesale_price}` : '-'}
                      </TableCell>
                      <TableCell>
                        {product.cost_price ? (
                          <span className="text-green-600 font-semibold">
                            {calculateMargin(product.base_price, product.cost_price)}%
                          </span>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleOpenDialog(product)}
                        >
                          <Edit2 className="w-4 h-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredProducts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No products found.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Update Prices</DialogTitle>
              <DialogDescription>
                Edit pricing for {selectedProduct?.name}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSavePrices} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="cost">Cost Price</Label>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">₹</span>
                  <Input
                    id="cost"
                    type="number"
                    value={prices.cost_price}
                    onChange={(e) => setPrices({ ...prices, cost_price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="retail">Retail Price (MRP)</Label>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">₹</span>
                  <Input
                    id="retail"
                    type="number"
                    value={prices.base_price}
                    onChange={(e) => setPrices({ ...prices, base_price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="wholesale">Wholesale Price</Label>
                <div className="flex items-center">
                  <span className="text-gray-600 mr-2">₹</span>
                  <Input
                    id="wholesale"
                    type="number"
                    value={prices.wholesale_price}
                    onChange={(e) => setPrices({ ...prices, wholesale_price: parseFloat(e.target.value) || 0 })}
                    step="0.01"
                  />
                </div>
              </div>

              {prices.cost_price > 0 && (
                <div className="p-3 bg-green-50 rounded-lg">
                  <p className="text-sm text-gray-600">
                    Profit Margin:{' '}
                    <span className="font-semibold text-green-600">
                      {calculateMargin(prices.base_price, prices.cost_price)}%
                    </span>
                  </p>
                </div>
              )}

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  Update Prices
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

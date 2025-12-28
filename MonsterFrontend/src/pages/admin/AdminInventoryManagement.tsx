import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { 
  Package, 
  AlertTriangle, 
  TrendingDown, 
  Search, 
  Edit, 
  BarChart3,
  Warehouse,
  Loader2
} from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle 
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { inventoryService } from '@/lib/services/admin.service';
import { AuthorizationError, ForbiddenError } from '@/lib/services/authorization.service';

interface InventoryItem {
  id: string;
  product_id: string;
  size: string;
  color: string;
  quantity: number;
  min_stock_level: number;
  max_stock_level: number;
  products: {
    name: string;
    base_price: number;
  };
}

interface InventoryStats {
  totalItems: number;
  lowStockItems: number;
  outOfStockItems: number;
  totalValue: number;
  avgStockLevel: number;
}

interface FormErrors {
  quantity?: string;
  min_stock_level?: string;
  max_stock_level?: string;
}

export default function AdminInventoryManagement() {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [stockFilter, setStockFilter] = useState<string>('all');
  const [isUpdateDialogOpen, setIsUpdateDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [updateFormData, setUpdateFormData] = useState({
    quantity: '',
    min_stock_level: '',
    max_stock_level: ''
  });

  const fetchInventory = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await inventoryService.getVariants();
      
      if (error) {
        // Handle authorization errors
        if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to view inventory.",
            variant: "destructive"
          });
        } else {
          throw error;
        }
        return;
      }
      
      // Sort the data after fetching
      const sortedData = (data || []).sort((a, b) => 
        (a.products?.name || '').localeCompare(b.products?.name || '')
      );
      
      setInventory(sortedData);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to fetch inventory data",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const validateForm = useCallback((): boolean => {
    const errors: FormErrors = {};
    
    // Validate quantity
    const quantity = parseInt(updateFormData.quantity);
    if (!updateFormData.quantity || isNaN(quantity) || quantity < 0) {
      errors.quantity = 'Quantity must be a valid non-negative number';
    }
    
    // Validate min_stock_level
    const minStock = parseInt(updateFormData.min_stock_level);
    if (!updateFormData.min_stock_level || isNaN(minStock) || minStock < 0) {
      errors.min_stock_level = 'Minimum stock level must be a valid non-negative number';
    }
    
    // Validate max_stock_level
    const maxStock = parseInt(updateFormData.max_stock_level);
    if (!updateFormData.max_stock_level || isNaN(maxStock) || maxStock < 0) {
      errors.max_stock_level = 'Maximum stock level must be a valid non-negative number';
    }
    
    // Validate min < max
    if (!errors.min_stock_level && !errors.max_stock_level && minStock >= maxStock) {
      errors.max_stock_level = 'Maximum stock level must be greater than minimum stock level';
    }
    
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [updateFormData]);

  const updateInventory = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedItem) return;

    // Validate form
    if (!validateForm()) {
      toast({
        title: "Validation Error",
        description: "Please fix the form errors before submitting",
        variant: "destructive"
      });
      return;
    }

    setUpdating(true);
    
    try {
      const quantity = parseInt(updateFormData.quantity);
      const minStockLevel = parseInt(updateFormData.min_stock_level);
      const maxStockLevel = parseInt(updateFormData.max_stock_level);

      const { error } = await inventoryService.updateVariant(selectedItem.id, {
        quantity: quantity,
        min_stock_level: minStockLevel,
        max_stock_level: maxStockLevel
      });

      if (error) {
        // Handle authorization errors
        if (error instanceof AuthorizationError || error instanceof ForbiddenError) {
          toast({
            title: "Access Denied",
            description: "You don't have permission to update inventory.",
            variant: "destructive"
          });
          return;
        }
        throw error;
      }

      toast({
        title: "Success",
        description: "Inventory updated successfully"
      });

      setIsUpdateDialogOpen(false);
      setSelectedItem(null);
      setUpdateFormData({
        quantity: '',
        min_stock_level: '',
        max_stock_level: ''
      });
      setFormErrors({});
      fetchInventory();
    } catch (error) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: "Failed to update inventory",
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  }, [selectedItem, updateFormData, validateForm, fetchInventory]);

  const openUpdateDialog = useCallback((item: InventoryItem) => {
    setSelectedItem(item);
    setUpdateFormData({
      quantity: item.quantity.toString(),
      min_stock_level: item.min_stock_level.toString(),
      max_stock_level: item.max_stock_level.toString()
    });
    setFormErrors({});
    setIsUpdateDialogOpen(true);
  }, []);

  const closeUpdateDialog = useCallback(() => {
    setIsUpdateDialogOpen(false);
    setSelectedItem(null);
    setUpdateFormData({
      quantity: '',
      min_stock_level: '',
      max_stock_level: ''
    });
    setFormErrors({});
  }, []);

  const getStockStatus = useCallback((item: InventoryItem) => {
    if (item.quantity === 0) {
      return { status: 'out-of-stock', label: 'Out of Stock', color: 'bg-red-100 text-red-800' };
    } else if (item.quantity <= item.min_stock_level) {
      return { status: 'low-stock', label: 'Low Stock', color: 'bg-orange-100 text-orange-800' };
    } else if (item.quantity >= item.max_stock_level) {
      return { status: 'overstock', label: 'Overstock', color: 'bg-blue-100 text-blue-800' };
    } else {
      return { status: 'in-stock', label: 'In Stock', color: 'bg-green-100 text-green-800' };
    }
  }, []);

  const filteredInventory = useMemo(() => {
    return inventory.filter(item => {
      const matchesSearch = item.products?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.size.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           item.color.toLowerCase().includes(searchTerm.toLowerCase());
      
      const stockStatus = getStockStatus(item);
      const matchesFilter = stockFilter === 'all' || stockStatus.status === stockFilter;
      
      return matchesSearch && matchesFilter;
    });
  }, [inventory, searchTerm, stockFilter, getStockStatus]);

  const inventoryStats: InventoryStats = useMemo(() => {
    if (inventory.length === 0) {
      return {
        totalItems: 0,
        lowStockItems: 0,
        outOfStockItems: 0,
        totalValue: 0,
        avgStockLevel: 0
      };
    }

    const totalItems = inventory.length;
    const lowStockItems = inventory.filter(item => item.quantity <= item.min_stock_level && item.quantity > 0).length;
    const outOfStockItems = inventory.filter(item => item.quantity === 0).length;
    const totalValue = inventory.reduce((sum, item) => sum + (item.quantity * (item.products?.base_price || 0)), 0);
    const avgStockLevel = Math.round(inventory.reduce((sum, item) => sum + item.quantity, 0) / totalItems);

    return {
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalValue,
      avgStockLevel
    };
  }, [inventory]);

  const handleFormChange = useCallback((field: keyof typeof updateFormData, value: string) => {
    setUpdateFormData(prev => ({ ...prev, [field]: value }));
    // Clear error for this field when user starts typing
    setFormErrors(prev => ({ ...prev, [field]: undefined }));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Package className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">Loading inventory...</h3>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Inventory Management</h1>
          <p className="text-gray-600">Track and manage product stock levels</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Items</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.totalItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Low Stock</CardTitle>
            <TrendingDown className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{inventoryStats.lowStockItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Out of Stock</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inventoryStats.outOfStockItems}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Value</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">₹{inventoryStats.totalValue.toLocaleString()}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg. Stock</CardTitle>
            <Warehouse className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{inventoryStats.avgStockLevel}</div>
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
                  placeholder="Search by product, size, or color..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={stockFilter} onValueChange={setStockFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder="Filter by stock status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Items</SelectItem>
                <SelectItem value="in-stock">In Stock</SelectItem>
                <SelectItem value="low-stock">Low Stock</SelectItem>
                <SelectItem value="out-of-stock">Out of Stock</SelectItem>
                <SelectItem value="overstock">Overstock</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items ({filteredInventory.length})</CardTitle>
          <CardDescription>
            Manage stock levels and inventory status
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Product</TableHead>
                <TableHead>Variant</TableHead>
                <TableHead>Current Stock</TableHead>
                <TableHead>Min/Max Level</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Value</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredInventory.map((item) => {
                const stockStatus = getStockStatus(item);
                const itemValue = item.quantity * (item.products?.base_price || 0);
                
                return (
                  <TableRow key={item.id}>
                    <TableCell>
                      <div className="font-medium">{item.products?.name || 'Unknown Product'}</div>
                      <div className="text-sm text-gray-500">₹{item.products?.base_price || 0}</div>
                    </TableCell>
                    <TableCell>
                      <div>{item.size} / {item.color}</div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{item.quantity}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        Min: {item.min_stock_level}<br/>
                        Max: {item.max_stock_level}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={stockStatus.color}>
                        {stockStatus.label}
                      </Badge>
                    </TableCell>
                    <TableCell>₹{itemValue.toLocaleString()}</TableCell>
                    <TableCell>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => openUpdateDialog(item)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
          
          {filteredInventory.length === 0 && (
            <div className="text-center py-12">
              <Package className="mx-auto h-12 w-12 text-gray-400" />
              <h3 className="mt-2 text-sm font-medium text-gray-900">No inventory items found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {searchTerm || stockFilter !== 'all' 
                  ? 'Try adjusting your search or filter criteria' 
                  : 'Inventory items will appear here when products are added'
                }
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Update Inventory Dialog */}
      <Dialog open={isUpdateDialogOpen} onOpenChange={closeUpdateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Update Inventory</DialogTitle>
            <DialogDescription>
              Update stock levels for {selectedItem?.products?.name} ({selectedItem?.size} / {selectedItem?.color})
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={updateInventory} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Current Quantity</Label>
              <Input
                id="quantity"
                type="number"
                min="0"
                value={updateFormData.quantity}
                onChange={(e) => handleFormChange('quantity', e.target.value)}
                required
                disabled={updating}
                className={formErrors.quantity ? 'border-red-500' : ''}
              />
              {formErrors.quantity && (
                <p className="text-sm text-red-600">{formErrors.quantity}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="min_stock">Minimum Stock Level</Label>
              <Input
                id="min_stock"
                type="number"
                min="0"
                value={updateFormData.min_stock_level}
                onChange={(e) => handleFormChange('min_stock_level', e.target.value)}
                required
                disabled={updating}
                className={formErrors.min_stock_level ? 'border-red-500' : ''}
              />
              {formErrors.min_stock_level && (
                <p className="text-sm text-red-600">{formErrors.min_stock_level}</p>
              )}
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="max_stock">Maximum Stock Level</Label>
              <Input
                id="max_stock"
                type="number"
                min="0"
                value={updateFormData.max_stock_level}
                onChange={(e) => handleFormChange('max_stock_level', e.target.value)}
                required
                disabled={updating}
                className={formErrors.max_stock_level ? 'border-red-500' : ''}
              />
              {formErrors.max_stock_level && (
                <p className="text-sm text-red-600">{formErrors.max_stock_level}</p>
              )}
            </div>
            
            <div className="flex justify-end space-x-2">
              <Button type="button" variant="outline" onClick={closeUpdateDialog} disabled={updating}>
                Cancel
              </Button>
              <Button type="submit" disabled={updating}>
                {updating && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Update Inventory
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
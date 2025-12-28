import React, { useState, useEffect } from 'react';
import { Plus, Edit2, Trash2, Search, Filter } from 'lucide-react';
import AdminLayout from '@/components/admin/AdminLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { discountService } from '@/lib/services/admin.service';
import { toast } from '@/hooks/use-toast';

interface Discount {
  id: string;
  code: string;
  type: 'percentage' | 'fixed';
  value: number;
  description?: string;
  min_purchase: number;
  max_uses?: number;
  used_count: number;
  valid_from: string;
  valid_until: string;
  is_active: boolean;
  created_at: string;
}

type DiscountType = 'percentage' | 'fixed';

export default function AdminDiscountManagement() {
  const [discounts, setDiscounts] = useState<Discount[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState<{
    code: string;
    type: DiscountType;
    value: number;
    description: string;
    min_purchase: number;
    max_uses?: number;
    valid_from: string;
    valid_until: string;
    is_active: boolean;
  }>({
    code: '',
    type: 'percentage',
    value: 0,
    description: '',
    min_purchase: 0,
    max_uses: 0,
    valid_from: '',
    valid_until: '',
    is_active: true
  });

  useEffect(() => {
    fetchDiscounts();
  }, []);

  const fetchDiscounts = async () => {
    try {
      setLoading(true);
      const { data, error } = await discountService.getDiscounts();
      if (error) throw error;
      setDiscounts(data || []);
    } catch (error) {
      console.error('Error fetching discounts:', error);
      toast({
        title: 'Error',
        description: 'Failed to fetch discounts',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const handleOpenDialog = (discount?: Discount) => {
    if (discount) {
      setEditingId(discount.id);
      setFormData({
        code: discount.code,
        type: discount.type,
        value: discount.value,
        description: discount.description || '',
        min_purchase: discount.min_purchase || 0,
        max_uses: discount.max_uses || undefined,
        valid_from: discount.valid_from.split('T')[0],
        valid_until: discount.valid_until.split('T')[0],
        is_active: discount.is_active
      });
    } else {
      setEditingId(null);
      setFormData({
        code: '',
        type: 'percentage',
        value: 0,
        description: '',
        min_purchase: 0,
        max_uses: undefined,
        valid_from: '',
        valid_until: '',
        is_active: true
      });
    }
    setIsDialogOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validation
    if (formData.code.trim() === '') {
      toast({
        title: 'Validation Error',
        description: 'Discount code is required',
        variant: 'destructive'
      });
      return;
    }

    if (formData.value <= 0) {
      toast({
        title: 'Validation Error',
        description: 'Discount value must be greater than 0',
        variant: 'destructive'
      });
      return;
    }

    if (formData.type === 'percentage' && formData.value > 100) {
      toast({
        title: 'Validation Error',
        description: 'Percentage discount cannot exceed 100%',
        variant: 'destructive'
      });
      return;
    }

    if (formData.valid_from && formData.valid_until && formData.valid_from > formData.valid_until) {
      toast({
        title: 'Validation Error',
        description: 'Valid from date cannot be after valid until date',
        variant: 'destructive'
      });
      return;
    }

    if (formData.valid_from === '' || formData.valid_until === '') {
      toast({
        title: 'Validation Error',
        description: 'Both valid from and valid until dates are required',
        variant: 'destructive'
      });
      return;
    }

    try {
      // Map form data to match database schema
      const discountData = {
        code: formData.code.trim(),
        type: formData.type,
        value: formData.value,
        description: formData.description.trim() || undefined,
        min_purchase: formData.min_purchase || 0,
        max_uses: formData.max_uses || undefined,
        valid_from: formData.valid_from,
        valid_until: formData.valid_until,
        is_active: formData.is_active
      };

      if (editingId) {
        const { error } = await discountService.updateDiscount(editingId, discountData);
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Discount updated successfully'
        });
      } else {
        const { error } = await discountService.createDiscount(discountData);
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Discount created successfully'
        });
      }
      setIsDialogOpen(false);
      fetchDiscounts();
    } catch (error) {
      console.error('Error saving discount:', error);
      toast({
        title: 'Error',
        description: 'Failed to save discount',
        variant: 'destructive'
      });
    }
  };

  const handleDelete = async (id: string, discountCode: string) => {
    const confirmed = window.confirm(
      `Are you sure you want to delete the discount code "${discountCode}"? This action cannot be undone.`
    );
    
    if (confirmed) {
      try {
        const { error } = await discountService.deleteDiscount(id);
        if (error) throw error;
        toast({
          title: 'Success',
          description: 'Discount deleted successfully'
        });
        fetchDiscounts();
      } catch (error) {
        console.error('Error deleting discount:', error);
        toast({
          title: 'Error',
          description: 'Failed to delete discount',
          variant: 'destructive'
        });
      }
    }
  };

  const filteredDiscounts = discounts.filter(discount =>
    discount.code.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center h-64">
          <p className="text-gray-600">Loading discounts...</p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Discount Management</h1>
            <p className="text-gray-600">Create and manage promotional discounts</p>
          </div>
          <Button onClick={() => handleOpenDialog()} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Create Discount
          </Button>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <Input
                  placeholder="Search by discount code..."
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

        {/* Discounts Table */}
        <Card>
          <CardHeader>
            <CardTitle>All Discounts ({filteredDiscounts.length})</CardTitle>
            <CardDescription>Manage all promotional discount codes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Value</TableHead>
                    <TableHead>Min Purchase</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead>Valid Until</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredDiscounts.map((discount) => (
                    <TableRow key={discount.id}>
                      <TableCell className="font-medium">{discount.code}</TableCell>
                      <TableCell>
                        <Badge variant="outline">
                          {discount.type === 'percentage' ? '%' : '₹'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {discount.type === 'percentage'
                          ? `${discount.value}%`
                          : `₹${discount.value}`}
                      </TableCell>
                      <TableCell>₹{discount.min_purchase || 0}</TableCell>
                      <TableCell>
                        {discount.used_count}/{discount.max_uses || '∞'}
                      </TableCell>
                      <TableCell>{new Date(discount.valid_until).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge variant={discount.is_active ? 'default' : 'secondary'}>
                          {discount.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleOpenDialog(discount)}
                          >
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(discount.id, discount.code)}
                            className="text-red-600 hover:text-red-700"
                            title={`Delete discount ${discount.code}`}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {filteredDiscounts.length === 0 && (
              <div className="text-center py-12">
                <p className="text-gray-600">No discounts found. Create one to get started.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{editingId ? 'Edit Discount' : 'Create Discount'}</DialogTitle>
              <DialogDescription>
                {editingId ? 'Update discount details' : 'Create a new promotional discount code'}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSave} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="code">Discount Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                  placeholder="e.g., SAVE20"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="e.g., 20% off on all products"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="type">Type</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value: DiscountType) => setFormData({ ...formData, type: value })}
                  >
                    <SelectTrigger id="type" className="w-full">
                      <SelectValue placeholder="Select discount type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage (%)</SelectItem>
                      <SelectItem value="fixed">Fixed (₹)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="value">Value</Label>
                  <Input
                    id="value"
                    type="number"
                    min={formData.type === 'percentage' ? '1' : '0.01'}
                    max={formData.type === 'percentage' ? '100' : undefined}
                    step={formData.type === 'percentage' ? '1' : '0.01'}
                    value={formData.value || ''}
                    onChange={(e) => setFormData({ ...formData, value: parseFloat(e.target.value) || 0 })}
                    placeholder={formData.type === 'percentage' ? 'e.g., 20 for 20%' : 'e.g., 100 for ₹100'}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="min-purchase">Minimum Purchase Amount</Label>
                <Input
                  id="min-purchase"
                  type="number"
                  min="0"
                  step="0.01"
                  value={formData.min_purchase || ''}
                  onChange={(e) => setFormData({ ...formData, min_purchase: parseFloat(e.target.value) || 0 })}
                  placeholder="Enter minimum purchase amount (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="max-uses">Maximum Uses</Label>
                <Input
                  id="max-uses"
                  type="number"
                  min="1"
                  value={formData.max_uses || ''}
                  onChange={(e) => {
                    const value = e.target.value;
                    setFormData({ 
                      ...formData, 
                      max_uses: value ? parseInt(value) : undefined 
                    });
                  }}
                  placeholder="Enter maximum number of uses (optional)"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="valid-from">Valid From</Label>
                  <Input
                    id="valid-from"
                    type="date"
                    value={formData.valid_from}
                    onChange={(e) => setFormData({ ...formData, valid_from: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="valid-until">Valid Until</Label>
                  <Input
                    id="valid-until"
                    type="date"
                    value={formData.valid_until}
                    onChange={(e) => setFormData({ ...formData, valid_until: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="is-active"
                  title="Check to make this discount active"
                  checked={formData.is_active}
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                  className="w-4 h-4 rounded border-gray-300"
                />
                <Label htmlFor="is-active">Active</Label>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" className="bg-orange-500 hover:bg-orange-600">
                  {editingId ? 'Update' : 'Create'} Discount
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </AdminLayout>
  );
}

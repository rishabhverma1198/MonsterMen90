import { useState, useEffect } from 'react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { orderService } from '@/lib/services/admin.service';
import { toast } from '@/hooks/use-toast';
import { Loader2, Trash2, Package } from 'lucide-react';

// Order Status Constants
export const ORDER_STATUSES = [
  { value: 'pending', label: 'Pending', color: 'bg-amber-100 text-amber-700 border-amber-200' },
  { value: 'confirmed', label: 'Confirmed', color: 'bg-blue-100 text-blue-700 border-blue-200' },
  { value: 'shipped', label: 'Shipped', color: 'bg-purple-100 text-purple-700 border-purple-200' },
  { value: 'delivered', label: 'Delivered', color: 'bg-green-100 text-green-700 border-green-200' },
  { value: 'cancelled', label: 'Cancelled', color: 'bg-red-100 text-red-700 border-red-200' }
] as const;

export type OrderStatus = typeof ORDER_STATUSES[number]['value'];

// Helper function to get status style
const getStatusStyle = (status: string) => {
  const statusConfig = ORDER_STATUSES.find(s => s.value === status);
  return statusConfig?.color || 'bg-gray-100';
};

export default function AdminOrderManagement() {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<string>('');

  // Initial data fetch
  const fetchOrders = async () => {
    try {
      setLoading(true);
      const { data, error } = await orderService.getOrders();
      if (error) throw error;
      setOrders(data || []);
    } catch (err: any) {
      toast({ title: "Error", description: "Failed to load orders", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchOrders(); }, []);

  // Status update logic with Local State Update
  const updateStatus = async (orderId: string, newStatus: string) => {
    try {
      const { error } = await orderService.updateOrderStatus(orderId, newStatus as any);
      
      if (error) throw error;

      // Optimistic Update
      setOrders(prev => prev.map(order => 
        order.id === orderId ? { ...order, status: newStatus } : order
      ));

      toast({ 
        title: "Status Updated", 
        description: `Order status changed to ${newStatus}` 
      });
    } catch (err: any) {
      toast({ 
        title: "Update Failed", 
        description: err.message || "An error occurred", 
        variant: "destructive" 
      });
    }
  };

  // Bulk selection
  const toggleOrderSelection = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const toggleSelectAll = () => {
    if (selectedOrders.size === orders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(orders.map(o => o.id)));
    }
  };

  // Bulk status update
  const updateBulkStatus = async () => {
    if (!bulkStatus || selectedOrders.size === 0) {
      toast({ title: "Warning", description: "Please select orders and status", variant: "destructive" });
      return;
    }

    try {
      const updatePromises = Array.from(selectedOrders).map(orderId => 
        orderService.updateOrderStatus(orderId, bulkStatus as any)
      );
      
      await Promise.all(updatePromises);

      // Update local state
      setOrders(prev => prev.map(order => 
        selectedOrders.has(order.id) ? { ...order, status: bulkStatus } : order
      ));

      toast({ 
        title: "Bulk Update Successful", 
        description: `Updated ${selectedOrders.size} orders to ${bulkStatus}` 
      });

      setSelectedOrders(new Set());
      setBulkStatus('');
    } catch (err: any) {
      toast({ 
        title: "Bulk Update Failed", 
        description: err.message || "An error occurred", 
        variant: "destructive" 
      });
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
      </div>
    );
  }

  const isAllSelected = orders.length > 0 && selectedOrders.size === orders.length;

  return (
    <div className="bg-white rounded-xl shadow-sm border p-6">
      <div className="mb-6">
        <h2 className="text-xl font-bold">Order Management</h2>
        <p className="text-sm text-gray-500">Manage order status and fulfillment</p>
      </div>

      {/* Bulk Actions Bar */}
      {selectedOrders.size > 0 && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg flex items-center justify-between">
          <span className="text-sm font-medium text-blue-700">
            {selectedOrders.size} order(s) selected
          </span>
          <div className="flex items-center gap-2">
            <Select value={bulkStatus} onValueChange={setBulkStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select new status" />
              </SelectTrigger>
              <SelectContent>
                {ORDER_STATUSES.map(s => (
                  <SelectItem key={s.value} value={s.value} className="capitalize">{s.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button onClick={updateBulkStatus} disabled={!bulkStatus}>
              Apply to Selected
            </Button>
            <Button variant="outline" onClick={() => setSelectedOrders(new Set())}>
              Clear Selection
            </Button>
          </div>
        </div>
      )}

      <Table>
        <TableHeader>
          <TableRow className="bg-gray-50">
            <TableHead className="w-[50px]">
              <Checkbox 
                checked={isAllSelected}
                onCheckedChange={toggleSelectAll}
              />
            </TableHead>
            <TableHead>Order ID</TableHead>
            <TableHead>Customer</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center py-10 text-gray-500">
                No orders found.
              </TableCell>
            </TableRow>
          ) : (
            orders.map((order) => (
              <TableRow key={order.id} className={selectedOrders.has(order.id) ? 'bg-blue-50' : ''}>
                <TableCell>
                  <Checkbox 
                    checked={selectedOrders.has(order.id)}
                    onCheckedChange={() => toggleOrderSelection(order.id)}
                  />
                </TableCell>
                <TableCell className="font-mono text-xs font-bold">{order.order_number}</TableCell>
                <TableCell>
                  <div className="text-sm">
                    <div className="font-semibold">{order.users?.full_name || 'Guest'}</div>
                    <div className="text-gray-500 text-xs">{order.users?.email}</div>
                  </div>
                </TableCell>
                <TableCell className="font-bold text-gray-900">₹{order.total_amount}</TableCell>
                <TableCell>
                  <Badge className={`${getStatusStyle(order.status)} border px-3 py-1 shadow-none`}>
                    {order.status?.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Select onValueChange={(val: string) => updateStatus(order.id, val)} defaultValue={order.status}>
                    <SelectTrigger className="w-[140px] h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ORDER_STATUSES.map(s => (
                        <SelectItem key={s.value} value={s.value} className="capitalize">{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>
  );
}

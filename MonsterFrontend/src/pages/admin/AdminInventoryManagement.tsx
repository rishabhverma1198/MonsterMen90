import { useState, useEffect, useCallback } from 'react';
import { Package, AlertTriangle, Edit } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { inventoryService } from '@/lib/services/admin.service';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

export default function AdminInventoryManagement() {
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchItems = useCallback(async () => {
    setLoading(true);
    const { data } = await inventoryService.getVariants();
    setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  return (
    <div className="space-y-6">
      <div className="grid md:grid-cols-3 gap-6">
        <InventoryStat title="Low Stock Items" count={items.filter(i => i.quantity <= i.min_stock_level).length} icon={AlertTriangle} color="bg-orange-500" />
        <InventoryStat title="Total Value" count={`₹${items.reduce((s, i) => s + (i.quantity * (i.products?.base_price || 0)), 0).toLocaleString()}`} icon={Package} color="bg-blue-500" />
        <InventoryStat title="Out of Stock" count={items.filter(i => i.quantity === 0).length} icon={AlertTriangle} color="bg-red-500" />
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-gray-50 border-b text-xs uppercase font-bold text-gray-500">
            <tr>
              <th className="p-4">Product Name</th>
              <th className="p-4">Variant (Size/Color)</th>
              <th className="p-4">Stock</th>
              <th className="p-4">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {items.map(item => (
              <tr key={item.id} className="hover:bg-gray-50">
                <td className="p-4 font-medium">{item.products?.name}</td>
                <td className="p-4 text-sm text-gray-500">{item.size} / {item.color}</td>
                <td className={`p-4 font-bold ${item.quantity <= item.min_stock_level ? 'text-red-600' : 'text-gray-900'}`}>
                  {item.quantity}
                </td>
                <td className="p-4">
                  {item.quantity <= item.min_stock_level ? (
                    <Badge variant="destructive">Refill Needed</Badge>
                  ) : (
                    <Badge className="bg-green-100 text-green-700 border-green-200">Optimal</Badge>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function InventoryStat({ title, count, icon: Icon, color }: any) {
  return (
    <Card className="overflow-hidden border-none shadow-sm">
      <div className={`h-1 ${color}`} />
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-xs font-bold text-gray-500 uppercase">{title}</CardTitle>
        <Icon size={14} className="text-gray-400" />
      </CardHeader>
      <CardContent><div className="text-2xl font-black">{count}</div></CardContent>
    </Card>
  );
}
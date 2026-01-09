import React from 'react';
import { TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminDiscountManagement() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
          <TrendingUp className="w-6 h-6 text-green-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Discount Management</h1>
          <p className="text-gray-600">Manage promotional offers and discounts</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Discount Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Discount management functionality is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
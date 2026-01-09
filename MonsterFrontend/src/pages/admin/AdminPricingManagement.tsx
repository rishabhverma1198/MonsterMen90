import React from 'react';
import { DollarSign } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function AdminPricingManagement() {
  return (
    <div className="p-8">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 bg-orange-100 rounded-lg flex items-center justify-center">
          <DollarSign className="w-6 h-6 text-orange-600" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Pricing Management</h1>
          <p className="text-gray-600">Configure pricing rules and margins</p>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Pricing Setup</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-gray-600">Pricing management functionality is under development.</p>
        </CardContent>
      </Card>
    </div>
  );
}
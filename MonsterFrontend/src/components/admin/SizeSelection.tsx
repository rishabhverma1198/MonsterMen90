import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Users, User, Package, ShoppingCart } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface SizeSelectionProps {
  availableSizes: string[];
  selectedSizes: string[];
  onSizeChange: (sizes: string[]) => void;
  wholesalePrice?: number;
  basePrice?: number;
}

// Removed unused SIZES constant - using availableSizes prop instead

export default function SizeSelection({
  availableSizes,
  selectedSizes,
  onSizeChange,
  wholesalePrice = 0,
  basePrice = 0
}: SizeSelectionProps) {
  const [customerType, setCustomerType] = useState<'buyer' | 'wholeseller'>('buyer');
  
  // Initialize wholesale quantities based on available sizes
  const [wholesaleQuantities, setWholesaleQuantities] = useState<Record<string, number>>(() => {
    const wholesaleSizes = availableSizes.filter(size => ['S', 'M', 'L'].includes(size));
    const initialQuantities: Record<string, number> = {};
    wholesaleSizes.forEach(size => {
      initialQuantities[size] = 10; // Default quantity
    });
    return initialQuantities;
  });

  const handleSizeToggle = (size: string) => {
    if (selectedSizes.includes(size)) {
      onSizeChange(selectedSizes.filter(s => s !== size));
    } else {
      onSizeChange([...selectedSizes, size]);
    }
  };

  // Removed unused handleWholesaleSizeToggle function

  const updateWholesaleQuantity = (size: string, quantity: number) => {
    if (quantity >= 0 && quantity <= 50) {
      setWholesaleQuantities(prev => ({ ...prev, [size]: quantity }));
    }
  };

  const getTotalWholesaleQuantity = () => {
    return Object.values(wholesaleQuantities).reduce((sum, qty) => sum + qty, 0);
  };

  const getWholesaleTotalPrice = () => {
    if (wholesalePrice > 0) {
      return getTotalWholesaleQuantity() * wholesalePrice;
    }
    return 0;
  };

  return (
    <div className="space-y-6">
      {/* Customer Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Users className="w-5 h-5 mr-2" />
            Customer Type Selection
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card 
              className={`cursor-pointer transition-all ${
                customerType === 'buyer' 
                  ? 'border-blue-500 bg-blue-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCustomerType('buyer')}
            >
              <CardContent className="flex items-center space-x-3 p-4">
                <User className="w-8 h-8 text-blue-500" />
                <div>
                  <h3 className="font-semibold">Individual Buyers</h3>
                  <p className="text-sm text-gray-600">Select individual sizes and quantities</p>
                  <p className="text-xs text-blue-600 mt-1">Price: ₹{basePrice.toLocaleString()} per piece</p>
                </div>
              </CardContent>
            </Card>

            <Card 
              className={`cursor-pointer transition-all ${
                customerType === 'wholeseller' 
                  ? 'border-green-500 bg-green-50' 
                  : 'border-gray-200 hover:border-gray-300'
              }`}
              onClick={() => setCustomerType('wholeseller')}
            >
              <CardContent className="flex items-center space-x-3 p-4">
                <ShoppingCart className="w-8 h-8 text-green-500" />
                <div>
                  <h3 className="font-semibold">Wholesale Buyers</h3>
                  <p className="text-sm text-gray-600">Fixed quantities: 30 pieces total</p>
                  <p className="text-xs text-green-600 mt-1">Price: ₹{wholesalePrice.toLocaleString()} per piece</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      <Separator />

      {/* Size Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Package className="w-5 h-5 mr-2" />
            {customerType === 'buyer' ? 'Select Available Sizes' : 'Wholesale Size Distribution'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {customerType === 'buyer' ? (
            <div className="space-y-4">
              <Alert>
                <Users className="h-4 w-4" />
                <AlertDescription>
                  Individual buyers can select from available sizes. Each size can be ordered individually.
                </AlertDescription>
              </Alert>
              
              <div>
                <Label className="text-base font-medium">Available Sizes</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {availableSizes.map((size) => (
                    <Badge
                      key={size}
                      variant={selectedSizes.includes(size) ? 'default' : 'outline'}
                      className="cursor-pointer px-4 py-2 text-sm"
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
                {selectedSizes.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedSizes.join(', ')}
                  </p>
                )}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              <Alert>
                <ShoppingCart className="h-4 w-4" />
                <AlertDescription>
                  Wholesale orders require exactly 30 pieces total. Default distribution: 10 Small + 10 Medium + 10 Large.
                </AlertDescription>
              </Alert>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {availableSizes.filter(size => ['S', 'M', 'L'].includes(size)).map((size) => (
                  <Card key={size} className="p-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="font-medium">Size {size}</Label>
                        <Badge variant="outline">{size}</Badge>
                      </div>
                      
                      <div className="space-y-2">
                        <Label className="text-sm text-gray-600">Quantity</Label>
                        <div className="flex items-center space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWholesaleQuantity(size, wholesaleQuantities[size as keyof typeof wholesaleQuantities] - 1)}
                            disabled={wholesaleQuantities[size as keyof typeof wholesaleQuantities] <= 0}
                          >
                            -
                          </Button>
                          <span className="w-12 text-center font-medium">
                            {wholesaleQuantities[size as keyof typeof wholesaleQuantities]}
                          </span>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateWholesaleQuantity(size, wholesaleQuantities[size as keyof typeof wholesaleQuantities] + 1)}
                            disabled={getTotalWholesaleQuantity() >= 30}
                          >
                            +
                          </Button>
                        </div>
                      </div>
                      
                      <div className="text-sm text-gray-600">
                        Subtotal: ₹{(wholesaleQuantities[size as keyof typeof wholesaleQuantities] * wholesalePrice).toLocaleString()}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>

              {/* Total Summary */}
              <Card className="bg-green-50 border-green-200">
                <CardContent className="p-4">
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="font-medium">Total Quantity:</span>
                      <span className="font-bold">{getTotalWholesaleQuantity()} pieces</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="font-medium">Price per piece:</span>
                      <span>₹{wholesalePrice.toLocaleString()}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between text-lg font-bold">
                      <span>Total Amount:</span>
                      <span className="text-green-600">₹{getWholesaleTotalPrice().toLocaleString()}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {getTotalWholesaleQuantity() !== 30 && (
                <Alert variant="destructive">
                  <Package className="h-4 w-4" />
                  <AlertDescription>
                    Wholesale orders must have exactly 30 pieces total. Currently: {getTotalWholesaleQuantity()} pieces.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Size Guide */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-800">Size Guide</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
            <div>
              <strong>XS:</strong> 32-34 inches chest
            </div>
            <div>
              <strong>S:</strong> 34-36 inches chest
            </div>
            <div>
              <strong>M:</strong> 36-38 inches chest
            </div>
            <div>
              <strong>L:</strong> 38-40 inches chest
            </div>
            <div>
              <strong>XL:</strong> 40-42 inches chest
            </div>
            <div>
              <strong>XXL:</strong> 42-44 inches chest
            </div>
            <div>
              <strong>XXXL:</strong> 44-46 inches chest
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
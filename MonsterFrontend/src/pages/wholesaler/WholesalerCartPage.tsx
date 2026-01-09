import { useEffect, useState, useCallback, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase";
import BackButton from "@/components/common/BackButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, AlertCircle, ShoppingCart, Trash2, PackageCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const DEFAULT_WHOLESALER_MOQ = 50;

export default function WholesalerCartPage() {
  const { cart, clearCart, removeItem } = useCart();
  const navigate = useNavigate();
  const [isValidating, setIsValidating] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Memoized Totals for performance
  const { grandTotal, totalItemsCount } = useMemo(() => {
    return cart.reduce((acc, item) => {
      const itemTotal = Object.values(item.sizeBreakup).reduce(
        (s: number, v: any) => s + (v.qty * v.price), 0
      );
      return {
        grandTotal: acc.grandTotal + itemTotal,
        totalItemsCount: acc.totalItemsCount + item.quantity
      };
    }, { grandTotal: 0, totalItemsCount: 0 });
  }, [cart]);

  // Optimized parallel stock check
  const validateInventory = async () => {
    setIsValidating(true);
    setErrorMsg("");
    
    try {
      // Create all requests at once
      const checkPromises = cart.flatMap(item => 
        Object.entries(item.sizeBreakup)
          .filter(([, data]: any) => data.qty > 0)
          .map(async ([size, data]: any) => {
            const { data: stockData, error } = await supabase.functions.invoke('stock-management', {
              body: { pid: item.id, size: size },
              method: 'GET'
            });
            if (error) throw error;
            return { 
              name: item.name, 
              size, 
              requested: data.qty, 
              available: stockData?.available ?? 0 
            };
          })
      );

      const results = await Promise.all(checkPromises);
      
      // 1. Check Stock Availability
      const failedItem = results.find(r => r.requested > r.available);
      if (failedItem) {
        setErrorMsg(`Insufficient stock for ${failedItem.name} (${failedItem.size}). Available: ${failedItem.available}`);
        return false;
      }

      // 2. Check Global MOQ
      if (totalItemsCount < DEFAULT_WHOLESALER_MOQ) {
        setErrorMsg(`Minimum bulk order quantity is ${DEFAULT_WHOLESALER_MOQ} units. Your current total: ${totalItemsCount}`);
        return false;
      }

      // 3. Check Per-Product MOQ
      for (const item of cart) {
        const minQty = (item as any).minQty ?? DEFAULT_WHOLESALER_MOQ;
        if (item.quantity < minQty) {
          setErrorMsg(`${item.name} requires at least ${minQty} units for wholesale pricing.`);
          return false;
        }
      }

      return true;
    } catch (err) {
      toast({ title: "Validation Error", description: "Could not verify stock. Please try again.", variant: "destructive" });
      return false;
    } finally {
      setIsValidating(false);
    }
  };

  const handleProceed = async () => {
    const isReady = await validateInventory();
    if (isReady) {
      navigate("/wholesaler/checkout");
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-6 text-center">
        <div className="bg-gray-100 p-6 rounded-full mb-4">
          <ShoppingCart className="w-12 h-12 text-gray-400" />
        </div>
        <h2 className="text-2xl font-bold">Your bulk cart is empty</h2>
        <p className="text-muted-foreground mt-2 max-w-xs">Add minimum 50 units across products to start a wholesale order.</p>
        <Button onClick={() => navigate("/wholesaler")} className="mt-6 rounded-xl px-8">Browse Products</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div className="space-y-1">
          <BackButton to="/wholesaler" />
          <h1 className="text-4xl font-black tracking-tight mt-4">Bulk Cart</h1>
        </div>
        <Button variant="ghost" className="text-red-500 hover:text-red-600 hover:bg-red-50" onClick={clearCart}>
          <Trash2 className="w-4 h-4 mr-2" /> Clear Cart
        </Button>
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        {/* Left: Cart Items */}
        <div className="lg:col-span-2 space-y-4">
          {cart.map((item) => (
            <Card key={item.id} className="border-none shadow-sm ring-1 ring-black/5 overflow-hidden">
              <CardContent className="p-6">
                <div className="flex flex-col sm:flex-row justify-between gap-4">
                  <div className="flex gap-4">
                    <img src={item.image} alt={item.name} className="w-20 h-24 object-cover rounded-lg bg-gray-50" />
                    <div>
                      <h3 className="font-bold text-lg leading-tight">{item.name}</h3>
                      <Badge variant="outline" className="mt-2 bg-blue-50 text-blue-700 border-blue-100">
                        MOQ: {(item as any).minQty ?? DEFAULT_WHOLESALER_MOQ} units
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Item Total</p>
                    <p className="text-xl font-black">₹{Object.values(item.sizeBreakup).reduce((s: any, v: any) => s + v.qty * v.price, 0)}</p>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {Object.entries(item.sizeBreakup).filter(([, d]: any) => d.qty > 0).map(([size, d]: any) => (
                    <div key={size} className="bg-gray-50 p-3 rounded-xl border border-gray-100">
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{size}</p>
                      <p className="font-bold text-sm">{d.qty} pcs</p>
                      <p className="text-[10px] text-muted-foreground">₹{d.price}/pc</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Right: Order Summary */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 border-none shadow-2xl bg-black text-white rounded-3xl">
            <CardContent className="p-8 space-y-6">
              <h3 className="text-xl font-bold flex items-center gap-2">
                <PackageCheck className="w-5 h-5 text-green-400" /> Checkout Summary
              </h3>
              
              <div className="space-y-3 pt-4">
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Total Quantity</span>
                  <span className="text-white font-bold">{totalItemsCount} units</span>
                </div>
                <div className="flex justify-between text-gray-400 text-sm">
                  <span>Standard MOQ</span>
                  <span>{DEFAULT_WHOLESALER_MOQ} units</span>
                </div>
                <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                  <span className="text-gray-400">Payable Amount</span>
                  <span className="text-3xl font-black text-white">₹{grandTotal.toLocaleString()}</span>
                </div>
              </div>

              {errorMsg && (
                <div className="bg-red-500/10 border border-red-500/20 p-4 rounded-2xl flex gap-3 text-red-400 text-xs">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <p>{errorMsg}</p>
                </div>
              )}

              <Button 
                onClick={handleProceed} 
                disabled={isValidating}
                className="w-full h-14 rounded-2xl bg-white text-black hover:bg-gray-200 text-lg font-bold shadow-xl transition-all active:scale-95"
              >
                {isValidating ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Verifying...</>
                ) : (
                  "Proceed to Shipping"
                )}
              </Button>
              
              <p className="text-[10px] text-center text-gray-500 uppercase tracking-widest font-bold">
                🔒 Secure B2B Transaction
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
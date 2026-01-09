import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { supabase } from "@/lib/supabase"; // Database setup
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast";
import { Loader2, PackageCheck, CreditCard, ShoppingBag } from "lucide-react";

export default function WholesalerCheckout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  // 💰 Calculate total amount with size-wise precision
  const totalAmount = cart.reduce((sum, item) => {
    const itemTotal = Object.values(item.sizeBreakup).reduce(
      (s: number, v: any) => s + v.qty * v.price,
      0
    );
    return sum + itemTotal;
  }, 0);

  // 🚀 Production Grade Order Placement Logic
  const handlePlaceOrder = async () => {
    if (cart.length === 0) return;

    setLoading(true);
    try {
      // 1. Get current user session
      const { data: { user } } = await supabase.auth.getUser();

      // 2. Prepare Order Payload for Database
      const orderData = {
        user_id: user?.id,
        items: cart, // Storing full cart JSON for audit
        total_amount: totalAmount,
        status: 'pending',
        order_type: 'wholesale',
        created_at: new Date().toISOString(),
      };

      // 3. Insert into Supabase 'orders' table
      const { error } = await supabase
        .from("orders")
        .insert([orderData]);

      if (error) throw error;

      // 4. Cleanup and Feedback
      toast({
        title: "Order Placed! 🎉",
        description: "Our team will contact you for invoice processing.",
      });
      
      clearCart();
      navigate("/order-success"); // Redirect to a success page
    } catch (err: any) {
      console.error("Order error:", err);
      toast({
        title: "Order Failed",
        description: err.message || "Something went wrong. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (cart.length === 0) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center space-y-4">
        <ShoppingBag size={48} className="text-gray-300" />
        <h2 className="text-xl font-bold text-gray-500">Cart is empty</h2>
        <Button onClick={() => navigate("/wholesaler")}>Return to Shop</Button>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 grid md:grid-cols-3 gap-8 animate-in fade-in duration-500">
      
      {/* LEFT: Order Items Details */}
      <div className="md:col-span-2 space-y-6">
        <header>
          <h1 className="text-4xl font-black tracking-tight">Confirm Bulk Order</h1>
          <p className="text-muted-foreground mt-2 text-lg">Review items and finalize your wholesale shipment.</p>
        </header>

        <div className="space-y-4">
          {cart.map((item) => {
            const itemTotal = Object.values(item.sizeBreakup).reduce(
              (s: number, v: any) => s + v.qty * v.price, 0
            );

            return (
              <Card key={item.id} className="border-none shadow-sm ring-1 ring-black/5">
                <CardContent className="p-6">
                  <div className="flex justify-between items-start">
                    <div className="flex gap-4">
                      <img src={item.image} alt={item.name} className="w-16 h-20 object-cover rounded-lg bg-gray-50" />
                      <div>
                        <h3 className="font-bold text-lg">{item.name}</h3>
                        <p className="text-sm text-muted-foreground mb-3">Total Quantity: {item.quantity} pieces</p>
                        
                        {/* Size Breakdown */}
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(item.sizeBreakup)
                            .filter(([, d]: any) => d.qty > 0)
                            .map(([size, d]: any) => (
                              <Badge key={size} variant="secondary" className="px-2 py-1 text-[10px] font-bold">
                                {size}: {d.qty} × ₹{d.price}
                              </Badge>
                            ))}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Item Total</p>
                      <p className="text-xl font-black">₹{itemTotal.toLocaleString()}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>

      {/* RIGHT: Order Summary Card */}
      <div className="md:col-span-1">
        <Card className="sticky top-8 bg-black text-white rounded-3xl border-none shadow-2xl overflow-hidden">
          <CardHeader className="bg-white/10 pb-6">
            <CardTitle className="flex items-center gap-2">
              <PackageCheck className="text-green-400" /> Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-8 space-y-6">
            <div className="space-y-4">
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Subtotal</span>
                <span>₹{totalAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-400 text-sm">
                <span>Shipping</span>
                <span className="text-green-400">Calculated after invoice</span>
              </div>
              <div className="border-t border-white/10 pt-4 flex justify-between items-end">
                <span className="font-bold text-gray-400">Total Payable</span>
                <span className="text-4xl font-black">₹{totalAmount.toLocaleString()}</span>
              </div>
            </div>

            <div className="bg-white/5 p-4 rounded-2xl space-y-2">
              <div className="flex items-center gap-2 text-xs font-bold text-orange-400 uppercase tracking-widest">
                <CreditCard size={14} /> Wholesale Terms
              </div>
              <p className="text-[11px] text-gray-400 leading-relaxed">
                Order place hone ke baad hamari sales team 24 ghante mein aapko contact karegi. Payment direct bank transfer ya credit limit par depend karega.
              </p>
            </div>

            <Button 
              onClick={handlePlaceOrder} 
              disabled={loading}
              className="w-full h-14 bg-white text-black hover:bg-gray-200 rounded-2xl text-lg font-black shadow-lg transition-transform active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin" /> : "Confirm Bulk Order"}
            </Button>
          </CardContent>
        </Card>
      </div>

    </div>
  );
}
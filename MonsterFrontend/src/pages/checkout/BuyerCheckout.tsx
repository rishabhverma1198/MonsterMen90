import { useCart } from "@/context/CartContext";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import { supabase } from "@/lib/supabase"; // Database integration
import BackButton from "../../components/common/BackButton";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/hooks/use-toast"; // Professional notifications
import { Loader2 } from "lucide-react";

export default function BuyerCheckout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // ✅ 1. Empty Cart Guard
  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <Card className="p-10 border-dashed">
          <CardTitle className="text-2xl font-bold">Aapka cart khali hai</CardTitle>
          <p className="text-muted-foreground mt-2">Order karne ke liye products add karein.</p>
          <Button onClick={() => navigate("/buyer")} className="mt-6 rounded-xl">
            Shopping shuru karein
          </Button>
        </Card>
      </div>
    );
  }

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // ✅ 2. Place Order Logic (Supabase Integration)
  const placeOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!form.name || !form.phone || !form.address || !form.city || !form.pincode) {
      toast({ title: "Error", description: "Saari details bharna zaroori hai", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      // User ki id lene ke liye (Auth check)
      const { data: { user } } = await supabase.auth.getUser();

      const orderPayload = {
        user_id: user?.id || null, // Guest checkout support if needed
        customer_name: form.name,
        phone: form.phone,
        shipping_address: `${form.address}, ${form.city} - ${form.pincode}`,
        total_amount: totalAmount,
        status: 'pending',
        items: cart, // JSON data
        created_at: new Date().toISOString(),
      };

      // 3. Supabase table 'orders' mein data insert karna
      const { error } = await supabase.from("orders").insert([orderPayload]);

      if (error) throw error;

      toast({ title: "Order Success! 🎉", description: "Aapka order sahi se place ho gaya hai." });
      clearCart();
      navigate("/order-success");
    } catch (err: any) {
      toast({ title: "Order Failed", description: err.message, variant: "destructive" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6 flex items-center justify-between">
        <BackButton to="/buyer/cart" />
        <h1 className="text-3xl font-black tracking-tight">Checkout</h1>
      </div>

      <div className="grid lg:grid-cols-3 gap-10">
        
        {/* LEFT: Shipping Details Form */}
        <div className="lg:col-span-2 space-y-6">
          <Card className="border-none shadow-sm bg-gray-50/50">
            <CardHeader>
              <CardTitle>Shipping Details</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={placeOrder} className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2 space-y-2">
                  <Label>Poora Naam</Label>
                  <Input name="name" placeholder="Rahul Kumar" onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Mobile Number</Label>
                  <Input name="phone" placeholder="+91 XXXXX XXXXX" type="tel" onChange={handleChange} required />
                </div>
                <div className="space-y-2">
                  <Label>Pincode</Label>
                  <Input name="pincode" placeholder="110001" onChange={handleChange} required />
                </div>
                <div className="md:col-span-2 space-y-2">
                  <Label>Address (Ghar No, Gali, Area)</Label>
                  <textarea
                    name="address"
                    rows={3}
                    className="w-full border rounded-xl px-4 py-3 bg-background focus:ring-2 focus:ring-primary outline-none transition-all"
                    placeholder="H-No 123, Sector 4..."
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label>Shehar (City)</Label>
                  <Input name="city" placeholder="Delhi" onChange={handleChange} required />
                </div>
              </form>
            </CardContent>
          </Card>
        </div>

        {/* RIGHT: Order Summary Card */}
        <div className="lg:col-span-1">
          <Card className="sticky top-6 shadow-xl border-none ring-1 ring-black/5">
            <CardHeader className="bg-black text-white rounded-t-xl">
              <CardTitle className="text-xl">Order Summary</CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <div className="space-y-4 max-h-60 overflow-y-auto pr-2 custom-scrollbar">
                {cart.map((item) => (
                  <div key={item.id} className="flex justify-between items-center text-sm border-b pb-3 border-dashed">
                    <div>
                      <p className="font-bold">{item.name}</p>
                      <p className="text-xs text-muted-foreground">Qty: {item.quantity}</p>
                    </div>
                    <span className="font-semibold">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="mt-6 pt-4 space-y-2">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>₹{totalAmount}</span>
                </div>
                <div className="flex justify-between text-muted-foreground text-sm">
                  <span>Shipping</span>
                  <span className="text-green-600 font-medium">FREE</span>
                </div>
                <div className="border-t pt-4 flex justify-between items-center text-xl font-black">
                  <span>Total Amount</span>
                  <span className="text-primary">₹{totalAmount}</span>
                </div>
              </div>

              <Button
                onClick={placeOrder}
                disabled={isSubmitting}
                className="w-full mt-8 h-14 rounded-2xl text-lg font-bold shadow-lg transition-transform active:scale-95"
              >
                {isSubmitting ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Processing...</>
                ) : (
                  "Confirm & Place Order"
                )}
              </Button>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Label Component helper
function Label({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-bold uppercase tracking-wider text-gray-500 ml-1">{children}</label>;
}
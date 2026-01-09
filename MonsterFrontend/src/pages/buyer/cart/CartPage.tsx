import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Trash2, Plus, Minus, ShoppingBag } from "lucide-react";
import type { CartItem } from "@/types/cart-types";
import BackButton from "@/components/common/BackButton";

export default function CartPage() {
  const { cart, removeFromCart, upsertItem } = useCart();
  const [removingId, setRemovingId] = useState<number | null>(null);

  // 1. Optimized Calculations
  const { totalAmount, itemCount } = useMemo(() => {
    return cart.reduce(
      (acc, item) => ({
        totalAmount: acc.totalAmount + item.price, // totalPrice is already sum of sizeBreakup in your logic
        itemCount: acc.itemCount + item.quantity,
      }),
      { totalAmount: 0, itemCount: 0 }
    );
  }, [cart]);

  // 2. Simplified Quantity Logic
  const handleUpdateQuantity = (item: CartItem, delta: number) => {
    const newTotalQty = item.quantity + delta;

    if (newTotalQty <= 0) {
      handleRemove(item.id);
      return;
    }

    // Logic: Agar quantity update ho rahi hai, toh hum proportionate distribution 
    // ya simple adjustment kar sakte hain. Yahan hum first size ko adjust kar rahe hain.
    const sizeKeys = Object.keys(item.sizeBreakup);
    const firstSize = sizeKeys.find(s => item.sizeBreakup[s].qty > 0) || sizeKeys[0];

    const updatedItem: CartItem = {
      ...item,
      quantity: newTotalQty,
      price: (item.price / item.quantity) * newTotalQty, // Maintain price ratio
      sizeBreakup: {
        ...item.sizeBreakup,
        [firstSize]: {
          ...item.sizeBreakup[firstSize],
          qty: Math.max(0, item.sizeBreakup[firstSize].qty + delta),
        },
      },
    };

    upsertItem(updatedItem);
  };

  const handleRemove = (id: number) => {
    setRemovingId(id);
    setTimeout(() => removeFromCart(id), 200);
  };

  if (cart.length === 0) return <EmptyCartView />;

  return (
    <div className="min-h-screen bg-gray-50/50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <BackButton to="/buyer" className="mb-4" />
            <h1 className="text-3xl font-black text-gray-900">Cart ({itemCount})</h1>
          </div>
          <Button variant="ghost" className="text-red-500" onClick={() => cart.forEach(i => removeFromCart(i.id))}>
            Clear Cart
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* List of Items */}
          <div className="lg:col-span-2 space-y-4">
            {cart.map((item) => (
              <CartProductCard
                key={item.id}
                item={item}
                isRemoving={removingId === item.id}
                onUpdate={handleUpdateQuantity}
                onRemove={handleRemove}
              />
            ))}
          </div>

          {/* Summary Panel */}
          <div className="lg:col-span-1">
            <OrderSummary total={totalAmount} count={itemCount} />
          </div>
        </div>
      </div>
    </div>
  );
}

// --- Sub-Components ---

function CartProductCard({ item, isRemoving, onUpdate, onRemove }: any) {
  return (
    <Card className={`transition-all duration-300 ${isRemoving ? "opacity-0 scale-95" : "opacity-100"}`}>
      <CardContent className="p-4 flex gap-4">
        <img src={item.image || "/placeholder.png"} className="w-24 h-24 rounded-xl object-cover border" alt={item.name} />
        
        <div className="flex-1">
          <div className="flex justify-between">
            <h3 className="font-bold text-gray-900 text-lg">{item.name}</h3>
            <button onClick={() => onRemove(item.id)} className="text-gray-400 hover:text-red-500 transition">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>

          {/* Detailed Size Badge View */}
          <div className="flex flex-wrap gap-2 mt-2">
            {Object.entries(item.sizeBreakup).map(([size, details]: any) => (
              details.qty > 0 && (
                <span key={size} className="text-[10px] bg-gray-100 px-2 py-1 rounded-md font-medium">
                  {size}: {details.qty}
                </span>
              )
            ))}
          </div>

          <div className="flex justify-between items-end mt-4">
            <p className="text-xl font-black text-gray-900">₹{item.price.toLocaleString("en-IN")}</p>
            
            <div className="flex items-center border rounded-lg overflow-hidden bg-gray-50">
              <button onClick={() => onUpdate(item, -1)} className="p-2 hover:bg-gray-200 transition">
                <Minus className="w-4 h-4" />
              </button>
              <span className="w-10 text-center font-bold">{item.quantity}</span>
              <button onClick={() => onUpdate(item, 1)} className="p-2 hover:bg-gray-200 transition">
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function OrderSummary({ total, count }: { total: number; count: number }) {
  return (
    <Card className="sticky top-6 border-2 border-black/5 shadow-xl rounded-2xl">
      <CardContent className="p-6 space-y-4">
        <h2 className="text-xl font-bold">Bill Summary</h2>
        <div className="space-y-2 border-b pb-4">
          <div className="flex justify-between text-gray-600">
            <span>Items Total ({count})</span>
            <span>₹{total.toLocaleString("en-IN")}</span>
          </div>
          <div className="flex justify-between text-green-600 font-medium">
            <span>Delivery</span>
            <span>FREE</span>
          </div>
        </div>
        <div className="flex justify-between text-2xl font-black">
          <span>Total</span>
          <span>₹{total.toLocaleString("en-IN")}</span>
        </div>
        <Link to="/buyer/checkout" className="block">
          <Button className="w-full py-6 text-lg font-bold bg-black rounded-xl hover:bg-gray-800 transition-all">
            Proceed to Checkout
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
}

function EmptyCartView() {
  return (
    <div className="h-[80vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mb-6">
        <ShoppingBag className="w-12 h-12 text-gray-400" />
      </div>
      <h2 className="text-3xl font-black text-gray-900 mb-2">Cart Khali Hai!</h2>
      <p className="text-gray-500 mb-8 max-w-xs">Lagta hai aapne abhi tak kuch pasand nahi kiya. Chaliye kuch shopping karte hain!</p>
      <Link to="/buyer">
        <Button size="lg" className="rounded-full px-10">Start Shopping</Button>
      </Link>
    </div>
  );
}
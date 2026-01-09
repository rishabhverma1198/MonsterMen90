import { useState, useMemo } from "react";
import SizeQtyModal from "./SizeQtyModal";
import { useCart } from "@/context/CartContext";
import type { SizeBreakup } from "@/types/cart-types";
import { Badge } from "@/components/ui/badge";
import { ShoppingBag, CheckCircle2, Star } from "lucide-react";

type Product = {
  id: number;
  name: string;
  image: string;
  sizePrices: Record<string, number>;
  minQty: number;
  is_featured?: boolean;
};

export default function ProductCard({ product }: { product: Product }) {
  const { upsertItem } = useCart();
  const [open, setOpen] = useState(false);

  // Price formatting helper
  const formatINR = (price: number) => 
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(price);

  const { minPrice, maxPrice } = useMemo(() => {
    const prices = Object.values(product.sizePrices);
    return prices.length 
      ? { minPrice: Math.min(...prices), maxPrice: Math.max(...prices) }
      : { minPrice: 0, maxPrice: 0 };
  }, [product.sizePrices]);

  const handleConfirm = (sizes: SizeBreakup) => {
    if (!sizes || Object.keys(sizes).length === 0) return;

    const totalQty = Object.values(sizes).reduce((sum, item) => sum + item.qty, 0);
    const totalPrice = Object.values(sizes).reduce((sum, item) => sum + (item.qty * item.price), 0);

    upsertItem({
      id: product.id,
      name: product.name,
      image: product.image,
      quantity: totalQty,
      price: totalPrice,
      sizeBreakup: sizes,
      minQty: product.minQty,
    });
    setOpen(false);
  };

  return (
    <div className="group border rounded-2xl bg-white overflow-hidden shadow-sm hover:shadow-md transition-all flex flex-col h-full">
      <div className="relative aspect-[4/5] overflow-hidden bg-gray-100">
        <img src={product.image} alt={product.name} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
        {product.is_featured && (
          <Badge className="absolute top-3 left-3 bg-yellow-500 text-white border-none">
            <Star className="w-3 h-3 mr-1 fill-current" /> Featured
          </Badge>
        )}
      </div>

      <div className="p-4 flex flex-col flex-grow">
        <h3 className="font-bold text-gray-900 line-clamp-1 mb-1">{product.name}</h3>
        <p className="text-xs text-gray-500 mb-3">MOQ: <span className="font-bold text-gray-700">{product.minQty} pcs</span></p>
        
        <div className="text-sm font-semibold text-gray-800 mb-4">
          {minPrice === maxPrice ? formatINR(minPrice) : `${formatINR(minPrice)} - ${formatINR(maxPrice)}`}
        </div>

        <div className="space-y-1.5 mb-5">
          <div className="flex items-center text-[10px] font-bold text-green-600 uppercase tracking-tight">
            <CheckCircle2 className="w-3 h-3 mr-1" /> GST Invoice Available
          </div>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="mt-auto w-full bg-black text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-gray-800 active:scale-[0.98] transition-all"
        >
          <ShoppingBag className="w-4 h-4" /> Add to Cart
        </button>
      </div>

      <SizeQtyModal
        isOpen={open}
        prices={product.sizePrices}
        totalQty={product.minQty}
        onClose={() => setOpen(false)}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
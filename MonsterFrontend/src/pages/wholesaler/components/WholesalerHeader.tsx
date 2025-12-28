import { useNavigate } from "react-router-dom";
import { useCart } from "../../../hooks/useCart";
import type { CartItem } from "../../../types/cart-types";

export default function WholesalerHeader() {
  const navigate = useNavigate();
  const { cart } = useCart();

  // wholesaler cart count = total quantity
  const totalItems = cart.reduce(
    (sum: number, item: CartItem) => sum + item.quantity,
    0
  );

  return (
    <header className="w-full bg-white border-b">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        {/* BRAND */}
        <div
          className="flex items-center gap-3 cursor-pointer"
          onClick={() => navigate("/wholesaler")}
        >
          <div className="w-9 h-9 rounded-full bg-black text-white flex items-center justify-center font-bold">
            M
          </div>
          <span className="text-lg font-semibold tracking-wide">
            MonsterMen90
          </span>
        </div>

        {/* BULK CART */}
        <button
          type="button"
          onClick={() => navigate("/wholesaler/cart")}
          className="relative font-medium text-gray-700 hover:text-black transition"
        >
          Bulk Cart
          {totalItems > 0 && (
            <span className="absolute -top-2 -right-3 bg-black text-white text-xs px-2 py-0.5 rounded-full">
              {totalItems}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}
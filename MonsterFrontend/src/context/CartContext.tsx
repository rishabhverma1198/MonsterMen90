import {
  useState,
  useContext,
} from "react";
import type { ReactNode } from "react";
import type { CartItem, SizeBreakup } from "../types/cart-types";
import { CartContext } from "./CartContextBase";

/* =========================
   🛒 PROVIDER
========================= */
export function CartProvider({
  children,
}: {
  children: ReactNode;
}) {
  const [cart, setCart] = useState<CartItem[]>([]);

  /* ➕ ADD / UPDATE */
  const upsertItem = (item: CartItem) => {
    setCart(prev => {
      const totalQty = Object.values(item.sizeBreakup)
        .reduce((s, v) => s + v.qty, 0);

      // auto remove if zero
      if (totalQty <= 0) {
        return prev.filter(p => p.id !== item.id);
      }

      const index = prev.findIndex(p => p.id === item.id);

      if (index >= 0) {
        const updated = [...prev];
        updated[index] = { ...item, quantity: totalQty };
        return updated;
      }

      return [...prev, { ...item, quantity: totalQty }];
    });
  };

  const removeFromCart = (id: number) => {
    setCart(prev => prev.filter(i => i.id !== id));
  };

  const clearCart = () => setCart([]);

  return (
    <CartContext.Provider
      value={{
        cart,
        upsertItem,
        removeFromCart,
        clearCart,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

/* =========================
   🪝 HOOK
========================= */
export function useCart() {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
}

// Re-export types for convenience
export type { SizeBreakup };

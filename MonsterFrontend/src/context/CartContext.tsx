import {
  useState,
} from "react";
import type { ReactNode } from "react";
import type { CartItem } from "../types/cart-types";
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
    console.log("CartContext: Upserting item:", item.name);
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

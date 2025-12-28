import { createContext } from "react";
import type { CartItem } from "../types/cart-types";

type CartContextType = {
  cart: CartItem[];
  upsertItem: (item: CartItem) => void;
  removeFromCart: (id: number) => void;
  clearCart: () => void;
};

export const CartContext = createContext<CartContextType | null>(null);
/* =========================
   📦 TYPES
========================= */
export type SizeBreakup = {
  [size: string]: {
    qty: number;
    price: number;
  };
};

export interface CartItem {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  sizeBreakup: SizeBreakup;
  minQty?: number;
}
import { useState, useMemo } from "react";
import SizeQtyModal from "./SizeQtyModal";
import { useCart } from "../../hooks/useCart";
import type { SizeBreakup } from "../../types/cart-types";

type Product = {
  id: number;
  name: string;
  image: string;
  sizePrices: Record<string, number>;
  minQty: number;
};

const ADD_TO_CART_TEXT = "Add to Cart";
const GST_INVOICE_TEXT = "GST Invoice Available";
const BULK_DISCOUNT_TEXT = "Bulk Discount Eligible";

export default function ProductCard({
  product,
}: {
  product: Product;
}) {
  const { upsertItem } = useCart();

  const [open, setOpen] = useState(false);

  // Memoize price calculations for performance
  const { minPrice, maxPrice } = useMemo(() => {
    const priceValues = Object.values(product.sizePrices);
    if (priceValues.length === 0) {
      return { minPrice: 0, maxPrice: 0 };
    }
    return {
      minPrice: Math.min(...priceValues),
      maxPrice: Math.max(...priceValues),
    };
  }, [product.sizePrices]);

  const handleConfirm = (sizes: SizeBreakup) => {
    // Validate sizes before processing
    if (!sizes || Object.keys(sizes).length === 0) {
      console.warn("No sizes selected for product:", product.name);
      return;
    }

    try {
      const totalQty = Object.values(sizes).reduce(
        (sum: number, item: { qty: number; price: number }) => sum + item.qty,
        0
      );

      const totalPrice = Object.values(sizes).reduce(
        (sum: number, item: { qty: number; price: number }) => sum + item.qty * item.price,
        0
      );

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
    } catch (error) {
      console.error("Error adding item to cart:", error);
      // Optionally, show a toast or alert to the user
    }
  };

  const handleOpenModal = () => setOpen(true);
  const handleCloseModal = () => setOpen(false);

  return (
    <div className="border rounded-2xl bg-white overflow-hidden shadow-sm">
      {/* Product Image */}
      <img
        src={product.image}
        alt={`Image of ${product.name}`}
        className="h-56 w-full object-cover"
      />

      {/* Product Information */}
      <div className="p-4 space-y-3">
        <h3 className="font-semibold text-lg">
          {product.name}
        </h3>

        <div className="text-sm text-gray-600">
          MOQ: <b>{product.minQty} pcs</b>
        </div>

        <div className="text-sm text-gray-700">
          Price Range:{" "}
          <b>
            ₹{minPrice} – ₹{maxPrice}
          </b>
        </div>

        {/* Trust Indicators */}
        <div className="text-xs text-gray-500 space-y-1">
          <p>✔ {GST_INVOICE_TEXT}</p>
          <p>✔ {BULK_DISCOUNT_TEXT}</p>
        </div>

        {/* Action Button */}
        <button
          type="button"
          onClick={handleOpenModal}
          className="w-full mt-2 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
          aria-label={`Add ${product.name} to cart`}
        >
          {ADD_TO_CART_TEXT}
        </button>
      </div>

      {/* Size and Quantity Modal */}
      <SizeQtyModal
        isOpen={open}
        prices={product.sizePrices}
        totalQty={product.minQty}
        onClose={handleCloseModal}
        onConfirm={handleConfirm}
      />
    </div>
  );
}
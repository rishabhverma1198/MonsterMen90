import { useState } from "react";
import type { SizeBreakup } from "../../context/CartContext";

type Props = {
  isOpen: boolean;
  totalQty: number;
  prices: Record<string, number>;
  onClose: () => void;
  onConfirm: (data: SizeBreakup) => void;
};

export default function SizeQtyModal({
  isOpen,
  totalQty,
  prices,
  onClose,
  onConfirm,
}: Props) {
  const [sizes, setSizes] = useState<Record<string, number>>(() => {
    const init: Record<string, number> = {};
    Object.keys(prices).forEach((s) => (init[s] = 0));
    return init;
  });

  if (!isOpen) return null;

  const usedQty = Object.values(sizes).reduce((s, v) => s + v, 0);

  const updateQty = (size: string, qty: number) => {
    setSizes((prev) => ({
      ...prev,
      [size]: Math.max(0, qty),
    }));
  };

  const confirm = () => {
    if (usedQty !== totalQty) return;

    const finalData: SizeBreakup = {};
    Object.entries(prices).forEach(([size, price]) => {
      finalData[size] = {
        price,
        qty: sizes[size] || 0,
      };
    });

    onConfirm(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[420px]">
        <h3 className="text-lg font-semibold">Select Size Quantity</h3>

        <p className="text-sm text-gray-500 mb-4">Total Required: {totalQty}</p>

        <div className="space-y-3">
          {Object.entries(prices).map(([size, price]) => (
            <div key={size} className="flex justify-between items-center">
              <span>{size} – ₹{price}</span>

              <input
                type="number"
                min={0}
                className="w-20 border rounded-lg px-2 py-1 text-center"
                value={sizes[size] || ""}
                onChange={(e) => updateQty(size, Number(e.target.value))}
                aria-label={`Quantity for ${size}`}
              />
            </div>
          ))}
        </div>

        <div className="mt-4 text-sm">
          Selected:{" "}
          <span
            className={
              usedQty === totalQty ? "text-green-600" : "text-red-500"
            }
          >
            {usedQty}/{totalQty}
          </span>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button type="button" onClick={onClose} className="px-4 py-2 border rounded-lg">
            Cancel
          </button>

          <button
            type="button"
            onClick={confirm}
            disabled={usedQty !== totalQty}
            className="px-5 py-2 bg-black text-white rounded-lg disabled:opacity-40"
          >
            Confirm
          </button>
        </div>
      </div>
    </div>
  );
}
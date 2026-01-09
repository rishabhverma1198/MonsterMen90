import { useState, useEffect } from "react";
import type { SizeBreakup } from "../../types/cart-types";
import { X, Plus, Minus, AlertCircle } from "lucide-react";

type Props = {
  isOpen: boolean;
  totalQty: number; // This acts as MOQ (Minimum Order Quantity)
  prices: Record<string, number>;
  onClose: () => void;
  onConfirm: (data: SizeBreakup) => void;
};

export default function SizeQtyModal({ isOpen, totalQty, prices, onClose, onConfirm }: Props) {
  const [sizes, setSizes] = useState<Record<string, number>>({});

  // Reset state when modal opens
  useEffect(() => {
    if (isOpen) {
      const init: Record<string, number> = {};
      Object.keys(prices).forEach((s) => (init[s] = 0));
      setSizes(init);
    }
  }, [isOpen, prices]);

  if (!isOpen) return null;

  const currentTotal = Object.values(sizes).reduce((sum, val) => sum + val, 0);
  const isTargetMet = currentTotal >= totalQty;

  const updateQty = (size: string, delta: number) => {
    setSizes((prev) => ({
      ...prev,
      [size]: Math.max(0, (prev[size] || 0) + delta),
    }));
  };

  const handleConfirm = () => {
    if (!isTargetMet) return;

    const finalData: SizeBreakup = {};
    Object.entries(sizes).forEach(([size, qty]) => {
      if (qty > 0) {
        finalData[size] = {
          price: prices[size],
          qty: qty,
        };
      }
    });

    onConfirm(finalData);
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-[100] p-4">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header */}
        <div className="px-6 py-4 border-b flex justify-between items-center bg-gray-50">
          <div>
            <h3 className="text-xl font-bold text-gray-900">Select Quantities</h3>
            <p className="text-xs text-gray-500 mt-0.5">Mix and match sizes to meet MOQ</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-200 rounded-full transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6">
          {/* MOQ Status Tracker */}
          <div className={`mb-6 p-4 rounded-2xl flex items-center justify-between ${isTargetMet ? 'bg-green-50 border border-green-200' : 'bg-orange-50 border border-orange-200'}`}>
            <div>
              <p className="text-sm font-medium text-gray-700">Total Selected</p>
              <p className={`text-2xl font-black ${isTargetMet ? 'text-green-600' : 'text-orange-600'}`}>
                {currentTotal} <span className="text-sm font-normal text-gray-500">/ {totalQty} min</span>
              </p>
            </div>
            {!isTargetMet && (
              <div className="flex items-center text-orange-700 text-xs font-bold animate-pulse">
                <AlertCircle className="w-4 h-4 mr-1" /> Add {totalQty - currentTotal} more
              </div>
            )}
          </div>

          {/* Sizes List */}
          <div className="space-y-4 max-h-[40vh] overflow-y-auto pr-2 custom-scrollbar">
            {Object.entries(prices).map(([size, price]) => (
              <div key={size} className="flex items-center justify-between p-3 border rounded-xl hover:border-gray-400 transition">
                <div>
                  <span className="block font-bold text-gray-800">{size}</span>
                  <span className="text-sm text-gray-500">₹{price} / pc</span>
                </div>

                <div className="flex items-center gap-3">
                  <button 
                    onClick={() => updateQty(size, -1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full border border-gray-300 hover:bg-gray-100 active:scale-90 transition"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  
                  <input
                    type="number"
                    readOnly
                    className="w-12 text-center font-bold text-lg bg-transparent"
                    value={sizes[size]}
                  />

                  <button 
                    onClick={() => updateQty(size, 1)}
                    className="w-8 h-8 flex items-center justify-center rounded-full bg-black text-white hover:bg-gray-800 active:scale-90 transition"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="mt-8 flex gap-3">
            <button 
              onClick={onClose}
              className="flex-1 px-4 py-3 border border-gray-300 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition"
            >
              Cancel
            </button>
            <button
              onClick={handleConfirm}
              disabled={!isTargetMet}
              className="flex-1 px-4 py-3 bg-black text-white rounded-xl font-bold disabled:opacity-30 disabled:cursor-not-allowed hover:bg-gray-900 transition shadow-lg shadow-black/10"
            >
              Confirm & Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
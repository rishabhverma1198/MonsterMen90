interface Props {
  isOpen: boolean;
  sizes: string[];
  selectedSize?: string;
  onClose: () => void;
  onConfirm: (size: string) => void;
}

export default function SingleSizeModal({
  isOpen,
  sizes,
  selectedSize,
  onClose,
  onConfirm,
}: Props) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 w-[360px] animate-slideDown">
        <h3 className="text-lg font-semibold mb-4">Select Size</h3>

        <div className="flex flex-wrap gap-3">
          {sizes.map((size) => (
            <button
              key={size}
              onClick={() => onConfirm(size)}
              className={`px-4 py-2 border rounded-lg text-sm ${
                selectedSize === size
                  ? "bg-black text-white"
                  : "hover:bg-gray-100"
              }`}
            >
              {size}
            </button>
          ))}
        </div>

        <div className="mt-6 text-right">
          <button
            onClick={onClose}
            className="px-4 py-2 border rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
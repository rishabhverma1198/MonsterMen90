import { useCart } from "../../../hooks/useCart";
import { Link } from "react-router-dom";
import BackButton from "../../../components/common/BackButton";

export default function CartPage() {
  const { cart, removeFromCart } = useCart();

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        Your cart is empty 🛒
      </div>
    );
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      <div className="mb-6">
        <BackButton to="/buyer" />
      </div>
      {cart.map(item => (
        <div
          key={item.id}
          className="border rounded-xl p-4 flex gap-4"
        >
          <img
            src={item.image}
            alt={item.name}
            className="w-24 h-24 object-cover rounded"
          />

          <div className="flex-1">
            <h3 className="font-semibold">{item.name}</h3>

            <div className="text-sm text-gray-600">
              {Object.entries(item.sizeBreakup)
                .filter(([, v]) => v.qty > 0)
                .map(([s, v]) => `${s} (${v.qty})`)
                .join(", ")}
            </div>

            <p className="mt-1 font-medium">
              ₹ {item.price * item.quantity}
            </p>
          </div>

          <button
            onClick={() => removeFromCart(item.id)}
            className="text-red-500"
          >
            Remove
          </button>
        </div>
      ))}

      <div className="border-t pt-6 flex justify-between items-center">
        <div className="text-lg font-semibold">
          Total: ₹ {totalAmount}
        </div>

        <Link
          to="/buyer/checkout"
          className="bg-black text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-900"
        >
          Proceed to Checkout
        </Link>
      </div>
    </div>
  );
}
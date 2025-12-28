import { useNavigate } from "react-router-dom";
import { useCart } from "../../hooks/useCart";

export default function WholesellerCheckout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  // 💰 total amount (size-wise calculation)
  const totalAmount = cart.reduce((sum, item) => {
    const itemTotal = Object.values(item.sizeBreakup).reduce(
      (s, v) => s + v.qty * v.price,
      0
    );
    return sum + itemTotal;
  }, 0);

  const placeOrder = () => {
    // 👉 future backend API call here
    clearCart();
    alert("Order placed successfully!");
    navigate("/wholeseller");
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold">Checkout</h1>
      <p className="text-gray-600 mt-1">
        Confirm your bulk order
      </p>

      <div className="mt-8 space-y-4">
        {cart.map((item) => {
          const itemTotal = Object.values(
            item.sizeBreakup
          ).reduce(
            (s, v) => s + v.qty * v.price,
            0
          );

          return (
            <div
              key={item.id}
              className="border rounded-xl p-4 bg-white"
            >
              <div className="flex justify-between">
                <span className="font-medium">
                  {item.name} ({item.quantity} pcs)
                </span>
                <span className="font-semibold">
                  ₹ {itemTotal}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      <div className="mt-10 border-t pt-6 flex justify-between items-center">
        <p className="text-xl font-bold">
          Payable Amount: ₹ {totalAmount}
        </p>

        <button
          onClick={placeOrder}
          className="px-8 py-3 bg-black text-white rounded-xl font-semibold"
        >
          Place Order
        </button>
      </div>
    </div>
  );
}
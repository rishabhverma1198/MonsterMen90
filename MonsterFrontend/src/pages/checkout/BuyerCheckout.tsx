import { useCart } from "../../hooks/useCart";
import { useNavigate } from "react-router-dom";
import { useState } from "react";
import BackButton from "../../components/common/BackButton";

export default function BuyerCheckout() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    name: "",
    phone: "",
    address: "",
    city: "",
    pincode: "",
  });

  // ✅ EMPTY CART GUARD (MOST IMPORTANT)
  if (!cart || cart.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-6 py-20 text-center">
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-gray-600 mt-2">
          Please add products before checkout
        </p>

        <button
          onClick={() => navigate("/buyer")}
          className="mt-6 bg-black text-white px-6 py-3 rounded-xl"
        >
          Go to Buyer Dashboard
        </button>
      </div>
    );
  }

  const totalAmount = cart.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

 const placeOrder = () => {
  if (!form.name || !form.phone || !form.address) {
    alert("Please fill all details");
    return;
  }

  const existingOrders = JSON.parse(localStorage.getItem("orders") || "[]");

  const newOrder = {
    items: cart,
    total: totalAmount,
    date: new Date().toISOString(),
  };

  localStorage.setItem(
    "orders",
    JSON.stringify([...existingOrders, newOrder])
  );

  clearCart();
  navigate("/order-success");
};

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6">
        <BackButton to="/buyer/cart" />
      </div>
      <div className="grid md:grid-cols-2 gap-10">
      
      {/* LEFT: Buyer Details */}
      <div>
        <h2 className="text-2xl font-bold mb-6">
          Shipping Details
        </h2>

        <div className="space-y-4">
          <input
            name="name"
            placeholder="Full Name"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <input
            name="phone"
            placeholder="Phone Number"
            className="w-full border rounded-xl px-4 py-3"
            onChange={handleChange}
          />

          <textarea
            name="address"
            placeholder="Full Address"
            className="w-full border rounded-xl px-4 py-3"
            rows={3}
            onChange={handleChange}
          />

          <div className="grid grid-cols-2 gap-4">
            <input
              name="city"
              placeholder="City"
              className="border rounded-xl px-4 py-3"
              onChange={handleChange}
            />

            <input
              name="pincode"
              placeholder="Pincode"
              className="border rounded-xl px-4 py-3"
              onChange={handleChange}
            />
          </div>
        </div>
      </div>

      {/* RIGHT: Order Summary */}
      <div className="bg-gray-50 rounded-2xl p-6">
        <h2 className="text-2xl font-bold mb-6">
          Order Summary
        </h2>

        <div className="space-y-4">
          {cart.map((item) => (
            <div
              key={item.id}
              className="flex justify-between text-sm"
            >
              <span>
                {item.name} × {item.quantity}
              </span>
              <span>
                ₹ {item.price * item.quantity}
              </span>
            </div>
          ))}
        </div>

        <div className="border-t mt-6 pt-4 flex justify-between font-semibold">
          <span>Total</span>
          <span>₹ {totalAmount}</span>
        </div>

        <button
          onClick={placeOrder}
          className="w-full mt-6 bg-black text-white py-4 rounded-xl font-semibold hover:bg-gray-900 transition"
        >
          Place Order
        </button>
      </div>
      </div>
    </div>
  );
}
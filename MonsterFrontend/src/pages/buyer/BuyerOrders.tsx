import BackButton from "../../components/common/BackButton";

export default function BuyerOrders() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6">
        <BackButton to="/buyer" />
      </div>
      <h1 className="text-3xl font-bold">My Orders</h1>

      {orders.length === 0 ? (
        <p className="mt-6 text-gray-500">No orders yet</p>
      ) : (
        <div className="mt-8 space-y-6">
          {orders.map((order: any, index: number) => (
            <div key={index} className="border rounded-xl p-4">
              <p className="font-semibold">Order #{index + 1}</p>
              <p>Total: ₹ {order.total}</p>

              <ul className="mt-2 text-sm text-gray-600">
                {order.items.map((item: any) => (
                  <li key={item.id}>
                    {item.name} × {item.quantity}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
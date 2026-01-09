import BackButton from "../../components/common/BackButton";

export default function BuyerOrders() {
  const orders = JSON.parse(localStorage.getItem("orders") || "[]");

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString('en-IN', {
      day: 'numeric', month: 'short', year: 'numeric'
    });
  };

  return (
    <div className="max-w-7xl mx-auto px-6 py-12">
      <div className="mb-6">
        <BackButton to="/buyer" />
      </div>
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">My Orders</h1>
        <span className="text-gray-500">{orders.length} orders found</span>
      </div>

      {orders.length === 0 ? (
        <div className="text-center py-20 bg-gray-50 rounded-2xl border-2 border-dashed">
          <p className="text-gray-500 text-lg">Aapne abhi tak koi order nahi kiya hai.</p>
        </div>
      ) : (
        <div className="space-y-6">
          {orders.reverse().map((order: any, index: number) => (
            <div key={index} className="bg-white border rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
              <div className="bg-gray-50 px-6 py-4 border-b flex flex-wrap justify-between gap-4">
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Order ID</p>
                  <p className="font-medium text-sm">#ORD-{Math.random().toString(36).substr(2, 9).toUpperCase()}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Placed On</p>
                  <p className="font-medium text-sm">{order.date || formatDate(new Date().toISOString())}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-500 uppercase font-bold">Total Amount</p>
                  <p className="font-bold text-sm text-green-600">₹ {order.total}</p>
                </div>
                <div>
                  <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-xs font-bold">Processing</span>
                </div>
              </div>

              <div className="p-6">
                <ul className="divide-y">
                  {order.items.map((item: any, idx: number) => (
                    <li key={idx} className="py-3 flex justify-between items-center">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-gray-100 rounded object-cover overflow-hidden">
                           {item.image && <img src={item.image} alt={item.name} className="w-full h-full object-cover"/>}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{item.name}</p>
                          <p className="text-xs text-gray-500">Qty: {item.quantity}</p>
                        </div>
                      </div>
                      <p className="text-sm font-semibold">₹ {item.price * item.quantity}</p>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
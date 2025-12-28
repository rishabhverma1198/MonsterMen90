import { supabase } from "../../supabaseClient";
import BackButton from "../../components/common/BackButton";
import type { SizeBreakup } from "../../types/cart-types";
import { useCart } from "../../hooks/useCart";

/* =========================
   🔐 ADMIN STOCK API
========================= */
const fetchAdminStock = async (
  productId: number,
  size: string
): Promise<number> => {
  try {
    // @ts-ignore
    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
    if (!supabaseUrl) {
      throw new Error("Supabase URL not found");
    }
    const functionUrl = `${supabaseUrl}/functions/v1/stock-management?pid=${productId}&size=${size}`;

    const {
      data: { session },
    } = await supabase.auth.getSession();
    const token = session?.access_token;

    const headers = {
      // @ts-ignore
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    };
    if (token) {
      // @ts-ignore
      headers["Authorization"] = `Bearer ${token}`;
    }

    const res = await fetch(functionUrl, {
      headers: headers,
    });

    if (!res.ok) throw new Error("Stock fetch failed");

    const data: { available?: number } = await res.json();
    return Number(data.available ?? 0);
  } catch (e) {
    console.error(e);
    return 0;
  }
};

const DEFAULT_WHOLESELLER_MOQ = 50;

interface CartItem {
  id: number;
  name: string;
  image: string;
  quantity: number;
  price: number;
  sizeBreakup: SizeBreakup;
  minQty?: number;
}

export default function WholesellerCartPage() {
  const { cart, clearCart } = useCart();
  const navigate = useNavigate();

  const [validated, setValidated] = useState(true);
  const [errorMsg, setErrorMsg] = useState("");

  /* =========================
     🔁 VALIDATION
  ========================= */
  useEffect(() => {
    let cancelled = false;

    const validateCart = async () => {
      setValidated(true);
      setErrorMsg("");

      let totalQty = 0;

      for (const item of cart as CartItem[]) {
        const productMOQ = item.minQty ?? DEFAULT_WHOLESELLER_MOQ;
        let productQty = 0;

        for (const [size, data] of Object.entries(item.sizeBreakup)) {
          if (data.qty <= 0) continue;

          productQty += data.qty;
          totalQty += data.qty;

          const stock = await fetchAdminStock(item.id, size);

          if (data.qty > stock) {
            if (!cancelled) {
              setValidated(false);
              setErrorMsg(
                `Insufficient stock for ${item.name} (${size})`
              );
            }
            return;
          }
        }

        if (productQty < productMOQ) {
          if (!cancelled) {
            setValidated(false);
            setErrorMsg(
              `${item.name} requires minimum ${productMOQ} units`
            );
          }
          return;
        }
      }

      if (totalQty < DEFAULT_WHOLESELLER_MOQ) {
        if (!cancelled) {
          setValidated(false);
          setErrorMsg(
            `Minimum bulk order quantity is ${DEFAULT_WHOLESELLER_MOQ}`
          );
        }
        return;
      }
    };

    if (cart.length > 0) {
      validateCart();
    }

    return () => {
      cancelled = true;
    };
  }, [cart]);

  /* =========================
     🛒 EMPTY CART
  ========================= */
  if (cart.length === 0) {
    return (
      <div className="max-w-5xl mx-auto px-6 py-20 text-center">
        <BackButton to="/wholeseller" className="mb-4" />
        <h2 className="text-2xl font-semibold">
          Bulk cart is empty
        </h2>
        <p className="text-gray-500 mt-2">
          Add products to place a bulk order
        </p>
      </div>
    );
  }

  /* =========================
     💰 TOTAL
  ========================= */
  const grandTotal = (cart as CartItem[]).reduce((sum, item) => {
return (
  sum +
  Object.values(item.sizeBreakup).reduce(
    (s: number, v: { qty: number; price: number }) => s + v.qty * v.price,
    0
  )
);
}, 0);

  return (
    <div className="max-w-6xl mx-auto px-6 py-10">
      <BackButton to="/wholeseller" className="mb-6" />
      <h1 className="text-3xl font-bold mb-8">
        Wholeseller Bulk Cart
      </h1>

      <div className="space-y-6">
        {(cart as CartItem[]).map((item) => {
          const productMOQ =
            item.minQty ?? DEFAULT_WHOLESELLER_MOQ;

          const productTotal = Object.values(
            item.sizeBreakup
          ).reduce((s: number, v: { qty: number; price: number }) => s + v.qty * v.price, 0);

          return (
            <div
              key={item.id}
              className="border rounded-2xl p-6 bg-white"
            >
              <div className="flex justify-between items-center mb-2">
                <h3 className="text-lg font-semibold">
                  {item.name}
                </h3>
                <span className="font-semibold">
                  ₹{productTotal}
                </span>
              </div>

              <p className="text-xs text-gray-500 mb-3">
                Minimum Order Quantity: {productMOQ}
              </p>

              <div className="space-y-2 text-sm">
                {Object.entries(item.sizeBreakup)
                  .filter(([, d]) => d.qty > 0)
                  .map(([size, d]) => (
                    <div
                      key={size}
                      className="flex justify-between text-gray-700"
                    >
                      <span>
                        {size} — {d.qty} × ₹{d.price}
                      </span>
                      <span>₹{d.qty * d.price}</span>
                    </div>
                  ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* SUMMARY */}
      <div className="mt-10 border-t pt-6 flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
          <p className="text-xl font-bold">
            Grand Total: ₹{grandTotal}
          </p>

          {!validated && (
            <p className="text-red-600 text-sm mt-2">
              {errorMsg}
            </p>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={clearCart}
            className="px-6 py-3 border rounded-xl"
          >
            Clear Cart
          </button>

          <button
            disabled={!validated}
            onClick={() =>
              navigate("/wholeseller/checkout")
            }
            className={`px-8 py-3 rounded-xl text-white font-semibold ${
              validated
                ? "bg-black"
                : "bg-gray-400 cursor-not-allowed"
            }`}
          >
            Proceed to Checkout
          </button>
        </div>
      </div>
    </div>
  );
}
import { useState } from "react";
import { supabase } from "../../supabaseClient";

const AddProduct = () => {
  const [loading, setLoading] = useState<boolean>(false);

  const addProduct = async (): Promise<void> => {
    setLoading(true);

    const { error } = await supabase
      .from("products")
      .insert([
        {
          name: "Final Admin Test Product",
          price: 999,
          stock_quantity: 10,
          description: "RLS + automation test"
        }
      ]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("❌ " + error.message);
    } else {
      alert("✅ Product inserted successfully");
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Admin – Add Product Test (TSX)</h2>

      <button onClick={addProduct} disabled={loading}>
        {loading ? "Saving..." : "Add Product"}
      </button>
    </div>
  );
};

export default AddProduct;
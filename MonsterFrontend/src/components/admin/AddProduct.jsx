import { useState } from "react";
import { supabase } from "../../lib/supabase";

export default function AddProduct() {
  const [loading, setLoading] = useState(false);
  const [productData, setProductData] = useState({
    name: "",
    price: "",
    stock_quantity: "",
    description: ""
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setProductData(prev => ({ ...prev, [name]: value }));
  };

  const addProduct = async () => {
    if (!productData.name || !productData.price) {
      alert("Please fill in required fields");
      return;
    }

    setLoading(true);

    const { error } = await supabase
      .from("products")
      .insert([{
        name: productData.name,
        price: parseFloat(productData.price),
        stock_quantity: productData.stock_quantity ? parseInt(productData.stock_quantity) : 0,
        description: productData.description || ""
      }]);

    setLoading(false);

    if (error) {
      console.error(error);
      alert("❌ " + error.message);
    } else {
      alert("✅ Product inserted successfully");
      setProductData({ name: "", price: "", stock_quantity: "", description: "" });
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>Add New Product</h2>
      <div style={{ marginBottom: 10 }}>
        <input
          name="name"
          placeholder="Product Name *"
          value={productData.name}
          onChange={handleInputChange}
          style={{ padding: 8, marginRight: 10 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          name="price"
          type="number"
          placeholder="Price *"
          value={productData.price}
          onChange={handleInputChange}
          style={{ padding: 8, marginRight: 10 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <input
          name="stock_quantity"
          type="number"
          placeholder="Stock Quantity"
          value={productData.stock_quantity}
          onChange={handleInputChange}
          style={{ padding: 8, marginRight: 10 }}
        />
      </div>
      <div style={{ marginBottom: 10 }}>
        <textarea
          name="description"
          placeholder="Description"
          value={productData.description}
          onChange={handleInputChange}
          style={{ padding: 8, width: 200, height: 60 }}
        />
      </div>
      <button onClick={addProduct} disabled={loading} style={{ padding: "10px 20px", cursor: "pointer" }}>
        {loading ? "Saving..." : "Add Product"}
      </button>
    </div>
  );
}

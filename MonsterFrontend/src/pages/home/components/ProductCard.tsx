// import { useState } from "react";
// import { useCart } from "../../../context/CartContext";

// type SizeBreakup = {
//   [size: string]: {
//     qty: number;
//     price: number;
//   };
// };

// interface Product {
//   id: number;
//   name: string;
//   image: string;
//   basePrice: number;
//   sizePrices: Record<string, number>;
// }

// export default function ProductCard({
//   product,
// }: {
//   product: Product;
// }) {
//   const { addToCart } = useCart();

//   const [showSelector, setShowSelector] = useState(false);
//   const [sizes, setSizes] = useState<SizeBreakup>({});
//   const [confirmed, setConfirmed] = useState(false);

//   // initialize sizes on first open
//   const openSelector = () => {
//     if (Object.keys(sizes).length === 0) {
//       const initial: SizeBreakup = {};
//       Object.entries(product.sizePrices).forEach(
//         ([size, price]) => {
//           initial[size] = { qty: 0, price };
//         }
//       );
//       setSizes(initial);
//     }
//     setShowSelector(true);
//   };

//   const updateQty = (size: string, qty: number) => {
//     setSizes((prev) => ({
//       ...prev,
//       [size]: {
//         ...prev[size],
//         qty: Math.max(0, qty),
//       },
//     }));
//   };

//   const confirmSelection = () => {
//     const totalQty = Object.values(sizes).reduce(
//       (s, v) => s + v.qty,
//       0
//     );

//     if (totalQty === 0) {
//       alert("Please select at least one size");
//       return;
//     }

//     const totalPrice = Object.values(sizes).reduce(
//       (s, v) => s + v.qty * v.price,
//       0
//     );

//     addToCart({
//       id: product.id,
//       name: product.name,
//       image: product.image,
//       quantity: totalQty,
//       price: totalPrice,
//       sizeBreakup: sizes,
//     });

//     setConfirmed(true);
//     setShowSelector(false);
//   };

//   return (
//     <div className="border rounded-2xl bg-white overflow-hidden">
//       {/* IMAGE */}
//       <img
//         src={product.image}
//         alt={product.name}
//         className="h-56 w-full object-cover"
//       />

//       {/* INFO */}
//       <div className="p-4">
//         <h3 className="font-semibold text-lg">
//           {product.name}
//         </h3>

//         <p className="text-gray-600 mt-1">
//           Starting ₹{product.basePrice}
//         </p>

//         {/* ADD TO CART */}
//         <button
//           onClick={openSelector}
//           className="w-full mt-4 bg-black text-white py-3 rounded-xl font-semibold hover:bg-gray-900 transition"
//         >
//           Add to Cart
//         </button>

//         {/* SLIDE DOWN SIZE SELECTOR */}
//         {showSelector && (
//           <div className="mt-4 border-t pt-4 animate-slideDown">
//             <p className="text-sm font-medium mb-2">
//               Select Size & Quantity
//             </p>

//             <div className="space-y-2">
//               {Object.entries(sizes).map(
//                 ([size, data]) => (
//                   <div
//                     key={size}
//                     className="flex justify-between items-center"
//                   >
//                     <span className="text-sm">
//                       {size} – ₹{data.price}
//                     </span>

//                     <input
//                       type="number"
//                       min={0}
//                       className="w-16 border rounded-lg px-2 py-1 text-sm"
//                       value={data.qty}
//                       onChange={(e) =>
//                         updateQty(
//                           size,
//                           Number(e.target.value)
//                         )
//                       }
//                     />
//                   </div>
//                 )
//               )}
//             </div>

//             <button
//               onClick={confirmSelection}
//               className="w-full mt-4 bg-black text-white py-2 rounded-lg text-sm font-semibold"
//             >
//               Confirm Selection
//             </button>
//           </div>
//         )}

//         {/* CONFIRMED SUMMARY */}
//         {confirmed && (
//           <div className="mt-4 text-sm text-green-600 font-medium">
//             Selected:&nbsp;
//             {Object.entries(sizes)
//               .filter(([, v]) => v.qty > 0)
//               .map(
//                 ([size, v]) =>
//                   `${size} × ${v.qty}`
//               )
//               .join(", ")}
//           </div>
//         )}
//       </div>
//     </div>
//   );
// }
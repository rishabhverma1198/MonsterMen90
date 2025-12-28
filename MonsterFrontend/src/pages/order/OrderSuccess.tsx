import { useNavigate } from "react-router-dom";
import BackButton from "../../components/common/BackButton";

export default function OrderSuccess() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center text-center px-6">
      <div className="mb-6">
        <BackButton to="/buyer" />
      </div>
      <h1 className="text-4xl font-bold text-green-600">
        🎉 Order Placed Successfully
      </h1>

      <p className="mt-4 text-gray-600">
        Thank you for shopping with MonsterMen90
      </p>

      <button
        onClick={() => navigate("/buyer")}
        className="mt-8 px-8 py-3 bg-black text-white rounded-xl"
      >
        Continue Shopping
      </button>
    </div>
  );
}
import { Navigate, useLocation } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  allowed: "buyer" | "wholesaler"; // Corrected spelling 'wholesaler' to match other files
};

export default function ProtectedRoute({ children, allowed }: Props) {
  const location = useLocation();
  
  // 1. Token check zaroori hai (sirf userType se security nahi milti)
  const token = localStorage.getItem("auth_token");
  const userType = localStorage.getItem("userType");

  // 2. Unauthenticated user logic
  if (!token || !userType) {
    // Redirecting to login and saving the current path to return later
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // 3. Permission check logic
  // Admin usually has access to everything
  const hasAccess = userType === allowed || userType === "admin";

  if (!hasAccess) {
    // Agar user buyer hai aur wholesaler page access kar raha hai
    const redirectPath = userType === "wholesaler" ? "/wholesaler" : "/buyer";
    return <Navigate to={redirectPath} replace />;
  }

  // 4. Authorized access
  return <>{children}</>;
}
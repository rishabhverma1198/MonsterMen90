import { Navigate } from "react-router-dom";
import type { ReactNode } from "react";

type Props = {
  children: ReactNode;
  allowed: "buyer" | "wholeseller";
};

export default function ProtectedRoute({
  children,
  allowed,
}: Props) {
  const userType = localStorage.getItem("userType");

  if (!userType) {
    return <Navigate to="/" replace />;
  }

  if (userType !== allowed) {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

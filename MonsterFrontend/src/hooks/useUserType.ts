import { useContext } from "react";
import { UserTypeContext } from "../context/UserTypeContextBase";

export function useUserType() {
  const context = useContext(UserTypeContext);
  if (!context) {
    throw new Error("useUserType must be used inside UserTypeProvider");
  }
  return context;
}
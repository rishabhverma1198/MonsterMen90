import { useState } from "react";
import type { ReactNode } from "react";
import { UserTypeContext, type UserType } from "./UserTypeContextBase";

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserType] = useState<UserType>(() => {
    const stored = localStorage.getItem("userType");
    if (stored === "buyer" || stored === "wholesaler") {
      console.log("UserTypeContext: Initializing userType from localStorage:", stored);
      return stored;
    }
    return null;
  });

  const updateUserType = (type: UserType) => {
    console.log("UserTypeContext: Updating userType to:", type);
    if (type) localStorage.setItem("userType", type);
    else localStorage.removeItem("userType");

    setUserType(type);
  };

  return (
    <UserTypeContext.Provider value={{ userType, setUserType: updateUserType }}>
      {children}
    </UserTypeContext.Provider>
  );
}
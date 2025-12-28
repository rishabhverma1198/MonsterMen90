import { createContext } from "react";

type UserType = "buyer" | "wholesaler" | null;

interface UserTypeContextType {
  userType: UserType;
  setUserType: (type: UserType) => void;
}

export const UserTypeContext = createContext<UserTypeContextType | undefined>(undefined);

export type { UserType, UserTypeContextType };
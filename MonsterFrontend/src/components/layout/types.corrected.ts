// Type definitions for Header component
import React from 'react';
import type { CartItem } from "../../types/cart-types";
import type { User } from "../../types/api-types";

export interface HeaderProps {
  className?: string;
}

export interface SearchCategory {
  value: string;
  label: string;
}

export interface HeaderUser extends Omit<User, 'full_name' | 'email'> {
  full_name?: string | null;
  email?: string;
}

export interface CartData {
  reduce: (callback: (sum: number, item: CartItem) => number, initialValue: number) => number;
}

export interface UserType {
  userType: string;
}

export interface AuthContext {
  user: HeaderUser | null;
  signOut: () => Promise<void>;
}

export interface CartContext {
  cart: CartItem[];
}

export interface UserTypeContext {
  userType: string | null;
}

export interface HeaderState {
  searchQuery: string;
  searchCategory: string;
  language: string;
  isMobileMenuOpen: boolean;
  isAllMenuOpen: boolean;
}

// Search handlers
export interface SearchHandlers {
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => void;
  handleSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleSearchCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
}

// Navigation links
export interface NavigationLink {
  to: string;
  label: string;
  href?: string;
}

// Mobile menu items
export interface MobileMenuSection {
  title: string;
  items: NavigationLink[];
}

// User dropdown items
export interface UserDropdownItem {
  label: string;
  href: string;
  onClick?: () => void;
}
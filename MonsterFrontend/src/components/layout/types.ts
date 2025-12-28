/* =========================
   🎯 HEADER TYPES - IMPROVED
   ========================= */

/**
 * Enhanced TypeScript type definitions for Header component
 * with improved readability, performance, and maintainability
 */

import React from 'react';
import type { User, CartItem as ApiCartItem } from '../../types/api-types';

/* ==============================================
   📦 CORE COMPONENT TYPES
   ============================================== */

/** Base props for Header component with enhanced type safety */
export interface HeaderProps {
  /** Optional CSS class name for custom styling */
  className?: string;
  /** Optional callback for external search handling */
  onSearch?: SearchHandlers;
  /** Optional callback for navigation events */
  onNavigate?: NavigationHandlers;
  /** Optional custom user menu items */
  customUserMenuItems?: UserDropdownItem[];
}

/* ==============================================
   👤 USER & AUTHENTICATION TYPES
   ============================================== */

/** User data for header display with safe defaults */
export interface HeaderUser extends User {
  /** Display name fallback to email if full_name is null */
  displayName?: string;
  /** Avatar URL for user profile image */
  avatarUrl?: string;
  /** User preferences and settings */
  preferences?: UserPreferences;
}

/** User preferences and settings */
export interface UserPreferences {
  /** Preferred language code */
  language?: string;
  /** Theme preference */
  theme?: 'light' | 'dark' | 'system';
  /** Notification settings */
  notifications?: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

/** Authentication context with enhanced error handling */
export interface AuthContext {
  /** Current authenticated user or null */
  user: HeaderUser | null;
  /** Sign out function with error handling */
  signOut: () => Promise<Result<void, Error>>;
  /** Loading state for auth operations */
  isLoading?: boolean;
  /** Authentication error state */
  error?: AuthError | null;
}

/** Authentication error types */
export interface AuthError extends Error {
  /** Error code for programmatic handling */
  code: AuthErrorCode;
  /** Additional error details */
  details?: Record<string, unknown>;
}

export type AuthErrorCode = 
  | 'NETWORK_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'SESSION_EXPIRED'
  | 'UNKNOWN_ERROR';

/* ==============================================
   🛒 CART & SHOPPING TYPES
   ============================================== */

/** Cart context with enhanced state management */
export interface CartContext {
  /** Cart items array */
  items: CartItem[];
  /** Total number of items in cart */
  itemCount: number;
  /** Total price of all items */
  totalPrice: number;
  /** Loading state for cart operations */
  isLoading?: boolean;
  /** Error state for cart operations */
  error?: string | null;
}

/** Enhanced cart item with type safety */
export interface CartItem extends ApiCartItem {
  /** Computed total price for this item */
  totalPrice: number;
  /** Error state for this item */
  error?: string | null;
}

/** Cart data with utility methods */
export interface CartData {
  /** Array of cart items */
  items: readonly CartItem[];
  /** Total number of items */
  readonly totalItems: number;
  /** Total price of all items */
  readonly totalPrice: number;
  /** Calculate subtotal without taxes */
  readonly subtotal: number;
  /** Calculate item count with type safety */
  getItemCount: (productId: string, size?: string) => number;
  /** Check if item exists in cart */
  hasItem: (productId: string, size?: string) => boolean;
}

/* ==============================================
   🔍 SEARCH & FILTERING TYPES
   ============================================== */

/** Search category with validation */
export interface SearchCategory {
  /** Unique identifier for the category */
  value: string;
  /** Display label for the category */
  label: string;
  /** Optional icon for the category */
  icon?: string;
  /** Optional sorting order */
  order?: number;
}

/** Enhanced search handlers with error handling */
export interface SearchHandlers {
  /** Handle form submission for search */
  handleSearch: (e: React.FormEvent<HTMLFormElement>) => Promise<Result<void, SearchError>>;
  /** Handle search query changes with debouncing */
  handleSearchQueryChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  /** Handle category selection changes */
  handleSearchCategoryChange: (e: React.ChangeEvent<HTMLSelectElement>) => void;
  /** Handle advanced filter changes */
  handleFilterChange?: (filters: SearchFilters) => void;
}

/** Search error types */
export interface SearchError extends Error {
  /** Error type for handling */
  type: SearchErrorType;
  /** Optional field that caused the error */
  field?: string;
  /** Additional error details */
  details?: Record<string, unknown>;
}

export type SearchErrorType = 
  | 'INVALID_QUERY'
  | 'NETWORK_ERROR'
  | 'NO_RESULTS'
  | 'RATE_LIMIT_EXCEEDED';

/** Additional search filters */
export interface SearchFilters {
  /** Price range filter */
  priceRange?: {
    min: number;
    max: number;
  };
  /** Category filter */
  categories?: string[];
  /** Availability filter */
  inStock?: boolean;
}

/* ==============================================
   🧭 NAVIGATION & ROUTING TYPES
   ============================================== */

/** Navigation link with enhanced metadata */
export interface NavigationLink {
  /** Route path */
  to: string;
  /** Display label */
  label: string;
  /** Optional external URL (overrides 'to') */
  href?: string;
  /** Optional icon component */
  icon?: React.ComponentType;
  /** Badge count or notification indicator */
  badge?: number | string;
  /** Whether this link is disabled */
  disabled?: boolean;
  /** Optional metadata for analytics */
  metadata?: Record<string, unknown>;
}

/** Navigation handlers for external control */
export interface NavigationHandlers {
  /** Handle navigation events */
  onNavigate: (link: NavigationLink) => void;
  /** Handle external link clicks */
  onExternalLink?: (href: string) => void;
}

/** Mobile menu section with organization */
export interface MobileMenuSection {
  /** Section title */
  title: string;
  /** Navigation items in this section */
  items: NavigationLink[];
  /** Optional icon for the section */
  icon?: React.ComponentType;
  /** Whether this section is expanded by default */
  defaultExpanded?: boolean;
}

/* ==============================================
   👤 USER INTERFACE TYPES
   ============================================== */

/** User dropdown menu item with enhanced actions */
export interface UserDropdownItem {
  /** Display label */
  label: string;
  /** Navigation target */
  href: string;
  /** Optional click handler */
  onClick?: () => void | Promise<void>;
  /** Optional icon component */
  icon?: React.ComponentType;
  /** Whether this item is a destructive action */
  destructive?: boolean;
  /** Keyboard shortcut for this action */
  shortcut?: string;
}

/** User type context with validation */
export interface UserTypeContext {
  /** Current user type or null */
  userType: UserType | null;
  /** Whether the user type is loading */
  isLoading?: boolean;
  /** Error state for user type operations */
  error?: string | null;
}

/** Valid user types with constraints */
export type UserType = 'buyer' | 'wholeseller' | 'admin';

/* ==============================================
   🎛️ UI STATE MANAGEMENT
   ============================================== */

/** Header component state with type safety */
export interface HeaderState {
  /** Current search query */
  searchQuery: string;
  /** Selected search category */
  searchCategory: string;
  /** Current language code */
  language: string;
  /** Mobile menu open state */
  isMobileMenuOpen: boolean;
  /** All menus open state */
  isAllMenuOpen: boolean;
  /** Search results loading state */
  isSearchLoading?: boolean;
  /** Search results count */
  searchResultsCount?: number;
}

/* ==============================================
   🔧 UTILITY TYPES & HELPERS
   ============================================== */

/** Generic result type for error handling */
export type Result<T, E = Error> = 
  | { ok: true; value: T }
  | { ok: false; error: E };

/** Safe navigation type to prevent null/undefined errors */
export type SafeNavigation<T> = T extends null | undefined ? never : T;

/* ==============================================
   🚀 EXPORTED MAIN TYPES
   ============================================== */

// Re-export commonly used types for convenience
export type { 
  User, 
  CartItem as ApiCartItem 
} from '../../types/api-types';

export type { 
  CartItem as LocalCartItem 
} from '../../types/cart-types';
// Wholesale-specific constants and configuration
export const WHOLESALE_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MIN_ORDER_QUANTITY: 20,
  WHOLESALE_DISCOUNT_RATE: 0.8, // 20% discount (wholesale price = base_price * 0.8)
  VIRTUAL_LIST_THRESHOLD: 50,
  DEBOUNCE_DELAY: 300,
  FILTER_DEBOUNCE_DELAY: 300
} as const;

export const GENDER_FILTERS = [
  { value: 'all', label: 'All Genders' },
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'unisex', label: 'Unisex' }
] as const;

export const SORT_OPTIONS = [
  { value: 'newest', label: 'Newest First' },
  { value: 'price-low', label: 'Price: Low to High' },
  { value: 'price-high', label: 'Price: High to Low' },
  { value: 'name', label: 'Name: A to Z' }
] as const;

// Utility functions for wholesale calculations
export const calculateWholesalePrice = (basePrice: number): number => {
  return basePrice * WHOLESALE_CONFIG.WHOLESALE_DISCOUNT_RATE;
};

export const calculateSavingsPerUnit = (basePrice: number): number => {
  const wholesalePrice = calculateWholesalePrice(basePrice);
  return basePrice - wholesalePrice;
};

export const formatWholesalePrice = (price: number): string => {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    minimumFractionDigits: 0
  }).format(price);
};
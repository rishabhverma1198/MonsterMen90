import type { WebsiteProduct } from '../lib/services/website-product.service';

export type GenderFilter = 'all' | 'men' | 'women' | 'unisex';
export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name' | 'savings';

export interface WholesaleFilters {
  searchTerm: string;
  selectedGender: GenderFilter;
  sortBy: SortOption;
  category?: string;
  priceRange?: [number, number];
  inStockOnly: boolean;
  minSavingsPercentage?: number;
}

export interface WholesaleProduct extends WebsiteProduct {
  readonly wholesalePrice: number;
  readonly savingsPerUnit: number;
  readonly savingsPercentage: number;
  readonly moq: number; // Minimum Order Quantity for wholesalers
  readonly bulkTierPrices?: Array<{ minQty: number; price: number }>;
}

export interface UseProductDataReturn {
  products: WholesaleProduct[];
  isLoading: boolean;
  error: Error | null;
  refetch: () => Promise<void>;
  totalCount: number;
  pagination: {
    currentPage: number;
    hasMore: boolean;
    loadMore: () => void;
  };
}

export interface UseProductFiltersReturn {
  filters: WholesaleFilters;
  updateFilter: <K extends keyof WholesaleFilters>(key: K, value: WholesaleFilters[K]) => void;
  resetFilters: () => void;
}

export interface FilterPerformanceMetrics {
  executionTimeMs: number;
  resultsCount: number;
}

export interface UseFilteredProductsReturn {
  filteredProducts: WholesaleProduct[];
  metrics: FilterPerformanceMetrics;
}

export interface ProductGridProps {
  products: WholesaleProduct[];
  loading: boolean;
  onAction: (product: WholesaleProduct, type: 'view' | 'add-to-cart' | 'negotiate') => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export interface FilterSectionProps {
  filters: WholesaleFilters;
  handlers: Omit<UseProductFiltersReturn, 'filters'>;
  totalFound: number;
  isVisible?: boolean;
  onClose?: () => void;
}

export interface WholesaleProductCardProps {
  product: WholesaleProduct;
  onView: (id: string) => void;
  onAddToCart: (id: string, qty: number) => void;
  isCompact?: boolean;
}
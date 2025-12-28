// Type definitions for wholesale functionality
import type { WebsiteProduct } from '../lib/services/website-product.service';

export type GenderFilter = 'all' | 'men' | 'women' | 'unisex';
export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

export interface ProductFilters {
  searchTerm: string;
  selectedGender: GenderFilter;
  sortBy: SortOption;
  category?: string;
  priceRange?: [number, number];
  inStock?: boolean;
}

export interface WholesaleProduct extends WebsiteProduct {
  wholesalePrice: number;
  savingsPerUnit: number;
}

export interface UseProductDataReturn {
  products: WebsiteProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
  hasMore?: boolean;
  loadMore?: () => void;
}

export interface UseProductFiltersReturn {
  filters: ProductFilters;
  setSearchTerm: (term: string) => void;
  setSelectedGender: (gender: GenderFilter) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
}

export interface FilterPerformanceMetrics {
  filterTime: number;
  productCount: number;
}

export interface UseFilteredProductsReturn {
  filteredProducts: WebsiteProduct[];
  performanceMetrics: FilterPerformanceMetrics;
}

export interface ProductGridProps {
  products: WebsiteProduct[];
  loading: boolean;
  onProductAction: (product: WebsiteProduct, action: 'view' | 'add-to-cart') => void;
  viewMode?: 'grid' | 'list';
  className?: string;
}

export interface FilterSectionProps {
  filters: ProductFilters;
  onFilterChange: Omit<UseProductFiltersReturn, 'filters'>;
  productCount: number;
  isVisible?: boolean;
  onClose?: () => void;
  className?: string;
}

export interface WholesaleProductCardProps {
  product: WebsiteProduct;
  onView: (product: WebsiteProduct) => void;
  onAddToCart: (product: WebsiteProduct) => void;
  className?: string;
}
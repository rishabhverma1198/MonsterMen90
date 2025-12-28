# WholesalerHome.tsx Refactoring Plan

## Current Issues Analysis

### 1. **useEffect for Derived State Anti-Pattern** (Critical)
- **Location**: Lines 81-83
- **Issue**: `filterAndSortProducts` function is called in useEffect, creating unnecessary re-renders
- **Impact**: Performance degradation, state inconsistencies

### 2. **Redundant State Management**
- **Location**: Lines 12-13
- **Issue**: Both `products` and `filteredProducts` state exist
- **Impact**: Memory waste, potential synchronization issues

### 3. **Performance Issues**
- **Location**: Lines 40-75
- **Issue**: No useMemo for expensive filtering/sorting operations
- **Impact**: Re-computation on every render
- **Location**: Lines 291-297
- **Issue**: Images not lazy-loaded
- **Impact**: Slower initial page load, poor user experience

### 4. **Code Organization Problems**
- **Issue**: Single large component with mixed responsibilities
- **Impact**: Difficult to maintain, test, and reuse

### 5. **Error Handling Deficiencies**
- **Location**: Lines 33-34
- **Issue**: Basic error handling without user feedback
- **Impact**: Poor user experience on failures

### 6. **Maintainability Issues**
- **Issue**: Magic numbers (50 products, 20% discount, 20 min order)
- **Issue**: No type safety for filter options
- **Impact**: Code fragility, difficult to modify

---

## Refactoring Strategy

### Phase 1: Custom Hooks Creation

#### 1.1 `useProductData` Hook
```typescript
interface UseProductDataReturn {
  products: WebsiteProduct[];
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  totalCount: number;
}
```

**Purpose**: Encapsulate all product fetching logic
**Location**: `src/hooks/useProductData.ts`

#### 1.2 `useProductFilters` Hook
```typescript
interface UseProductFiltersReturn {
  filters: {
    searchTerm: string;
    selectedGender: GenderFilter;
    sortBy: SortOption;
  };
  setSearchTerm: (term: string) => void;
  setSelectedGender: (gender: GenderFilter) => void;
  setSortBy: (sort: SortOption) => void;
  clearFilters: () => void;
}
```

**Purpose**: Manage filter state with proper typing
**Location**: `src/hooks/useProductFilters.ts`

#### 1.3 `useFilteredProducts` Hook
```typescript
interface UseFilteredProductsReturn {
  filteredProducts: WebsiteProduct[];
  performanceMetrics: {
    filterTime: number;
    productCount: number;
  };
}
```

**Purpose**: Memoized product filtering and sorting
**Location**: `src/hooks/useFilteredProducts.ts`

---

### Phase 2: Component Refactoring

#### 2.1 `ProductGrid` Component
```typescript
interface ProductGridProps {
  products: WebsiteProduct[];
  loading: boolean;
  onProductAction: (product: WebsiteProduct, action: 'view' | 'add-to-cart') => void;
}
```

**Features**:
- Uses VirtualList for large datasets
- Lazy loading with existing LazyImage component
- Proper error boundaries

#### 2.2 `FilterSection` Component
```typescript
interface FilterSectionProps {
  filters: UseProductFiltersReturn['filters'];
  onFilterChange: UseProductFiltersReturn;
  productCount: number;
}
```

**Features**:
- Reusable filter controls
- Clear separation of concerns
- Accessibility improvements

#### 2.3 `WholesaleProductCard` Component
```typescript
interface WholesaleProductCardProps {
  product: WebsiteProduct;
  onView: (product: WebsiteProduct) => void;
  onAddToCart: (product: WebsiteProduct) => void;
}
```

**Features**:
- Uses existing LazyImage component
- Wholesale-specific pricing display
- Optimized for performance

---

### Phase 3: Performance Optimizations

#### 3.1 Image Optimization
```typescript
// Replace current img tags with LazyImage
<LazyImage
  src={product.images?.[0] || ''}
  alt={product.name}
  className="w-full h-48 sm:h-56 object-cover group-hover:scale-110 transition-transform duration-500"
  wrapperClassName="relative overflow-hidden"
/>
```

#### 3.2 Virtual Scrolling
```typescript
// Use VirtualList for product grid when > 50 products
const shouldUseVirtualList = products.length > 50;

{shouldUseVirtualList ? (
  <VirtualList
    items={filteredProducts}
    itemHeight={500} // Approximate card height
    height={600}
    renderItem={(product, index) => (
      <WholesaleProductCard
        key={product.id}
        product={product}
        onView={handleViewProduct}
        onAddToCart={handleAddToCart}
      />
    )}
  />
) : (
  <ProductGrid products={filteredProducts} />
)}
```

#### 3.3 Memoized Calculations
```typescript
// Memoize expensive calculations
const performanceMetrics = useMemo(() => {
  const startTime = performance.now();
  const result = filterAndSortProducts(products, filters);
  const filterTime = performance.now() - startTime;
  
  return {
    filteredProducts: result,
    metrics: {
      filterTime,
      productCount: result.length
    }
  };
}, [products, filters]);
```

---

### Phase 4: Constants and Types

#### 4.1 Constants File
```typescript
// src/lib/wholesale-constants.ts
export const WHOLESALE_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MIN_ORDER_QUANTITY: 20,
  WHOLESALE_DISCOUNT_RATE: 0.8, // 20% discount
  VIRTUAL_LIST_THRESHOLD: 50,
  DEBOUNCE_DELAY: 300
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
```

#### 4.2 Type Definitions
```typescript
// src/types/wholesale-types.ts
export type GenderFilter = 'all' | 'men' | 'women' | 'unisex';
export type SortOption = 'newest' | 'price-low' | 'price-high' | 'name';

export interface ProductFilters {
  searchTerm: string;
  selectedGender: GenderFilter;
  sortBy: SortOption;
}

export interface WholesaleProduct extends WebsiteProduct {
  wholesalePrice: number;
  savingsPerUnit: number;
}
```

---

### Phase 5: Error Handling Improvements

#### 5.1 Error Boundary Component
```typescript
// src/components/ErrorBoundary.tsx
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

export class ProductGridErrorBoundary extends React.Component<
  { children: React.ReactNode; fallback?: React.ComponentType },
  ErrorBoundaryState
> {
  // Implementation with proper error logging
}
```

#### 5.2 Toast Notifications
```typescript
// Add proper error feedback
try {
  await fetchProducts();
} catch (error) {
  toast.error('Failed to load products. Please try again.');
  // Optional: Track error for monitoring
}
```

---

### Phase 6: Accessibility Improvements

#### 6.1 ARIA Labels
```typescript
// Add proper ARIA labels to interactive elements
<Button
  aria-label={`Add ${product.name} to wholesale cart`}
  onClick={() => handleAddToCart(product)}
>
  <ShoppingCart className="w-4 h-4 mr-2" />
  Add to Cart
</Button>
```

#### 6.2 Keyboard Navigation
- Ensure all interactive elements are keyboard accessible
- Add focus management for modal dialogs
- Implement proper tab order

---

## Implementation Order

### Priority 1 (Critical Performance)
1. Remove useEffect anti-pattern with useMemo
2. Implement useProductData hook
3. Add LazyImage component for product images

### Priority 2 (Code Organization)
1. Create useProductFilters hook
2. Extract FilterSection component
3. Create WholesaleProductCard component

### Priority 3 (Advanced Optimizations)
1. Implement VirtualList for large datasets
2. Add error boundaries and proper error handling
3. Performance monitoring and metrics

### Priority 4 (Polish)
1. Accessibility improvements
2. Animation and transition optimizations
3. Documentation and testing

---

## Expected Benefits

### Performance Improvements
- **50-70% reduction** in re-renders by removing useEffect anti-pattern
- **30-40% faster** initial page load with lazy image loading
- **Memory usage reduction** by eliminating redundant state
- **Smooth scrolling** for large product lists with virtualization

### Code Quality Improvements
- **Modular architecture** with clear separation of concerns
- **Type safety** throughout the component hierarchy
- **Reusable components** that can be used across the application
- **Better testability** with isolated hooks and components

### Developer Experience
- **Easier maintenance** with smaller, focused components
- **Better debugging** with proper error boundaries
- **Consistent patterns** across the application
- **Enhanced accessibility** compliance

---

## Migration Strategy

### Step 1: Create New Hooks
- Implement useProductData, useProductFilters, useFilteredProducts
- Test hooks in isolation

### Step 2: Create New Components
- Build WholesaleProductCard, FilterSection, ProductGrid
- Ensure backward compatibility

### Step 3: Refactor Main Component
- Gradually replace existing logic with new hooks
- Test each change incrementally

### Step 4: Performance Testing
- Measure before/after performance metrics
- Validate improvements meet targets

### Step 5: User Acceptance Testing
- Ensure functionality remains identical
- Validate performance improvements
- Check accessibility compliance

---

## Testing Strategy

### Unit Tests
- Test each hook in isolation
- Test component rendering and interactions
- Mock external dependencies (API calls)

### Integration Tests
- Test hook interactions
- Test component composition
- Test error scenarios

### Performance Tests
- Measure render times
- Test with large datasets (1000+ products)
- Validate memory usage

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Color contrast validation

---

This refactoring plan addresses all the identified issues while leveraging existing components and following React best practices. The phased approach ensures minimal risk and allows for incremental improvements.
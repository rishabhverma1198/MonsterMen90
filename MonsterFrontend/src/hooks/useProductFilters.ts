import { useState, useCallback } from 'react';
import { useDebounce } from './useOptimizedLoading';
import { WHOLESALE_CONFIG } from '@/lib/wholesale-constants';
import type { UseProductFiltersReturn, ProductFilters, GenderFilter, SortOption } from '@/types/wholesale-types';

/**
 * Custom hook for managing product filter state
 * Provides type-safe filter management with debounced search
 */
export function useProductFilters(): UseProductFiltersReturn {
  const [searchTerm, setSearchTermState] = useState('');
  const [selectedGender, setSelectedGenderState] = useState<GenderFilter>('all');
  const [sortBy, setSortByState] = useState<SortOption>('newest');

  // Debounce search term to prevent excessive filtering
  const debouncedSearchTerm = useDebounce(searchTerm, WHOLESALE_CONFIG.FILTER_DEBOUNCE_DELAY);

  const setSearchTerm = useCallback((term: string) => {
    setSearchTermState(term);
  }, []);

  const setSelectedGender = useCallback((gender: GenderFilter) => {
    setSelectedGenderState(gender);
  }, []);

  const setSortBy = useCallback((sort: SortOption) => {
    setSortByState(sort);
  }, []);

  const clearFilters = useCallback(() => {
    setSearchTermState('');
    setSelectedGenderState('all');
    setSortByState('newest');
  }, []);

  const filters: ProductFilters = {
    searchTerm: debouncedSearchTerm,
    selectedGender,
    sortBy
  };

  return {
    filters,
    setSearchTerm,
    setSelectedGender,
    setSortBy,
    clearFilters
  };
}
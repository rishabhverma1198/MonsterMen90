import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Search, Filter } from 'lucide-react';
import { GENDER_FILTERS, SORT_OPTIONS } from '@/lib/wholesale-constants';
import type { FilterSectionProps } from '@/types/wholesale-types';

/**
 * Reusable filter section component
 * Handles search, gender filter, sort options, and clear functionality
 */
export function FilterSection({
  filters,
  onFilterChange,
  productCount,
  isVisible: _isVisible = true,
  onClose: _onClose,
  className = ''
}: FilterSectionProps) {
  const { setSearchTerm, setSelectedGender, setSortBy, clearFilters } = onFilterChange;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-6 sm:p-8 mb-8 lg:mb-10 ${className}`}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Filter & Search Products
        </h2>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Find the perfect wholesale products for your business
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Search */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Search Products
          </label>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 h-5 w-5" />
            <Input
              placeholder="Search by name, brand..."
              value={filters.searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-12 h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 w-full"
              aria-label="Search products"
            />
          </div>
        </div>

        {/* Gender Filter */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Gender
          </label>
          <Select value={filters.selectedGender} onValueChange={setSelectedGender}>
            <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 w-full">
              <SelectValue placeholder="All Genders" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
              {GENDER_FILTERS.map((filter) => (
                <SelectItem key={filter.value} value={filter.value}>
                  {filter.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Sort By */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide">
            Sort By
          </label>
          <Select value={filters.sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="h-12 bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-600 transition-all duration-200 w-full">
              <SelectValue placeholder="Newest First" />
            </SelectTrigger>
            <SelectContent className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-xl rounded-xl">
              {SORT_OPTIONS.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Clear Filters */}
        <div className="space-y-3">
          <label className="text-sm font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wide opacity-0">
            Actions
          </label>
          <Button
            onClick={clearFilters}
            className="w-full h-12 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 font-medium"
            aria-label="Clear all filters"
          >
            <Filter className="w-5 h-5 mr-2" />
            Clear Filters
          </Button>
        </div>
      </div>

      {/* Active Filters Summary */}
      {(filters.searchTerm || filters.selectedGender !== 'all' || filters.sortBy !== 'newest') && (
        <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div className="flex items-center gap-4 flex-wrap">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Active filters:
              </span>
              {filters.searchTerm && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                  Search: "{filters.searchTerm}"
                </span>
              )}
              {filters.selectedGender !== 'all' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                  Gender: {filters.selectedGender}
                </span>
              )}
              {filters.sortBy !== 'newest' && (
                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                  Sort: {SORT_OPTIONS.find(opt => opt.value === filters.sortBy)?.label}
                </span>
              )}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {productCount} products found
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
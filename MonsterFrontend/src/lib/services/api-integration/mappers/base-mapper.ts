// Base Product Mapper
// Abstract base class for all product data mappers

import type {
  ExternalProduct,
  ExternalVariant,
  CreateProductData,
  CreateVariantData,
  ProductMapper,
  VariantMapper
} from '../../../../types/api-integration-types';

export abstract class BaseProductMapper implements ProductMapper<ExternalProduct> {
  /**
   * Map external product to internal product format
   */
  abstract mapProduct(external: ExternalProduct): CreateProductData;

  /**
   * Map external variants to internal variant format
   */
  abstract mapVariants(external: ExternalProduct): CreateVariantData[];

  /**
   * Map category from external format to internal category ID
   */
  abstract mapCategory(external: ExternalProduct): string;

  /**
   * Generate SKU from external data
   */
  abstract generateSKU(external: ExternalProduct): string;

  /**
   * Generate URL-friendly slug from product name
   */
  protected generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Replace multiple hyphens with single
      .trim();
  }

  /**
   * Calculate wholesale price (typically 60% of retail price)
   */
  protected calculateWholesalePrice(retailPrice: number): number {
    return Math.round(retailPrice * 0.6 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Calculate cost price (typically 40% of retail price)
   */
  protected calculateCostPrice(retailPrice: number): number {
    return Math.round(retailPrice * 0.4 * 100) / 100; // Round to 2 decimal places
  }

  /**
   * Normalize images array from various formats
   */
  protected normalizeImages(images: string[] | { src: string; alt?: string }[] | string | undefined): string[] {
    if (!images) {
      return [];
    }

    if (Array.isArray(images)) {
      if (typeof images[0] === 'string') {
        return images as string[];
      }
      
      if (typeof images[0] === 'object' && images[0]?.src) {
        return (images as { src: string; alt?: string }[]).map(img => img.src);
      }
    }

    if (typeof images === 'string') {
      return [images];
    }

    return [];
  }

  /**
   * Get category string from various formats
   */
  protected getCategoryString(category: string | { id: string | number; name: string } | undefined): string {
    if (!category) {
      return '';
    }

    if (typeof category === 'string') {
      return category;
    }

    return category.name || '';
  }

  /**
   * Generate unique SKU with prefix
   */
  protected generateSKUPrefix(externalId: string | number, prefix: string): string {
    return `${prefix}-${externalId}`;
  }

  /**
   * Validate required product fields
   */
  protected validateProductData(data: CreateProductData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.name || data.name.trim() === '') {
      errors.push('Product name is required');
    }

    if (!data.sku || data.sku.trim() === '') {
      errors.push('Product SKU is required');
    }

    if (!data.category_id) {
      errors.push('Category ID is required');
    }

    if (data.base_price <= 0) {
      errors.push('Base price must be greater than 0');
    }

    if (data.images && data.images.length === 0) {
      errors.push('At least one product image is required');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Extract text from HTML description (basic implementation)
   */
  protected stripHtml(html: string): string {
    if (!html) return '';
    
    return html
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/\s+/g, ' ') // Replace multiple spaces with single
      .trim();
  }

  /**
   * Truncate text to specified length
   */
  protected truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text || '';
    }

    return text.substring(0, maxLength - 3) + '...';
  }

  /**
   * Clean and format brand name
   */
  protected cleanBrandName(brand: string | undefined): string | undefined {
    if (!brand) return undefined;

    return brand
      .trim()
      .replace(/[^a-zA-Z0-9\s&-]/g, '') // Remove special characters except & and -
      .replace(/\s+/g, ' ') // Replace multiple spaces with single
      .trim();
  }

  /**
   * Map rating to featured status (if rating >= 4.0, mark as featured)
   */
  protected shouldFeature(rating?: number): boolean {
    return rating ? rating >= 4.0 : false;
  }
}

export abstract class BaseVariantMapper implements VariantMapper<ExternalVariant> {
  /**
   * Map external variant to internal variant format
   */
  abstract mapVariant(external: ExternalVariant): CreateVariantData;

  /**
   * Generate variant SKU from parent product SKU and variant attributes
   */
  protected generateVariantSKU(
    parentSKU: string, 
    size?: string, 
    color?: string, 
    prefix?: string
  ): string {
    const variantParts: string[] = [];
    
    if (prefix) {
      variantParts.push(prefix);
    }
    
    variantParts.push(parentSKU);
    
    if (size) {
      variantParts.push(size.toUpperCase());
    }
    
    if (color) {
      variantParts.push(color.toUpperCase().replace(/\s+/g, '_'));
    }

    return variantParts.join('-');
  }

  /**
   * Normalize size format
   */
  protected normalizeSize(size: string | undefined): string {
    if (!size) return 'ONE_SIZE';
    
    return size.toUpperCase().replace(/\s+/g, '_');
  }

  /**
   * Normalize color format
   */
  protected normalizeColor(color: string | undefined): string | undefined {
    if (!color) return undefined;
    
    return color.trim().replace(/\s+/g, ' ');
  }

  /**
   * Generate hex color code from color name (basic implementation)
   */
  protected generateColorHex(color: string | undefined): string | undefined {
    if (!color) return undefined;

    // Basic color mapping for common colors
    const colorMap: Record<string, string> = {
      'red': '#FF0000',
      'blue': '#0000FF',
      'green': '#008000',
      'yellow': '#FFFF00',
      'black': '#000000',
      'white': '#FFFFFF',
      'gray': '#808080',
      'grey': '#808080',
      'pink': '#FFC0CB',
      'purple': '#800080',
      'orange': '#FFA500',
      'brown': '#A52A2A'
    };

    const normalizedColor = color.toLowerCase();
    return colorMap[normalizedColor] || undefined;
  }

  /**
   * Calculate weight in grams from various units
   */
  protected normalizeWeight(weight: number | undefined, unit: string = 'kg'): number | undefined {
    if (!weight) return undefined;

    switch (unit.toLowerCase()) {
      case 'kg':
        return weight * 1000; // Convert kg to grams
      case 'g':
      case 'grams':
        return weight;
      case 'lb':
      case 'lbs':
      case 'pounds':
        return weight * 453.592; // Convert pounds to grams
      case 'oz':
      case 'ounces':
        return weight * 28.3495; // Convert ounces to grams
      default:
        return weight; // Assume grams
    }
  }

  /**
   * Validate variant data
   */
  protected validateVariantData(data: CreateVariantData): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data.size || data.size.trim() === '') {
      errors.push('Variant size is required');
    }

    if (!data.sku || data.sku.trim() === '') {
      errors.push('Variant SKU is required');
    }

    if (data.price <= 0) {
      errors.push('Variant price must be greater than 0');
    }

    if (data.stock_quantity !== undefined && data.stock_quantity < 0) {
      errors.push('Stock quantity cannot be negative');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }
}
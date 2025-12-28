// FakeStoreAPI Mapper
// Maps FakeStoreAPI data to internal product format

import { BaseProductMapper, BaseVariantMapper } from './base-mapper';
import type {
  ExternalProduct,
  CreateProductData,
  CreateVariantData
} from '../../../../types/api-integration-types';

// Category mapping from FakeStoreAPI to our database
const CATEGORY_MAPPING: Record<string, string> = {
  "men's clothing": "men",
  "women's clothing": "women",
  "electronics": "electronics",
  "jewelery": "jewelry",
  "jewelry": "jewelry"
};

export class FakeStoreMapper extends BaseProductMapper {
  /**
   * Map FakeStoreAPI product to internal product format
   */
  mapProduct(external: ExternalProduct): CreateProductData {
    const categoryId = this.mapCategory(external);
    
    const productData: CreateProductData = {
      name: external.title || external.name || 'Unknown Product',
      slug: this.generateSlug(external.title || external.name || 'unknown-product'),
      description: this.stripHtml(external.description || ''),
      short_description: this.truncateText(this.stripHtml(external.description || ''), 500),
      sku: this.generateSKU(external),
      category_id: categoryId,
      base_price: external.price || 0,
      wholesale_price: this.calculateWholesalePrice(external.price || 0),
      cost_price: this.calculateCostPrice(external.price || 0),
      images: this.normalizeImages(external.images || external.image),
      brand: this.cleanBrandName(external.brand || external.vendor),
      is_featured: this.shouldFeature(external.rating || external.rate),
      is_active: true,
      meta_title: `${external.title || external.name} | MonsterMen90`,
      meta_description: this.truncateText(this.stripHtml(external.description || ''), 160)
    };

    return productData;
  }

  /**
   * Map FakeStoreAPI product variants to internal variant format
   * FakeStoreAPI doesn't have variants, so we'll create a single default variant
   */
  mapVariants(external: ExternalProduct): CreateVariantData[] {
    const variants: CreateVariantData[] = [];

    // FakeStoreAPI doesn't provide variants, so create a default variant
    const defaultVariant: CreateVariantData = {
      size: 'ONE_SIZE',
      color: undefined,
      color_hex: undefined,
      sku: this.generateSKU(external),
      stock_quantity: external.inventory_quantity || external.stock || 50,
      min_stock_level: 5,
      price: external.price || 0,
      wholesale_price: this.calculateWholesalePrice(external.price || 0)
    };

    variants.push(defaultVariant);

    // Note: FakeStoreAPI doesn't provide variants, so we create only the default variant
    // If variants were provided in the future, they would be processed here

    return variants;
  }

  /**
   * Map category from FakeStoreAPI to our database category
   */
  mapCategory(external: ExternalProduct): string {
    const categoryStr = this.getCategoryString(external.category);
    
    // Try exact match first
    if (CATEGORY_MAPPING[categoryStr]) {
      return this.getCategoryIdBySlug(CATEGORY_MAPPING[categoryStr]);
    }

    // Try partial match
    const lowerCategory = categoryStr.toLowerCase();
    for (const [apiCategory, dbCategory] of Object.entries(CATEGORY_MAPPING)) {
      if (lowerCategory.includes(apiCategory.toLowerCase())) {
        return this.getCategoryIdBySlug(dbCategory);
      }
    }

    // Default to 'men' category if no match found
    return this.getCategoryIdBySlug('men');
  }

  /**
   * Generate SKU for FakeStoreAPI products
   */
  generateSKU(external: ExternalProduct): string {
    const prefix = 'FS'; // FakeStore
    const id = external.id.toString();
    const categoryStr = this.getCategoryString(external.category).toUpperCase().replace(/\s+/g, '_');
    
    return `${prefix}-${id}-${categoryStr}`;
  }

  /**
   * Get category ID by slug (mock implementation)
   * In a real application, this would query the database
   */
  private getCategoryIdBySlug(slug: string): string {
    // Mock implementation - in real app, this would query Supabase
    const categoryMap: Record<string, string> = {
      'men': '00000000-0000-0000-0000-000000000001', // Replace with actual UUID
      'women': '00000000-0000-0000-0000-000000000002', // Replace with actual UUID
      'electronics': '00000000-0000-0000-0000-000000000003', // Replace with actual UUID
      'jewelry': '00000000-0000-0000-0000-000000000004' // Replace with actual UUID
    };

    return categoryMap[slug] || categoryMap['men']; // Default to men category
  }
}

// Variant-specific mapper for FakeStoreAPI (extends base)
export class FakeStoreVariantMapper extends BaseVariantMapper {
  /**
   * Map a single variant (if variants were provided)
   */
  mapVariant(external: ExternalProduct): CreateVariantData {
    // Since FakeStoreAPI doesn't provide variants, return default
    return {
      size: 'ONE_SIZE',
      color: undefined,
      color_hex: undefined,
      sku: `FS-${external.id}-OS`, // ONE_SIZE
      stock_quantity: external.inventory_quantity || external.stock || 50,
      min_stock_level: 5,
      price: external.price || 0,
      wholesale_price: this.calculateWholesalePrice(external.price || 0)
    };
  }

  /**
   * Calculate wholesale price (inherited from base)
   */
  protected calculateWholesalePrice(retailPrice: number): number {
    return Math.round(retailPrice * 0.6 * 100) / 100;
  }
}
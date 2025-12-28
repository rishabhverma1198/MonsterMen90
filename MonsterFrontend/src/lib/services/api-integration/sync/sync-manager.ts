// Sync Manager
// Simplified version for FakeStoreAPI integration

import { supabase } from '../../../supabase';
import type {
  SyncResult,
  SyncLog,
  SyncType,
  SyncStatus,
  ExternalProduct,
  CreateProductData,
  CreateVariantData,
  APIIntegration
} from '../../../../types/api-integration-types';

// Simplified mapper interface for now
interface SimpleMapper {
  mapProduct(external: ExternalProduct): CreateProductData;
  mapVariants(external: ExternalProduct): CreateVariantData[];
}

export class SyncManager {
  /**
   * Run a sync operation for FakeStoreAPI integration
   */
  async runSync(
    integrationId: string,
    type: SyncType = 'manual'
  ): Promise<SyncResult> {
    const startTime = new Date();
    let syncLog: SyncLog | null = null;
    
    try {
      // Create sync log entry
      syncLog = await this.createSyncLog(integrationId, type, startTime);
      
      // Get integration configuration
      const integration = await this.getIntegration(integrationId);
      if (!integration) {
        throw new Error(`Integration not found: ${integrationId}`);
      }

      if (!integration.is_active) {
        throw new Error(`Integration is inactive: ${integration.name}`);
      }

      // Update sync log status
      await this.updateSyncLogStatus(syncLog.id, 'running');

      // For FakeStoreAPI, we'll use a simple approach
      const result = await this.syncFakeStoreAPI(integration, syncLog.id);

      // Update integration last sync time
      await this.updateIntegrationLastSync(integrationId);

      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      if (syncLog) {
        await this.failSyncLog(syncLog.id, error as Error);
      }

      return {
        success: false,
        products_created: 0,
        products_updated: 0,
        products_failed: 0,
        errors: [{
          timestamp: new Date(),
          integration_id: integrationId,
          error_type: 'network',
          message: errorMessage,
          retry_count: 0,
          resolved: false
        }],
        started_at: startTime,
        completed_at: new Date()
      };
    }
  }

  /**
   * Sync with FakeStoreAPI
   */
  private async syncFakeStoreAPI(
    integration: APIIntegration,
    syncLogId: string
  ): Promise<SyncResult> {
    const startTime = new Date();
    const result: SyncResult = {
      success: false,
      products_created: 0,
      products_updated: 0,
      products_failed: 0,
      errors: [],
      started_at: startTime,
      completed_at: new Date()
    };

    try {
      // Fetch products from FakeStoreAPI
      const response = await fetch('https://fakestoreapi.com/products');
      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const externalProducts: ExternalProduct[] = await response.json();

      // Simple mapper for FakeStoreAPI
      const mapper: SimpleMapper = {
        mapProduct: (external: ExternalProduct) => ({
          name: external.title || 'Unknown Product',
          slug: this.generateSlug(external.title || 'unknown-product'),
          description: external.description || '',
          short_description: this.truncateText(external.description || '', 500),
          sku: `FS-${external.id}`,
          category_id: this.getDefaultCategoryId(), // Default category
          base_price: external.price || 0,
          wholesale_price: this.calculateWholesalePrice(external.price || 0),
          cost_price: this.calculateCostPrice(external.price || 0),
            images: (external.images || [external.image]).filter(Boolean) as string[],
          brand: external.brand || 'Unknown',
          is_featured: (external.rating || 0) >= 4.0,
          is_active: true,
          meta_title: `${external.title} | MonsterMen90`,
          meta_description: this.truncateText(external.description || '', 160)
        }),
        mapVariants: (_external: ExternalProduct) => [{
          size: 'ONE_SIZE',
          color: undefined,
          color_hex: undefined,
          sku: `FS-${_external.id}-OS`,
          stock_quantity: 50,
          min_stock_level: 5,
          price: _external.price || 0,
          wholesale_price: this.calculateWholesalePrice(_external.price || 0)
        }]
      };

      // Process each product
      for (const externalProduct of externalProducts) {
        try {
          const productResult = await this.processProduct(externalProduct, mapper);
          
          if (productResult.created) {
            result.products_created++;
          } else if (productResult.updated) {
            result.products_updated++;
          }
        } catch (error) {
          result.products_failed++;
          result.errors.push({
            timestamp: new Date(),
            integration_id: integration.id,
            error_type: 'mapping',
            message: error instanceof Error ? error.message : 'Unknown error',
            external_product_id: String(externalProduct.id),
            retry_count: 0,
            resolved: false
          });
        }
      }

      result.success = result.errors.length === 0;
      
      // Update sync log with results
      await this.completeSyncLog(syncLogId, result);

      return result;
    } catch (error) {
      throw new Error(`Sync failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Process a single product
   */
  private async processProduct(
    externalProduct: ExternalProduct,
    mapper: SimpleMapper
  ): Promise<{ created: boolean; updated: boolean }> {
    const productData = mapper.mapProduct(externalProduct);
    const variantData = mapper.mapVariants(externalProduct);

    // Check if product already exists by SKU
    const { data: existingProduct } = await supabase
      .from('products')
      .select('id')
      .eq('sku', productData.sku)
      .single();

    if (existingProduct) {
      // Update existing product
      await supabase
        .from('products')
        .update({
          ...productData,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProduct.id);

      // Update variants
      await this.updateVariants(existingProduct.id, variantData);

      return { created: false, updated: true };
    } else {
      // Create new product
      const { data: newProduct, error } = await supabase
        .from('products')
        .insert(productData)
        .select('id')
        .single();

      if (error) {
        throw new Error(`Failed to create product: ${error.message}`);
      }

      // Create variants
      await this.createVariants(newProduct!.id, variantData);

      return { created: true, updated: false };
    }
  }

  /**
   * Create product variants
   */
  private async createVariants(productId: string, variants: CreateVariantData[]): Promise<void> {
    for (const variant of variants) {
      await supabase
        .from('product_variants')
        .insert({
          ...variant,
          product_id: productId
        });
    }
  }

  /**
   * Update product variants
   */
  private async updateVariants(productId: string, variants: CreateVariantData[]): Promise<void> {
    for (const variant of variants) {
      // Check if variant exists
      const { data: existingVariant } = await supabase
        .from('product_variants')
        .select('id')
        .eq('product_id', productId)
        .eq('sku', variant.sku)
        .single();

      if (existingVariant) {
        // Update existing variant
        await supabase
          .from('product_variants')
          .update(variant)
          .eq('id', existingVariant.id);
      } else {
        // Create new variant
        await supabase
          .from('product_variants')
          .insert({
            ...variant,
            product_id: productId
          });
      }
    }
  }

  /**
   * Create sync log entry
   */
  private async createSyncLog(
    integrationId: string,
    type: SyncType,
    startedAt: Date
  ): Promise<SyncLog> {
    const { data, error } = await supabase
      .from('api_sync_logs')
      .insert({
        integration_id: integrationId,
        sync_type: type,
        status: 'pending',
        started_at: startedAt.toISOString()
      })
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to create sync log: ${error.message}`);
    }

    return data as SyncLog;
  }

  /**
   * Update sync log status
   */
  private async updateSyncLogStatus(syncLogId: string, status: SyncStatus): Promise<void> {
    await supabase
      .from('api_sync_logs')
      .update({ status })
      .eq('id', syncLogId);
  }

  /**
   * Complete sync log with results
   */
  private async completeSyncLog(
    syncLogId: string,
    result: SyncResult
  ): Promise<void> {
    await supabase
      .from('api_sync_logs')
      .update({
        status: 'completed',
        completed_at: new Date().toISOString(),
        products_created: result.products_created,
        products_updated: result.products_updated,
        products_failed: result.products_failed,
        details: {
          errors: result.errors,
          duration_ms: result.completed_at!.getTime() - result.started_at.getTime()
        }
      })
      .eq('id', syncLogId);
  }

  /**
   * Fail sync log with error
   */
  private async failSyncLog(syncLogId: string, error: Error): Promise<void> {
    await supabase
      .from('api_sync_logs')
      .update({
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_message: error.message,
        details: {
          stack_trace: error.stack
        }
      })
      .eq('id', syncLogId);
  }

  /**
   * Get integration configuration
   */
  private async getIntegration(integrationId: string): Promise<APIIntegration | null> {
    const { data, error } = await supabase
      .from('api_integrations')
      .select('*')
      .eq('id', integrationId)
      .single();

    if (error) {
      return null;
    }

    return data as APIIntegration;
  }

  /**
   * Update integration last sync time
   */
  private async updateIntegrationLastSync(integrationId: string): Promise<void> {
    await supabase
      .from('api_integrations')
      .update({
        last_sync_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('id', integrationId);
  }

  /**
   * Get sync history for an integration
   */
  async getSyncHistory(integrationId: string, limit: number = 50): Promise<SyncLog[]> {
    const { data, error } = await supabase
      .from('api_sync_logs')
      .select('*')
      .eq('integration_id', integrationId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      return [];
    }

    return data as SyncLog[];
  }

  // Helper methods
  private generateSlug(name: string): string {
    return name
      .toLowerCase()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .trim();
  }

  private truncateText(text: string, maxLength: number): string {
    if (!text || text.length <= maxLength) {
      return text || '';
    }
    return text.substring(0, maxLength - 3) + '...';
  }

  private calculateWholesalePrice(retailPrice: number): number {
    return Math.round(retailPrice * 0.6 * 100) / 100;
  }

  private calculateCostPrice(retailPrice: number): number {
    return Math.round(retailPrice * 0.4 * 100) / 100;
  }

  private getDefaultCategoryId(): string {
    // TODO: Replace with actual category ID from database
    return '00000000-0000-0000-0000-000000000001';
  }
}
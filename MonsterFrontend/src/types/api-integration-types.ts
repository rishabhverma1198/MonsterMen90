import { Product, ProductVariant } from './api-types';

export type APIProvider = 'fakestore' | 'shopify' | 'woocommerce' | 'printful' | 'manual';

export interface ExternalSyncConfig {
  provider: APIProvider;
  autoSync: boolean;
  syncInterval: number; // in minutes
  mappingRules: Record<string, string>;
}

export interface SyncLogEntry {
  id: string;
  startTime: string;
  endTime?: string;
  status: 'success' | 'failed' | 'in-progress';
  recordsProcessed: number;
  errors: Array<{ sku: string; message: string }>;
}

export interface ProductMapper {
  toInternal: (externalData: any) => Partial<Product>;
  toExternal: (internalData: Product) => any;
  validateSKU: (sku: string) => boolean;
}

export interface BatchSyncResult {
  jobId: string;
  total: number;
  created: number;
  updated: number;
  failed: number;
}
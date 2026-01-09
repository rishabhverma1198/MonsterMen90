// API Integration Service Exports
// Main entry point for all API integration functionality

// Core classes
export { BaseAPIClient } from './base-api-client.ts';
export { RateLimiter } from './rate-limiter.ts';
// TODO: Implement RequestQueue when needed
// export { RequestQueue } from './request-queue';

// Providers - Only implemented providers are exported
// TODO: Implement FakeStoreAPIClient when needed
// export { FakeStoreAPIClient } from './providers/fakestore.client.ts';
// TODO: Implement other providers when needed
// export { ShopifyAPIClient } from './providers/shopify.client';
// export { WooCommerceAPIClient } from './providers/woocommerce.client';
// export { RapidAPIClient } from './providers/rapidapi.client';

// Mappers
export { BaseProductMapper, BaseVariantMapper } from './mappers/base-mapper.ts';
export { FakeStoreMapper, FakeStoreVariantMapper } from './mappers/fakestore.mapper.ts';
// TODO: Implement other mappers when needed
// export { ShopifyMapper } from './mappers/shopify.mapper';
// export { WooCommerceMapper } from './mappers/woocommerce.mapper';
// export { RapidAPIMapper } from './mappers/rapidapi.mapper';

// Sync
export { SyncManager } from './sync/sync-manager.ts';
// TODO: Implement other sync components when needed
// export { SyncScheduler } from './sync/sync-scheduler';
// export { ConflictResolver } from './sync/conflict-resolver';

// Validators - TODO: Implement when needed
// export { ProductValidator } from './validators/product.validator';
// export { VariantValidator } from './validators/variant.validator';

// Factory - TODO: Implement when needed
// export { APIClientFactory } from './api-client.factory';
// export { MapperFactory } from './mapper.factory';

// Types
export type {
  ExternalProduct,
  ExternalVariant,
  APIIntegration,
  CreateAPIIntegrationData,
  APIProvider,
  SyncResult,
  SyncLog,
  SyncType,
  SyncStatus,
  SyncError,
  ErrorType,
  ExternalProductMapping,
  FetchOptions,
  RequestOptions,
  RateLimitConfig,
  APIResponse,
  APIError,
  ProductMapper,
  VariantMapper,
  SyncManager as ISyncManager,
  IntegrationSummary,
  SyncProgress,
  RetryConfig,
  ValidationResult,
  ValidationError,
  ValidationWarning,
  CreateProductData,
  CreateVariantData,
  BatchOperation,
  BatchProgress,
  ShopifyConfig,
  WooCommerceConfig,
  RapidAPIConfig
} from '../../../types/api-integration-types';
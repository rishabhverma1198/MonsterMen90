// API Integration Types
// Types for external API integration and data synchronization

// External API Response Types
export interface ExternalProduct {
  id: string | number;
  title?: string;
  name?: string;
  description?: string;
  price?: number;
  compare_at_price?: number;
  images?: string[] | { src: string; alt?: string }[];
  category?: string | { id: string | number; name: string };
  brand?: string;
  vendor?: string;
  sku?: string;
  variants?: ExternalVariant[];
  tags?: string[];
  inventory_quantity?: number;
  stock?: number;
  image?: string;
  rating?: number;
  rate?: number;
  count?: number;
  [key: string]: unknown; // For additional provider-specific fields
}

export interface ExternalVariant {
  id: string | number;
  title?: string;
  price?: number;
  compare_at_price?: number;
  sku?: string;
  inventory_quantity?: number;
  stock?: number;
  size?: string;
  color?: string;
  color_hex?: string;
  weight?: number;
  dimensions?: { length?: number; width?: number; height?: number };
  option1?: string;
  option2?: string;
  option3?: string;
  [key: string]: unknown;
}

// API Integration Configuration
export interface APIIntegration {
  id: string;
  name: string;
  provider: APIProvider;
  api_url?: string;
  api_key?: string;
  api_secret?: string;
  is_active: boolean;
  sync_interval_minutes: number;
  last_sync_at?: Date;
  config: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface CreateAPIIntegrationData {
  name: string;
  provider: APIProvider;
  api_url?: string;
  api_key?: string;
  api_secret?: string;
  is_active?: boolean;
  sync_interval_minutes?: number;
  config?: Record<string, unknown>;
}

export type APIProvider = 'fakestore' | 'shopify' | 'woocommerce' | 'rapidapi' | 'dummyjson' | 'platzi';

// Sync Operations
export interface SyncResult {
  success: boolean;
  products_created: number;
  products_updated: number;
  products_failed: number;
  errors: SyncError[];
  started_at: Date;
  completed_at?: Date;
}

export interface SyncLog {
  id: string;
  integration_id: string;
  sync_type: SyncType;
  status: SyncStatus;
  started_at: Date;
  completed_at?: Date;
  products_created: number;
  products_updated: number;
  products_failed: number;
  error_message?: string;
  details: Record<string, unknown>;
  created_at: Date;
}

export type SyncType = 'full' | 'incremental' | 'manual' | 'webhook';
export type SyncStatus = 'pending' | 'running' | 'completed' | 'failed' | 'cancelled';

// Error Handling
export interface SyncError {
  timestamp: Date;
  integration_id: string;
  error_type: ErrorType;
  error_code?: string;
  message: string;
  external_product_id?: string;
  raw_data?: unknown;
  stack_trace?: string;
  retry_count: number;
  resolved: boolean;
}

export type ErrorType = 'network' | 'auth' | 'validation' | 'mapping' | 'database' | 'rate_limit';

// External Product Mapping
export interface ExternalProductMapping {
  id: string;
  integration_id: string;
  external_id: string;
  product_id: string;
  external_data: Record<string, unknown>;
  last_synced_at: Date;
  sync_status: 'synced' | 'failed' | 'pending';
  created_at: Date;
  updated_at: Date;
}

// API Client Interfaces
export interface FetchOptions {
  limit?: number;
  offset?: number;
  category?: string;
  search?: string;
  since?: Date;
  updated_since?: Date;
}

export interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  body?: unknown;
  timeout?: number;
  retry_count?: number;
}

export interface RateLimitConfig {
  requests_per_second: number;
  burst_limit: number;
  daily_limit?: number;
}

// API Response Types
export interface APIResponse<T> {
  data: T;
  error?: APIError;
  meta?: {
    total?: number;
    page?: number;
    limit?: number;
    has_more?: boolean;
  };
}

export interface APIError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}

// Mapper Interfaces
export interface ProductMapper<T extends ExternalProduct> {
  mapProduct(external: T): CreateProductData;
  mapVariants(external: T): CreateVariantData[];
  mapCategory(external: T): string;
  generateSKU(external: T): string;
}

export interface VariantMapper<T extends ExternalVariant> {
  mapVariant(external: T): CreateVariantData;
}

// Sync Manager Interface
export interface SyncManager {
  runSync(integration_id: string, type: SyncType): Promise<SyncResult>;
  scheduleSync(integration_id: string, interval_minutes: number): Promise<void>;
  cancelSync(sync_log_id: string): Promise<void>;
  getSyncStatus(sync_log_id: string): Promise<SyncLog>;
}

// Provider-specific configurations
export interface ShopifyConfig {
  shop_domain: string;
  access_token: string;
  api_version?: string; // default: '2023-10'
}

export interface WooCommerceConfig {
  site_url: string;
  consumer_key: string;
  consumer_secret: string;
  ssl_verify?: boolean; // default: true
}

export interface RapidAPIConfig {
  api_key: string;
  api_host: string;
  api_base_url: string;
}

// Admin Interface Types
export interface SyncProgress {
  sync_log_id: string;
  status: SyncStatus;
  progress_percentage: number;
  current_step: string;
  products_processed: number;
  products_total: number;
  started_at: Date;
  estimated_completion?: Date;
}

export interface IntegrationSummary {
  integration_id: string;
  integration_name: string;
  provider: APIProvider;
  is_active: boolean;
  last_sync_at?: Date;
  total_syncs: number;
  completed_syncs: number;
  failed_syncs: number;
  total_products_created: number;
  total_products_updated: number;
}

// Retry Configuration
export interface RetryConfig {
  max_retries: number;
  initial_delay_ms: number;
  max_delay_ms: number;
  backoff_multiplier: number;
  retryable_errors: string[];
  exponential_backoff?: boolean;
}

// Data Validation Types
export interface ValidationResult {
  is_valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
}

export interface ValidationError {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

export interface ValidationWarning {
  field: string;
  message: string;
  code: string;
  value?: unknown;
}

// Enhanced existing types with API integration support
export interface CreateProductData {
  name: string;
  slug?: string;
  description?: string;
  short_description?: string;
  sku: string;
  category_id: string;
  base_price: number;
  wholesale_price?: number;
  cost_price?: number;
  images?: string[];
  brand?: string;
  material?: string;
  care_instructions?: string;
  is_featured?: boolean;
  is_active?: boolean;
  meta_title?: string;
  meta_description?: string;
}

export interface CreateVariantData {
  product_id?: string;
  size: string;
  color?: string;
  color_hex?: string;
  sku: string;
  stock_quantity?: number;
  min_stock_level?: number;
  price: number;
  wholesale_price?: number;
  weight?: number;
  dimensions?: Record<string, number>;
}

// Batch operation types
export interface BatchOperation<T> {
  items: T[];
  chunk_size?: number;
  concurrent_limit?: number;
  on_progress?: (progress: BatchProgress) => void;
}

export interface BatchProgress {
  total: number;
  completed: number;
  failed: number;
  current_item?: string;
  errors: string[];
}

// Export utilities
export const API_PROVIDERS: APIProvider[] = [
  'fakestore',
  'shopify', 
  'woocommerce',
  'rapidapi',
  'dummyjson',
  'platzi'
];

export const SYNC_TYPES: SyncType[] = [
  'full',
  'incremental', 
  'manual',
  'webhook'
];

export const SYNC_STATUSES: SyncStatus[] = [
  'pending',
  'running',
  'completed',
  'failed',
  'cancelled'
];

export const ERROR_TYPES: ErrorType[] = [
  'network',
  'auth',
  'validation',
  'mapping',
  'database',
  'rate_limit'
];
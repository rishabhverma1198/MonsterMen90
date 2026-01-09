// Frontend Integration Helper - Consolidated Smart Client
// This file provides intelligent frontend integration for the Monster Backend

// =====================================================
// INTELLIGENT API CLIENT
// =====================================================

class MonsterAPIClient {
  constructor(baseURL = 'http://localhost:3001', options = {}) {
    this.baseURL = baseURL;
    this.options = {
      timeout: 10000,
      retries: 3,
      retryDelay: 1000,
      ...options
    };
    this.cache = new Map();
    this.schema = null;
  }

  // Generic request method with intelligent error handling
  async request(endpoint, options = {}) {
    const url = `${this.baseURL}${endpoint}`;
    const config = {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...options.headers
      },
      ...options
    };

    // Add auth token if available
    const token = this.getAuthToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    let lastError;
    let attempt = 0;
    const maxAttempts = this.options.retries;

    while (attempt < maxAttempts) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.options.timeout);
        
        const response = await fetch(url, {
          ...config,
          signal: controller.signal
        });
        
        clearTimeout(timeoutId);
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.message || `HTTP ${response.status}`);
        }

        return data;
      } catch (error) {
        lastError = error;
        attempt++;
        
        if (attempt < maxAttempts) {
          await this.delay(this.options.retryDelay * attempt);
          continue;
        }
      }
    }

    // Handle the final error with intelligent responses
    throw this.handleError(lastError, endpoint);
  }

  // Intelligent error handling with suggestions
  handleError(error, endpoint) {
    const errorInfo = {
      originalError: error,
      endpoint,
      timestamp: new Date().toISOString(),
      userMessage: 'An unexpected error occurred',
      suggestion: 'Please try again or contact support',
      supportId: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    };

    // Network errors
    if (error.name === 'AbortError') {
      errorInfo.userMessage = 'Request timed out';
      errorInfo.suggestion = 'Check your internet connection and try again';
      errorInfo.retryable = true;
    } else if (error.message.includes('fetch')) {
      errorInfo.userMessage = 'Cannot connect to server';
      errorInfo.suggestion = 'Make sure the backend server is running';
      errorInfo.retryable = true;
    } else if (error.message.includes('404')) {
      errorInfo.userMessage = 'The requested resource was not found';
      errorInfo.suggestion = 'The item may have been removed or the URL is incorrect';
    } else if (error.message.includes('409')) {
      errorInfo.userMessage = 'This item already exists';
      errorInfo.suggestion = 'Please check if you\'re creating a duplicate item';
    } else if (error.message.includes('400')) {
      errorInfo.userMessage = 'Invalid data provided';
      errorInfo.suggestion = 'Please check your input and try again';
    } else if (error.message.includes('500')) {
      errorInfo.userMessage = 'Server error occurred';
      errorInfo.suggestion = 'Please try again later or contact support';
    }

    const enhancedError = new Error(errorInfo.userMessage);
    enhancedError.info = errorInfo;
    enhancedError.retryable = errorInfo.retryable;
    
    return enhancedError;
  }

  // Delay utility for retries
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Authentication management
  setAuthToken(token) {
    localStorage.setItem('monster_auth_token', token);
  }

  getAuthToken() {
    return localStorage.getItem('monster_auth_token');
  }

  clearAuthToken() {
    localStorage.removeItem('monster_auth_token');
  }

  // Health check
  async checkHealth() {
    return await this.request('/health');
  }

  // Get API information
  async getAPIInfo() {
    return await this.request('/api');
  }
}

// =====================================================
// SMART PRODUCT MANAGER
// =====================================================

class SmartProductManager {
  constructor(apiClient) {
    this.api = apiClient;
    this.schema = null;
  }

  // Auto-detect product schema
  async detectProductSchema() {
    if (this.schema) return this.schema;
    
    try {
      const schemaData = await this.api.request('/api/schema');
      const productsSchema = schemaData.schema.products;
      
      if (productsSchema && productsSchema.exists) {
        this.schema = {
          columns: productsSchema.columns,
          required: this.getRequiredFields(productsSchema.columns),
          optional: this.getOptionalFields(productsSchema.columns)
        };
        return this.schema;
      }
    } catch (error) {
      console.warn('Could not detect product schema:', error.message);
    }
    
    // Fallback schema
    return {
      columns: ['name', 'base_price', 'brand', 'description'],
      required: ['name', 'base_price'],
      optional: ['brand', 'description', 'category_id', 'sku']
    };
  }

  getRequiredFields(columns) {
    // Smart detection of required fields
    const required = ['name', 'title', 'product_title'];
    return columns.filter(col => required.some(req => col.includes(req)));
  }

  getOptionalFields(columns) {
    const required = ['name', 'title', 'product_title'];
    return columns.filter(col => !required.some(req => col.includes(req)));
  }

  // Validate product data against schema
  validateProductData(data) {
    if (!this.schema) {
      throw new Error('Product schema not detected. Call detectProductSchema() first.');
    }

    const errors = [];
    const warnings = [];
    
    // Check required fields
    for (const field of this.schema.required) {
      if (!data[field] || data[field].toString().trim() === '') {
        errors.push(`${field} is required`);
      }
    }

    // Check data types and formats
    if (data.base_price && (isNaN(data.base_price) || data.base_price <= 0)) {
      errors.push('base_price must be a positive number');
    }

    if (data.sku && data.sku.length > 50) {
      warnings.push('SKU is quite long, consider shortening it');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      cleanedData: this.cleanProductData(data)
    };
  }

  cleanProductData(data) {
    const cleaned = { ...data };
    
    // Clean and normalize data
    if (cleaned.name) cleaned.name = cleaned.name.trim();
    if (cleaned.description) cleaned.description = cleaned.description.trim();
    if (cleaned.base_price) cleaned.base_price = parseFloat(cleaned.base_price);
    if (cleaned.is_active !== undefined) cleaned.is_active = Boolean(cleaned.is_active);
    
    return cleaned;
  }

  // Create product with auto-validation
  async createProduct(productData) {
    const schema = await this.detectProductSchema();
    const validation = this.validateProductData(productData);
    
    if (!validation.isValid) {
      throw new Error(`Validation failed: ${validation.errors.join(', ')}`);
    }

    try {
      const response = await this.api.request('/api/admin/products', {
        method: 'POST',
        body: JSON.stringify(validation.cleanedData)
      });

      return {
        success: true,
        product: response.data,
        message: response.message || 'Product created successfully'
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        suggestions: this.getProductCreationSuggestions(error)
      };
    }
  }

  getProductCreationSuggestions(error) {
    const suggestions = [];
    
    if (error.message.includes('duplicate')) {
      suggestions.push('Try a different SKU or product name');
    } else if (error.message.includes('required')) {
      suggestions.push('Make sure all required fields are filled');
    } else if (error.message.includes('foreign key')) {
      suggestions.push('Check that the category_id exists');
    } else {
      suggestions.push('Please try again or contact support');
    }
    
    return suggestions;
  }

  // Get products with intelligent filtering
  async getProducts(filters = {}) {
    try {
      let endpoint = '/api/products';
      
      // Add filters as query parameters
      const params = new URLSearchParams();
      if (filters.category_id) params.append('category_id', filters.category_id);
      if (filters.is_active !== undefined) params.append('is_active', filters.is_active);
      if (filters.gender) params.append('gender', filters.gender);
      if (filters.limit) params.append('limit', filters.limit);
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }

      const response = await this.api.request(endpoint);
      return {
        success: true,
        products: response.data || [],
        total: response.total || 0
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
        products: [],
        total: 0
      };
    }
  }
}

// =====================================================
// AUTO-SYNC MANAGER
// =====================================================

class AutoSyncManager {
  constructor(apiClient, productManager) {
    this.api = apiClient;
    this.productManager = productManager;
    this.isSyncing = false;
    this.lastSyncTime = null;
    this.syncInterval = null;
  }

  // Start automatic synchronization
  startAutoSync(intervalMs = 30000) {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
    }

    this.syncInterval = setInterval(() => {
      this.syncWithDatabase();
    }, intervalMs);

    console.log(`🔄 Auto-sync started (every ${intervalMs / 1000}s)`);
  }

  // Stop automatic synchronization
  stopAutoSync() {
    if (this.syncInterval) {
      clearInterval(this.syncInterval);
      this.syncInterval = null;
      console.log('⏹️ Auto-sync stopped');
    }
  }

  // Synchronize with database
  async syncWithDatabase() {
    if (this.isSyncing) return;
    
    this.isSyncing = true;
    try {
      console.log('🔄 Syncing with database...');
      
      // Update schema cache
      await this.productManager.detectProductSchema();
      
      // Check database health
      const health = await this.api.checkHealth();
      
      // Sync products if needed
      const products = await this.productManager.getProducts({ limit: 10 });
      
      this.lastSyncTime = new Date();
      console.log('✅ Database sync completed');
      
      return {
        success: true,
        health,
        productsCount: products.total,
        lastSync: this.lastSyncTime
      };
      
    } catch (error) {
      console.error('❌ Database sync failed:', error.message);
      return {
        success: false,
        error: error.message,
        lastSync: this.lastSyncTime
      };
    } finally {
      this.isSyncing = false;
    }
  }

  // Manual sync trigger
  async forceSync() {
    console.log('🔄 Manual sync triggered...');
    return await this.syncWithDatabase();
  }
}

// =====================================================
// FRONTEND INTEGRATION MAIN CLASS
// =====================================================

class MonsterFrontendIntegration {
  constructor(options = {}) {
    this.api = new MonsterAPIClient(options.baseURL, options.apiOptions);
    this.productManager = new SmartProductManager(this.api);
    this.autoSync = new AutoSyncManager(this.api, this.productManager);
    
    this.isInitialized = false;
    this.eventListeners = new Map();
  }

  // Initialize the integration
  async initialize() {
    try {
      console.log('🚀 Initializing Monster Frontend Integration...');
      
      // Check backend health
      const health = await this.api.checkHealth();
      console.log('✅ Backend connection established');
      
      // Detect product schema
      await this.productManager.detectProductSchema();
      console.log('✅ Product schema detected');
      
      // Setup auto-sync
      this.autoSync.startAutoSync();
      
      this.isInitialized = true;
      console.log('🎉 Frontend integration initialized successfully!');
      
      this.emit('initialized', { health });
      return true;
      
    } catch (error) {
      console.error('❌ Frontend integration failed:', error.message);
      this.emit('error', { error });
      return false;
    }
  }

  // Event system
  on(event, callback) {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event).push(callback);
  }

  emit(event, data) {
    if (this.eventListeners.has(event)) {
      this.eventListeners.get(event).forEach(callback => callback(data));
    }
  }

  // Public API methods
  async createProduct(productData) {
    return await this.productManager.createProduct(productData);
  }

  async getProducts(filters = {}) {
    return await this.productManager.getProducts(filters);
  }

  async syncDatabase() {
    return await this.autoSync.forceSync();
  }

  // Utility methods for UI components
  formatError(error) {
    if (error.info) {
      return {
        message: error.info.userMessage,
        suggestion: error.info.suggestion,
        supportId: error.info.supportId,
        retryable: error.retryable
      };
    }
    return {
      message: error.message,
      suggestion: 'Please try again',
      retryable: false
    };
  }

  // Clean up
  destroy() {
    this.autoSync.stopAutoSync();
    this.eventListeners.clear();
    this.isInitialized = false;
  }
}

// =====================================================
// DEFAULT EXPORT AND CONVENIENCE FUNCTIONS
// =====================================================

// Default instance for immediate use
const monsterIntegration = new MonsterFrontendIntegration();

// Convenience functions
export async function createProduct(productData) {
  return await monsterIntegration.createProduct(productData);
}

export async function getProducts(filters = {}) {
  return await monsterIntegration.getProducts(filters);
}

export async function syncWithDatabase() {
  return await monsterIntegration.syncDatabase();
}

export function formatProductError(error) {
  return monsterIntegration.formatError(error);
}

// Initialize on import (optional, can be disabled)
if (typeof window !== 'undefined') {
  // Browser environment
  window.MonsterIntegration = monsterIntegration;
}

export default monsterIntegration;

// Export all classes for advanced usage
export {
  MonsterFrontendIntegration,
  MonsterAPIClient,
  SmartProductManager,
  AutoSyncManager
};
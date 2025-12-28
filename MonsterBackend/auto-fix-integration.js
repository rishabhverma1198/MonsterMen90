// =====================================================
// SUPABASE AUTO-FIX BACKEND INTEGRATION
// Integrates the auto-fix system with the existing Monster Backend server
// =====================================================

import { SupabaseAutoFixSystem } from './supabase-auto-fix.js';
import { supabase } from './db/db.js';

/**
 * Enhanced server with integrated auto-fix system
 */
class AutoFixEnhancedServer {
  constructor() {
    this.autoFixSystem = null;
    this.isInitialized = false;
  }

  /**
   * Initialize the auto-fix system integration
   */
  async initialize() {
    console.log('🚀 Initializing Auto-Fix Enhanced Server...');
    
    try {
      // Create and initialize the auto-fix system
      this.autoFixSystem = new SupabaseAutoFixSystem({
        autoFixEnabled: process.env.AUTO_FIX_ENABLED !== 'false',
        monitoringEnabled: process.env.HEALTH_MONITORING_ENABLED !== 'false',
        alertOnFailure: process.env.ALERT_ON_FAILURE !== 'false',
        checkInterval: parseInt(process.env.HEALTH_CHECK_INTERVAL) || 60000,
        fixTimeout: parseInt(process.env.AUTO_FIX_TIMEOUT) || 30000
      });

      // Set up event listeners
      this.setupEventListeners();

      // Initialize the auto-fix system
      const initialized = await this.autoFixSystem.initialize();
      
      if (initialized) {
        this.isInitialized = true;
        console.log('✅ Auto-Fix Enhanced Server initialized successfully');
      } else {
        throw new Error('Failed to initialize auto-fix system');
      }

      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Auto-Fix Enhanced Server:', error);
      return false;
    }
  }

  /**
   * Set up event listeners for the auto-fix system
   */
  setupEventListeners() {
    // Listen for health check updates
    this.autoFixSystem.on('healthCheck', (result) => {
      console.log(`📊 Health check completed: ${result.status}`);
      if (result.issues && result.issues.length > 0) {
        console.log(`⚠️ Found ${result.issues.length} issues`);
      }
    });

    // Listen for auto-fix completions
    this.autoFixSystem.on('autoFixCompleted', (results) => {
      console.log(`🔧 Auto-fix completed: ${results.fixed.length} fixed, ${results.failed.length} failed`);
    });

    // Listen for alerts
    this.autoFixSystem.on('alert', (alert) => {
      console.log(`🚨 ALERT [${alert.level.toUpperCase()}]: ${alert.issues.length} issues`);
      
      // In production, you might want to send this to external alerting systems
      if (process.env.NODE_ENV === 'production') {
        this.sendExternalAlert(alert);
      }
    });

    // Listen for system events
    this.autoFixSystem.on('initialized', () => {
      console.log('🎉 Auto-Fix system fully initialized');
    });

    this.autoFixSystem.on('monitoringStarted', ({ interval }) => {
      console.log(`📊 Health monitoring started (interval: ${interval}ms)`);
    });

    this.autoFixSystem.on('monitoringStopped', () => {
      console.log('⏹️ Health monitoring stopped');
    });
  }

  /**
   * Send alert to external systems (placeholder implementation)
   */
  async sendExternalAlert(alert) {
    // This could integrate with:
    // - Slack webhooks
    // - Email services
    // - PagerDuty
    // - Discord webhooks
    // - SMS services
    // - etc.
    
    console.log(`📢 External alert would be sent: ${alert.level}`);
    
    // Example implementation for Slack:
    if (process.env.SLACK_WEBHOOK_URL) {
      try {
        await fetch(process.env.SLACK_WEBHOOK_URL, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: `🚨 Supabase Auto-Fix Alert [${alert.level.toUpperCase()}]`,
            attachments: [{
              color: alert.level === 'critical' ? 'danger' : 'warning',
              fields: [
                { title: 'Issues', value: alert.issues.length.toString(), short: true },
                { title: 'Timestamp', value: alert.timestamp, short: true }
              ]
            }]
          })
        });
      } catch (error) {
        console.error('Failed to send Slack alert:', error);
      }
    }
  }

  /**
   * Get auto-fix system status
   */
  getStatus() {
    return {
      autoFixInitialized: this.isInitialized,
      autoFixStatus: this.autoFixSystem?.getStatus() || null,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Manually trigger health check
   */
  async triggerHealthCheck() {
    if (!this.autoFixSystem) {
      throw new Error('Auto-fix system not initialized');
    }
    
    return await this.autoFixSystem.performHealthCheck();
  }

  /**
   * Manually trigger auto-fix for issues
   */
  async triggerAutoFix(issues) {
    if (!this.autoFixSystem) {
      throw new Error('Auto-fix system not initialized');
    }
    
    return await this.autoFixSystem.autoFixIssues(issues);
  }

  /**
   * Get frontend configuration for error handling
   */
  getFrontendConfig() {
    return this.autoFixSystem?.getFrontendConfig() || {};
  }

  /**
   * Handle frontend error with auto-fix integration
   */
  handleFrontendError(error, context = {}) {
    return this.autoFixSystem?.handleFrontendError(error, context) || {
      userMessage: 'An unexpected error occurred',
      technicalDetails: error.message,
      suggestions: ['Please try again'],
      autoFixAvailable: false,
      supportId: 'ERR_' + Date.now(),
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Export system data and logs
   */
  exportSystemData() {
    return this.autoFixSystem?.exportSystemData() || {
      timestamp: new Date().toISOString(),
      error: 'Auto-fix system not initialized'
    };
  }

  /**
   * Shutdown the auto-fix system
   */
  async shutdown() {
    if (this.autoFixSystem) {
      await this.autoFixSystem.shutdown();
    }
    this.isInitialized = false;
    console.log('🔄 Auto-Fix Enhanced Server shutdown completed');
  }
}

/**
 * Express middleware for auto-fix integration
 */
export function createAutoFixMiddleware() {
  const autoFixServer = new AutoFixEnhancedServer();
  
  // Middleware to add auto-fix functionality to requests
  return {
    // Initialize middleware
    initialize: async (req, res, next) => {
      try {
        if (!autoFixServer.isInitialized) {
          await autoFixServer.initialize();
        }
        req.autoFix = autoFixServer;
        next();
      } catch (error) {
        console.error('Auto-fix middleware initialization failed:', error);
        next(error);
      }
    },

    // Health check endpoint
    healthCheck: async (req, res) => {
      try {
        const result = await autoFixServer.triggerHealthCheck();
        res.json({
          success: true,
          autoFix: result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },

    // System status endpoint
    status: async (req, res) => {
      try {
        const status = autoFixServer.getStatus();
        res.json({
          success: true,
          status,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },

    // Frontend configuration endpoint
    frontendConfig: async (req, res) => {
      try {
        const config = autoFixServer.getFrontendConfig();
        res.json({
          success: true,
          config,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },

    // Manual fix trigger endpoint
    triggerFix: async (req, res) => {
      try {
        const { issues } = req.body;
        const result = await autoFixServer.triggerAutoFix(issues);
        res.json({
          success: true,
          result,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },

    // Export system data endpoint
    exportData: async (req, res) => {
      try {
        const data = autoFixServer.exportSystemData();
        res.json({
          success: true,
          data,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        res.status(500).json({
          success: false,
          error: error.message,
          timestamp: new Date().toISOString()
        });
      }
    },

    // Error handler with auto-fix integration
    errorHandler: (error, req, res, next) => {
      console.error('Auto-Fix Enhanced Error Handler:', {
        error: error.message,
        url: req.url,
        method: req.method,
        timestamp: new Date().toISOString()
      });

      // Use auto-fix system to handle the error
      const handledError = autoFixServer.handleFrontendError(error, {
        url: req.url,
        method: req.method,
        userAgent: req.get('User-Agent'),
        ip: req.ip
      });

      // Determine appropriate HTTP status code
      let statusCode = 500;
      
      if (error.name === 'ValidationError') {
        statusCode = 400;
      } else if (error.code === '23505') { // Duplicate key
        statusCode = 409;
      } else if (error.code === '23503') { // Foreign key violation
        statusCode = 400;
      } else if (error.code === '23502') { // Not null violation
        statusCode = 400;
      } else if (error.code === '42501') { // Insufficient privilege
        statusCode = 403;
      }

      res.status(statusCode).json({
        success: false,
        error: handledError.userMessage,
        message: error.message,
        timestamp: new Date().toISOString(),
        path: req.originalUrl,
        method: req.method,
        suggestions: handledError.suggestions,
        support: {
          errorId: handledError.supportId,
          contact: 'backend-support@monsterapparel.com'
        },
        autoFix: {
          available: handledError.autoFixAvailable,
          retryable: handledError.retryable
        }
      });
    },

    // Get the auto-fix server instance
    getServer: () => autoFixServer
  };
}

// =====================================================
// INTEGRATION WITH EXISTING SERVER
// =====================================================

/**
 * Enhance existing Express app with auto-fix functionality
 */
export function enhanceExpressApp(app) {
  const autoFixMiddleware = createAutoFixMiddleware();
  
  // Add auto-fix middleware
  app.use(autoFixMiddleware.initialize);
  
  // Add auto-fix endpoints
  app.get('/api/auto-fix/health', autoFixMiddleware.healthCheck);
  app.get('/api/auto-fix/status', autoFixMiddleware.status);
  app.get('/api/auto-fix/frontend-config', autoFixMiddleware.frontendConfig);
  app.post('/api/auto-fix/trigger-fix', autoFixMiddleware.triggerFix);
  app.get('/api/auto-fix/export', autoFixMiddleware.exportData);
  
  // Replace error handler with auto-fix enhanced version
  app.use(autoFixMiddleware.errorHandler);
  
  console.log('✅ Express app enhanced with auto-fix functionality');
  
  return autoFixMiddleware.getServer();
}

// =====================================================
// STANDALONE SERVER ENHANCEMENT
// =====================================================

/**
 * Create enhanced version of the main server
 */
export function createEnhancedServer() {
  const express = require('express');
  const cors = require('cors');
  const helmet = require('helmet');
  const morgan = require('morgan');
  const compression = require('compression');
  const rateLimit = require('express-rate-limit');
  
  const app = express();
  
  // Apply existing middleware (similar to server.js)
  app.use(helmet());
  app.use(cors({
    origin: [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://aodcnddokedzwhjuzmpq.supabase.co',
      process.env.FRONTEND_URL
    ].filter(Boolean),
    credentials: true
  }));
  
  app.use(express.json({ limit: '10mb' }));
  app.use(compression());
  app.use(morgan('combined'));
  
  // Rate limiting
  const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 1000
  });
  app.use(limiter);
  
  // Import existing routes (you would need to adjust these imports)
  // const productsRouter = require('./routes/products.routes.js');
  // const adminProductsRouter = require('./routes/admin-products.routes.js');
  // etc.
  
  // Import route setup from original server
  const setupRoutes = require('./server.js').setupRoutes;
  if (setupRoutes) {
    setupRoutes(app);
  }
  
  // Enhance with auto-fix
  const autoFixServer = enhanceExpressApp(app);
  
  return {
    app,
    autoFixServer,
    port: process.env.PORT || 3001
  };
}

// =====================================================
// DEFAULT EXPORTS AND CONVENIENCE FUNCTIONS
// =====================================================

// Create default instance
const autoFixEnhancedServer = new AutoFixEnhancedServer();

// Convenience functions for easy integration
export async function initializeAutoFixIntegration() {
  return await autoFixEnhancedServer.initialize();
}

export function getAutoFixStatus() {
  return autoFixEnhancedServer.getStatus();
}

export async function triggerAutoFixHealthCheck() {
  return await autoFixEnhancedServer.triggerHealthCheck();
}

export function getAutoFixFrontendConfig() {
  return autoFixEnhancedServer.getFrontendConfig();
}

export function handleAutoFixError(error, context) {
  return autoFixEnhancedServer.handleFrontendError(error, context);
}

export async function shutdownAutoFixIntegration() {
  return await autoFixEnhancedServer.shutdown();
}

// Functions are already exported individually above
// Default export is provided below

export default autoFixEnhancedServer;

// Make available globally in browser environment
if (typeof window !== 'undefined') {
  window.AutoFixEnhancedServer = AutoFixEnhancedServer;
  window.autoFixEnhancedServer = autoFixEnhancedServer;
}
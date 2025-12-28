import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

// Import routes
import productsRouter from './routes/products.routes.js';
import adminProductsRouter from './routes/admin-products.routes.js';
import userManagementRouter from './routes/user-management.routes.js';
import orderManagementRouter from './routes/order-management.routes.js';
import adminStockRouter from './routes/adminStock.routes.js';
import inventoryRouter from './routes/inventory.routes.js';

// Import database connection and test
import { supabase, testConnection } from './db/db.js';
import { enhanceExpressApp } from './auto-fix-integration.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// =====================================================
// INTELLIGENT SCHEMA DETECTION SYSTEM
// =====================================================

class IntelligentSchemaDetector {
  constructor(supabaseClient) {
    this.supabase = supabaseClient;
    this.schemaCache = new Map();
    this.tableCache = new Map();
  }

  async detectDatabaseSchema() {
    console.log('🧠 Intelligent Backend: Scanning database schema...');
    
    try {
      // Get all tables in public schema
      const { data: tables, error } = await this.supabase
        .rpc('get_schema_info'); // Custom function we'll create
      
      if (error) {
        console.log('Using fallback table detection...');
        return await this.fallbackTableDetection();
      }
      
      return tables;
    } catch (err) {
      console.log('Schema detection failed, using fallback:', err.message);
      return await this.fallbackTableDetection();
    }
  }

  async fallbackTableDetection() {
    const commonTables = [
      'products', 'categories', 'product_variants', 'users', 
      'orders', 'order_items', 'user_addresses', 'discounts',
      'price_rules', 'stock_movements', 'admin_low_stock_alerts'
    ];
    
    const detectedTables = {};
    
    for (const tableName of commonTables) {
      try {
        const { data, error } = await this.supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (!error) {
          detectedTables[tableName] = {
            exists: true,
            columns: data && data[0] ? Object.keys(data[0]) : [],
            sample: data && data[0] ? data[0] : null
          };
          console.log(`✅ Detected table: ${tableName}`);
        }
      } catch (err) {
        detectedTables[tableName] = {
          exists: false,
          columns: [],
          sample: null
        };
        console.log(`❌ Table not found: ${tableName}`);
      }
    }
    
    return detectedTables;
  }

  async getTableColumns(tableName) {
    if (this.schemaCache.has(tableName)) {
      return this.schemaCache.get(tableName);
    }

    try {
      const { data, error } = await this.supabase
        .from(tableName)
        .select('*')
        .limit(1);
      
      if (error) {
        console.log(`Error getting columns for ${tableName}:`, error.message);
        return [];
      }

      const columns = data && data[0] ? Object.keys(data[0]) : [];
      this.schemaCache.set(tableName, columns);
      return columns;
    } catch (err) {
      console.log(`Exception getting columns for ${tableName}:`, err.message);
      return [];
    }
  }
}

// =====================================================
// DYNAMIC API GENERATOR
// =====================================================

class DynamicAPIGenerator {
  constructor(schemaDetector) {
    this.schemaDetector = schemaDetector;
  }

  generateCRUDRoutes(tableName) {
    console.log(`🔧 Creating router for table: ${tableName}`);
    const router = express.Router();
    
    console.log(`🔧 Adding GET / route for ${tableName}`);
    // GET all records
    router.get('/', async (req, res) => {
      console.log(`📝 GET /api/dynamic/${tableName} accessed`);
      try {
        const { data, error, count } = await supabase
          .from(tableName)
          .select('*', { count: 'exact' })
          .range(0, 99); // Limit to 100 records
        
        if (error) {
          return this.handleError(res, error, 'Failed to fetch records');
        }
        
        res.json({
          success: true,
          data: data || [],
          total: count || 0,
          message: `Successfully fetched ${data?.length || 0} records from ${tableName}`
        });
      } catch (err) {
        this.handleError(res, err, 'Unexpected error occurred');
      }
    });

    console.log(`🔧 Router created for ${tableName} with routes:`, router.stack.map(layer => layer.route?.path));
    return router;
  }

  handleError(res, error, defaultMessage) {
    console.error('Database Error:', error);
    
    const errorResponse = {
      success: false,
      error: 'Database Error',
      message: error.message || defaultMessage,
      timestamp: new Date().toISOString()
    };

    // Add specific error details
    if (error.code) {
      errorResponse.errorCode = error.code;
    }
    
    if (error.details) {
      errorResponse.details = error.details;
    }

    // Determine appropriate HTTP status code
    let statusCode = 500;
    
    if (error.message?.includes('not found')) {
      statusCode = 404;
    } else if (error.message?.includes('duplicate') || error.code === '23505') {
      statusCode = 409;
    } else if (error.message?.includes('required') || error.code === '23502') {
      statusCode = 400;
    } else if (error.message?.includes('permission') || error.code === '42501') {
      statusCode = 403;
    }
    
    res.status(statusCode).json(errorResponse);
  }
}

// =====================================================
// INTELLIGENT BACKEND INITIALIZATION
// =====================================================

class IntelligentBackend {
  constructor() {
    this.schemaDetector = new IntelligentSchemaDetector(supabase);
    this.apiGenerator = new DynamicAPIGenerator(this.schemaDetector);
    this.isInitialized = false;
  }

  async initialize() {
    console.log('🚀 Initializing Intelligent Backend...');
    
    try {
      // Test database connection
      console.log('🔗 Testing database connection...');
      const isConnected = await testConnection();
      
      if (!isConnected) {
        throw new Error('Failed to connect to database');
      }

      // Detect database schema
      console.log('🧠 Detecting database schema...');
      const schema = await this.schemaDetector.detectDatabaseSchema();
      console.log('✅ Schema detection completed');
      
      // Skip dynamic route generation during initialization - will be done after server starts
      console.log('⏭️ Skipping dynamic route generation during initialization');
      
      this.isInitialized = true;
      console.log('🎉 Intelligent Backend initialized successfully!');
      
      return true;
    } catch (error) {
      console.error('❌ Failed to initialize Intelligent Backend:', error);
      return false;
    }
  }

  async generateDynamicRoutes(schema) {
    console.log('🔧 Starting dynamic route generation for schema:', Object.keys(schema));
    
    for (const [tableName, tableInfo] of Object.entries(schema)) {
      if (!tableInfo.exists) {
        console.log(`⏭️ Skipping non-existent table: ${tableName}`);
        continue;
      }
      
      console.log(`🔧 Generating routes for table: ${tableName}`);
      const router = this.apiGenerator.generateCRUDRoutes(tableName);
      
      // Add public API route
      app.use(`/api/dynamic/${tableName}`, router);
      console.log(`✅ Added public route: /api/dynamic/${tableName}`);
      
      // Add admin API route
      app.use(`/api/admin/dynamic/${tableName}`, router);
      console.log(`✅ Added admin route: /api/admin/dynamic/${tableName}`);
      
      console.log(`✅ Generated routes for table: ${tableName}`);
    }
    
    console.log('🎉 Dynamic route generation completed!');
  }

  getStatus() {
    return {
      initialized: this.isInitialized,
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      schema: this.schemaDetector.schemaCache.size,
      tables: this.schemaDetector.tableCache.size
    };
  }
}

// Initialize intelligent backend
const intelligentBackend = new IntelligentBackend();

// Initialize auto-fix integration
const autoFixServer = enhanceExpressApp(app);

// Add auto-fix monitoring endpoints
app.get('/api/auto-fix/status', (req, res) => {
  const status = autoFixServer.getSystemStatus();
  res.json({
    success: true,
    auto_fix_status: status,
    timestamp: new Date().toISOString()
  });
});

app.get('/api/auto-fix/health', async (req, res) => {
  const health = await autoFixServer.getHealthStatus();
  res.json({
    success: true,
    auto_fix_health: health,
    timestamp: new Date().toISOString()
  });
});

// Auto-fix system alerts endpoint
app.get('/api/auto-fix/alerts', (req, res) => {
  const alerts = autoFixServer.getRecentAlerts();
  res.json({
    success: true,
    alerts: alerts,
    timestamp: new Date().toISOString()
  });
});

// Manual auto-fix trigger
app.post('/api/auto-fix/trigger', async (req, res) => {
  try {
    const { component = 'all' } = req.body;
    const result = await autoFixServer.triggerAutoFix(component);
    
    res.json({
      success: true,
      message: `Auto-fix triggered for component: ${component}`,
      result: result,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Auto-fix trigger failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// =====================================================
// MIDDLEWARE SETUP
// =====================================================

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // limit each IP to 1000 requests per windowMs
  message: {
    success: false,
    error: 'Rate Limit Exceeded',
    message: 'Too many requests from this IP, please try again later.'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(limiter);

// CORS configuration
const corsOptions = {
  origin: [
    'http://localhost:3000',
    'http://localhost:5173',
    'https://aodcnddokedzwhjuzmpq.supabase.co',
    process.env.FRONTEND_URL
  ].filter(Boolean),
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: [
    'Origin', 'X-Requested-With', 'Content-Type', 
    'Accept', 'Authorization', 'Cache-Control', 'X-Access-Token'
  ]
};

app.use(cors(corsOptions));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('combined'));
}

// =====================================================
// INTELLIGENT ENDPOINTS
// =====================================================

// Simple test route to verify dynamic routing works
app.get('/api/test-dynamic', (req, res) => {
  console.log('✅ Test dynamic route accessed!');
  res.json({
    success: true,
    message: 'Dynamic routing test successful',
    timestamp: new Date().toISOString()
  });
});

// Health check with detailed status
app.get('/health', (req, res) => {
  const status = intelligentBackend.getStatus();
  
  res.json({
    success: true,
    status: 'OK',
    backend: 'Intelligent Monster Backend',
    version: '2.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: status.initialized ? 'Connected' : 'Disconnected',
    memory: status.memory,
    schema_cached: status.schema,
    tables_cached: status.tables
  });
});

// Backend information and capabilities
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Intelligent Monster Backend',
    version: '2.0.0',
    description: 'Smart, adaptive backend with auto-schema detection',
    features: [
      'Auto-schema detection',
      'Dynamic API generation',
      'Intelligent error handling',
      'Self-healing capabilities',
      'Auto-error detection and resolution',
      'Frontend error handling',
      'Real-time database sync',
      'Health monitoring and alerts'
    ],
    endpoints: {
      dynamic: '/api/dynamic/{table_name}',
      admin_dynamic: '/api/admin/dynamic/{table_name}',
      static: {
        products: '/api/products',
        admin_products: '/api/admin/products',
        users: '/api/users',
        orders: '/api/orders',
        inventory: '/api/inventory',
        stock: '/api/admin/stock'
      }
    },
    capabilities: {
      schema_detection: true,
      dynamic_routing: true,
      error_handling: true,
      auto_healing: true,
      auto_fix: true,
      health_monitoring: true,
      frontend_integration: true
    }
  });
});

// Schema information endpoint
app.get('/api/schema', async (req, res) => {
  try {
    const schema = await intelligentBackend.schemaDetector.detectDatabaseSchema();
    
    res.json({
      success: true,
      schema: schema,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get schema information',
      message: error.message
    });
  }
});

// Dynamic table information
app.get('/api/tables', async (req, res) => {
  try {
    const schema = await intelligentBackend.schemaDetector.detectDatabaseSchema();
    
    const tableInfo = Object.entries(schema)
      .filter(([_, info]) => info.exists)
      .map(([name, info]) => ({
        name,
        columns: info.columns,
        sample: info.sample ? Object.keys(info.sample) : [],
        has_data: info.sample !== null
      }));
    
    res.json({
      success: true,
      tables: tableInfo,
      total_tables: tableInfo.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: 'Failed to get table information',
      message: error.message
    });
  }
});

// =====================================================
// STATIC API ROUTES (Original Routes)
// =====================================================

// API routes
app.use('/api/products', productsRouter);
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/users', userManagementRouter);
app.use('/api/orders', orderManagementRouter);
app.use('/api/admin/stock', adminStockRouter);
app.use('/api/inventory', inventoryRouter);

// =====================================================
// INTELLIGENT ERROR HANDLER
// =====================================================

app.use((err, req, res, next) => {
  console.error('🚨 Intelligent Error Handler:', {
    error: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  // Determine error type and provide intelligent response
  let statusCode = 500;
  let errorType = 'Internal Server Error';
  let suggestion = 'Please contact support if this error persists';

  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorType = 'Validation Error';
    suggestion = 'Please check your input data and try again';
  } else if (err.code === '23505') {
    statusCode = 409;
    errorType = 'Duplicate Entry';
    suggestion = 'The record you are trying to create already exists';
  } else if (err.code === '23503') {
    statusCode = 400;
    errorType = 'Foreign Key Error';
    suggestion = 'Please ensure all referenced records exist';
  } else if (err.code === '23502') {
    statusCode = 400;
    errorType = 'Required Field Missing';
    suggestion = 'Please provide all required fields';
  }

  const errorResponse = {
    success: false,
    error: errorType,
    message: err.message,
    timestamp: new Date().toISOString(),
    path: req.originalUrl,
    method: req.method,
    suggestion: suggestion,
    support: {
      error_id: `ERR_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      contact: 'backend-support@monsterapparel.com'
    }
  };

  // Add stack trace in development
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
  }

  res.status(statusCode).json(errorResponse);
});

// 404 handler for API routes - only for unknown API endpoints
app.use('/api/*', (req, res, next) => {
  // Check if this is a known API pattern
  const url = req.originalUrl;
  const isKnownPattern = 
    url.startsWith('/api/products') ||
    url.startsWith('/api/admin/products') ||
    url.startsWith('/api/users') ||
    url.startsWith('/api/orders') ||
    url.startsWith('/api/inventory') ||
    url.startsWith('/api/admin/stock') ||
    url.startsWith('/api/dynamic/') ||
    url.startsWith('/api/admin/dynamic/') ||
    url.startsWith('/api/auto-fix/') ||
    url === '/api' ||
    url === '/api/schema' ||
    url === '/api/tables';
    
  if (!isKnownPattern) {
    res.status(404).json({
      success: false,
      error: 'API Endpoint Not Found',
      message: `The endpoint ${req.originalUrl} does not exist`,
      timestamp: new Date().toISOString(),
      available_endpoints: '/api (for full list)',
      suggestion: 'Check the /api endpoint for available routes'
    });
  } else {
    // This shouldn't happen, but pass to next handler if it does
    next();
  }
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint Not Found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString(),
    suggestion: 'Check the /api endpoint for available routes'
  });
});

// =====================================================
// SERVER STARTUP
// =====================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Intelligent Monster Backend...');
    
    // Initialize intelligent backend
    const initialized = await intelligentBackend.initialize();
    
    if (!initialized) {
      console.error('❌ Failed to initialize intelligent backend');
      process.exit(1);
    }

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🧠 Intelligent Monster Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API info: http://localhost:${PORT}/api`);
      console.log(`🗄️  Schema info: http://localhost:${PORT}/api/schema`);
      console.log(`📋 Tables info: http://localhost:${PORT}/api/tables`);
      console.log(`🔧 Auto-fix status: http://localhost:${PORT}/api/auto-fix/status`);
      console.log(`🩺 Auto-fix status: http://localhost:${PORT}/api/auto-fix/status`);
    console.log(`🩺 Auto-fix health: http://localhost:${PORT}/api/auto-fix/health`);
    console.log(`🔔 Auto-fix alerts: http://localhost:${PORT}/api/auto-fix/alerts`);
    console.log(`🔧 Auto-fix trigger: POST http://localhost:${PORT}/api/auto-fix/trigger`);
      console.log('✅ Intelligent Auto-Fix Backend is ready and adaptive!');
      
      // Add dynamic routes after server starts listening
      console.log('🔧 Adding dynamic routes after server startup...');
      addDynamicRoutes();
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start Intelligent Backend:', error);
    process.exit(1);
  }
};

// Function to add dynamic routes after server startup
function addDynamicRoutes() {
  console.log('🔧 Starting dynamic route addition...');
  
  // Get the current schema and add routes
  intelligentBackend.schemaDetector.detectDatabaseSchema().then(schema => {
    console.log('🔧 Detected schema for route addition:', Object.keys(schema));
    
    for (const [tableName, tableInfo] of Object.entries(schema)) {
      if (!tableInfo.exists) {
        console.log(`⏭️ Skipping non-existent table: ${tableName}`);
        continue;
      }
      
      console.log(`🔧 Adding dynamic route for table: ${tableName}`);
      const router = intelligentBackend.apiGenerator.generateCRUDRoutes(tableName);
      
      // Add public API route
      app.use(`/api/dynamic/${tableName}`, router);
      console.log(`✅ Added public route: /api/dynamic/${tableName}`);
      
      // Add admin API route
      app.use(`/api/admin/dynamic/${tableName}`, router);
      console.log(`✅ Added admin route: /api/admin/dynamic/${tableName}`);
    }
    
    console.log('🎉 Dynamic routes added successfully after server startup!');
  }).catch(error => {
    console.error('❌ Failed to add dynamic routes:', error);
  });
}

startServer();

export default app;
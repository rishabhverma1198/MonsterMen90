import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';

// Import routes
import productsRouter from './routes/products.routes.js';
import adminProductsRouter from './routes/admin-products.routes.js';
import userManagementRouter from './routes/user-management.routes.js';
import orderManagementRouter from './routes/order-management.routes.js';
import adminStockRouter from './routes/adminStock.routes.js';
import inventoryRouter from './routes/inventory.routes.js';

// Import database connection
import { supabase, supabaseAdmin, testConnection } from './db/db.js';

// Import authentication middleware (Supabase-based, used by frontend)
import { authenticateUser, requireAdmin } from './middleware/auth.middleware.js';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production';

// =====================================================
// AUTHENTICATION MIDDLEWARE
// =====================================================

// Verify JWT token
const authenticateToken = async (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Access denied',
      message: 'No token provided'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    
    // Verify user still exists and get updated user_type
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, user_type, full_name, is_active')
      .eq('id', decoded.userId)
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        success: false,
        error: 'Account disabled',
        message: 'User account is disabled'
      });
    }

    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
};

// Note: requireAdmin is imported from middleware/auth.middleware.js above

// =====================================================
// AUTHENTICATION ROUTES
// =====================================================

// Admin Login
app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Bad Request',
        message: 'Email and password are required'
      });
    }

    // Find user by email
    const { data: user, error } = await supabase
      .from('users')
      .select('id, email, password_hash, user_type, full_name, is_active')
      .eq('email', email.toLowerCase())
      .single();

    if (error || !user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed',
        message: 'Invalid email or password'
      });
    }

    // Check if user is admin
    if (user.user_type !== 'admin') {
      return res.status(403).json({
        success: false,
        error: 'Forbidden',
        message: 'Admin access required'
      });
    }

    // Check if account is active
    if (!user.is_active) {
      return res.status(403).json({
        success: false,
        error: 'Account disabled',
        message: 'Your account has been disabled'
      });
    }

    // Generate JWT token
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email, 
        user_type: user.user_type 
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    // Remove password hash from response
    const { password_hash, ...userWithoutPassword } = user;

    res.json({
      success: true,
      message: 'Login successful',
      token,
      user: userWithoutPassword
    });

  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An error occurred during login'
    });
  }
});

// Verify token (supports both JWT and Supabase tokens)
app.get('/api/auth/verify', async (req, res) => {
  try {
    // Try Supabase auth first (what frontend uses)
    const authHeader = req.headers['authorization'];
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user }, error: authError } = await supabase.auth.getUser(token);
      
      if (!authError && user) {
        // Get user profile from database with proper error handling
        const { data: userProfile, error: profileError } = await supabaseAdmin
          .from('users')
          .select('id, email, user_type, full_name, is_active, created_at, updated_at')
          .eq('id', user.id)
          .single();
        
        // Check for database query errors
        if (profileError) {
          console.error('[Auth Verify] Database query error:', profileError);
          return res.status(500).json({
            success: false,
            error: 'Database query failed',
            message: 'Failed to retrieve user profile. Please try again.'
          });
        }
        
        // Check if user profile exists
        if (!userProfile) {
          console.warn('[Auth Verify] User profile not found for ID:', user.id);
          return res.status(404).json({
            success: false,
            error: 'User profile not found',
            message: 'User profile does not exist in the database. Please contact support.'
          });
        }
        
        // Verify all required fields are present
        if (!userProfile.user_type || !userProfile.email) {
          console.error('[Auth Verify] Incomplete user profile:', userProfile);
          return res.status(500).json({
            success: false,
            error: 'Incomplete user profile',
            message: 'User profile is missing required fields. Please contact support.'
          });
        }
        
        return res.json({
          success: true,
          message: 'Token is valid',
          user: userProfile
        });
      }
    }
    
    // Fallback to JWT verification (for backward compatibility)
    try {
      const decoded = jwt.verify(authHeader?.split(' ')[1] || '', JWT_SECRET);
      const { data: user, error: userError } = await supabaseAdmin
        .from('users')
        .select('id, email, user_type, full_name, is_active, created_at, updated_at')
        .eq('id', decoded.userId)
        .single();
      
      // Check for database query errors
      if (userError) {
        console.error('[Auth Verify] JWT path - Database query error:', userError);
        return res.status(500).json({
          success: false,
          error: 'Database query failed',
          message: 'Failed to retrieve user profile. Please try again.'
        });
      }
      
      // Check if user exists
      if (!user) {
        console.warn('[Auth Verify] JWT path - User not found for ID:', decoded.userId);
        return res.status(404).json({
          success: false,
          error: 'User not found',
          message: 'User does not exist in the database.'
        });
      }
      
      // Verify all required fields are present
      if (!user.user_type || !user.email) {
        console.error('[Auth Verify] JWT path - Incomplete user profile:', user);
        return res.status(500).json({
          success: false,
          error: 'Incomplete user profile',
          message: 'User profile is missing required fields. Please contact support.'
        });
      }
      
      return res.json({
        success: true,
        message: 'Token is valid',
        user: user
      });
    } catch (jwtError) {
      // JWT verification failed
      console.error('[Auth Verify] JWT verification error:', jwtError.message);
      return res.status(401).json({
        success: false,
        error: 'Invalid token',
        message: 'Token verification failed'
      });
    }
  } catch (error) {
    console.error('[Auth Verify] Unexpected error:', error);
    return res.status(500).json({
      success: false,
      error: 'Internal server error',
      message: 'An unexpected error occurred during token verification'
    });
  }
});

// =====================================================
// SECURITY MIDDLEWARE
// =====================================================

// Security headers
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
// ADMIN ROUTES (Protected)
// =====================================================

// All admin routes require authentication and admin role
// Note: Routes already have authenticateUser and requireAdmin middleware, so we don't need to add them here
app.use('/api/admin/products', adminProductsRouter);
app.use('/api/admin/users', userManagementRouter);
app.use('/api/admin/orders', orderManagementRouter);
app.use('/api/admin/stock', adminStockRouter);
app.use('/api/inventory', inventoryRouter);

// Public product routes
app.use('/api/products', productsRouter);

// =====================================================
// ANALYTICS ROUTES
// =====================================================

// Sales Analytics
app.get('/api/admin/analytics/sales', authenticateUser, requireAdmin, async (req, res) => {
  try {
    // Get sales data for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const { data: orders, error } = await supabase
      .from('orders')
      .select('id, total_amount, created_at, status')
      .gte('created_at', thirtyDaysAgo.toISOString())
      .eq('status', 'completed');

    if (error) throw error;

    // Process sales data
    const salesByDay = {};
    let totalSales = 0;
    let totalOrders = 0;

    orders.forEach(order => {
      const date = new Date(order.created_at).toISOString().split('T')[0];
      if (!salesByDay[date]) {
        salesByDay[date] = { revenue: 0, orders: 0 };
      }
      salesByDay[date].revenue += order.total_amount;
      salesByDay[date].orders += 1;
      totalSales += order.total_amount;
      totalOrders += 1;
    });

    res.json({
      success: true,
      data: {
        totalSales,
        totalOrders,
        averageOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        salesByDay,
        period: '30 days'
      }
    });

  } catch (error) {
    console.error('Sales analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics error',
      message: error.message
    });
  }
});

// Product Analytics
app.get('/api/admin/analytics/products', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data: products, error } = await supabaseAdmin
      .from('products')
      .select('id, name, stock_quantity, price, is_active, category')
      .eq('is_active', true);

    if (error) throw error;

    // Calculate analytics
    const totalProducts = products.length;
    const lowStockProducts = products.filter(p => p.stock_quantity < 10).length;
    const totalValue = products.reduce((sum, p) => sum + (p.price * p.stock_quantity), 0);

    // Group by category
    const categoryBreakdown = {};
    products.forEach(product => {
      const category = product.category || 'Uncategorized';
      if (!categoryBreakdown[category]) {
        categoryBreakdown[category] = { count: 0, totalValue: 0 };
      }
      categoryBreakdown[category].count += 1;
      categoryBreakdown[category].totalValue += product.price * product.stock_quantity;
    });

    res.json({
      success: true,
      data: {
        totalProducts,
        lowStockProducts,
        totalValue,
        categoryBreakdown,
        products
      }
    });

  } catch (error) {
    console.error('Product analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics error',
      message: error.message
    });
  }
});

// User Analytics
app.get('/api/admin/analytics/users', authenticateUser, requireAdmin, async (req, res) => {
  try {
    const { data: users, error } = await supabaseAdmin
      .from('users')
      .select('id, user_type, created_at, is_active');

    if (error) throw error;

    // Calculate user analytics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.is_active).length;
    const adminUsers = users.filter(u => u.user_type === 'admin').length;
    const buyerUsers = users.filter(u => u.user_type === 'buyer').length;
    const wholesalerUsers = users.filter(u => u.user_type === 'wholeseller').length;

    // Users by month (last 12 months)
    const usersByMonth = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const monthKey = date.toISOString().slice(0, 7); // YYYY-MM
      usersByMonth[monthKey] = 0;
    }

    users.forEach(user => {
      const monthKey = user.created_at.slice(0, 7);
      if (usersByMonth.hasOwnProperty(monthKey)) {
        usersByMonth[monthKey] += 1;
      }
    });

    res.json({
      success: true,
      data: {
        totalUsers,
        activeUsers,
        roleBreakdown: {
          admin: adminUsers,
          buyer: buyerUsers,
          wholesaler: wholesalerUsers
        },
        usersByMonth,
        users
      }
    });

  } catch (error) {
    console.error('User analytics error:', error);
    res.status(500).json({
      success: false,
      error: 'Analytics error',
      message: error.message
    });
  }
});

// Real-time Status
app.get('/api/admin/realtime/status', authenticateUser, requireAdmin, (req, res) => {
  res.json({
    success: true,
    data: {
      database: 'connected',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      status: 'operational'
    }
  });
});

// =====================================================
// UTILITY ROUTES
// =====================================================

// Health check
app.get('/health', (req, res) => {
  res.json({
    success: true,
    status: 'OK',
    backend: 'Monster Backend',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// API info
app.get('/api', (req, res) => {
  res.json({
    success: true,
    name: 'Monster Backend',
    version: '1.0.0',
    description: 'Clean, functional backend for MonsterMen90',
    endpoints: {
      auth: {
        login: 'POST /api/auth/login',
        verify: 'GET /api/auth/verify'
      },
      admin: {
        products: 'GET/POST/PUT/DELETE /api/admin/products',
        users: 'GET/POST/PUT/DELETE /api/admin/users',
        orders: 'GET/POST/PUT/PATCH /api/admin/orders',
        stock: 'GET/POST/PATCH /api/admin/stock'
      },
      analytics: {
        sales: 'GET /api/admin/analytics/sales',
        products: 'GET /api/admin/analytics/products',
        users: 'GET /api/admin/analytics/users'
      },
      realtime: {
        status: 'GET /api/admin/realtime/status'
      }
    }
  });
});

// Database health check
app.get('/api/health', async (req, res) => {
  try {
    const isConnected = await testConnection();
    
    res.json({
      success: true,
      database: isConnected ? 'connected' : 'disconnected',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      database: 'error',
      message: error.message
    });
  }
});

// =====================================================
// ERROR HANDLING
// =====================================================

// Handle JWT errors
app.use((err, req, res, next) => {
  if (err.name === 'JsonWebTokenError') {
    return res.status(401).json({
      success: false,
      error: 'Invalid token',
      message: 'Token verification failed'
    });
  }
  if (err.name === 'TokenExpiredError') {
    return res.status(401).json({
      success: false,
      error: 'Token expired',
      message: 'Please log in again'
    });
  }
  next(err);
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Error:', {
    message: err.message,
    stack: err.stack,
    url: req.url,
    method: req.method,
    timestamp: new Date().toISOString()
  });

  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
  });
});

// 404 handler for API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `The endpoint ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// =====================================================
// SERVER STARTUP
// =====================================================

const startServer = async () => {
  try {
    console.log('🚀 Starting Monster Backend...');
    
    // Test database connection
    console.log('🔗 Testing database connection...');
    const isConnected = await testConnection();
    
    if (!isConnected) {
      console.error('❌ Failed to connect to database');
      process.exit(1);
    }
    
    console.log('✅ Database connected successfully');

    // Start the server
    const server = app.listen(PORT, '0.0.0.0', () => {
      console.log(`🚀 Monster Backend running on port ${PORT}`);
      console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
      console.log(`📊 Health check: http://localhost:${PORT}/health`);
      console.log(`🔗 API info: http://localhost:${PORT}/api`);
      console.log(`🩺 Database health: http://localhost:${PORT}/api/health`);
      console.log('✅ Backend is ready!');
    });
    
    return server;
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Start the server
startServer();

export default app;
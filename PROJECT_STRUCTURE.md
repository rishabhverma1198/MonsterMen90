# Project Structure Documentation

This document describes the organized folder structure of the MonsterMen90 e-commerce platform.

## 📁 Root Directory Structure

```
MonsterMen90/
├── MonsterBackend/          # Node.js/Express Backend
├── MonsterFrontend/         # React/TypeScript Frontend
├── Docs/                    # Project Documentation
├── scripts/                 # Root-level utility scripts
│   ├── start-platform.sh   # Platform startup script
│   ├── start-simple.bat    # Simple startup script (Windows)
│   └── nginx.conf          # Nginx configuration
├── supabase/                # Supabase Edge Functions
│   └── functions/          # Serverless functions
├── package.json            # Root package.json
└── README.md               # Main README
```

## 🔧 Backend Structure (MonsterBackend/)

```
MonsterBackend/
├── server.js               # Main application entry point
├── package.json            # Backend dependencies
├── README.md              # Backend documentation
│
├── config/                 # Configuration files
│   └── ecosystem.config.js # PM2 process manager config
│
├── db/                     # Database configuration
│   └── db.js              # Supabase client setup
│
├── routes/                 # API route handlers
│   ├── products.routes.js
│   ├── admin-products.routes.js
│   ├── adminStock.routes.js
│   ├── inventory.routes.js
│   ├── order-management.routes.js
│   └── user-management.routes.js
│
├── middleware/             # Express middleware
│   ├── auth.middleware.js # Authentication & authorization
│   └── csrf.middleware.js # CSRF protection
│
├── services/               # Business logic services
│   └── admin-products.service.js
│
├── utils/                  # Utility functions
│   ├── response.util.js   # Standardized API responses
│   └── validation.util.js # Request validation schemas
│
├── migrations/             # Database migrations (SQL)
│   ├── 001_production_schema_verification.sql
│   ├── 002_admin_rls_policies.sql
│   └── ...
│
├── integrations/           # Third-party integrations
│   └── base/              # Base API client integrations
│       ├── base-api-clients.js
│       ├── base-api-clients.ts
│       ├── rate-limiter.js
│       └── rate-limiter.ts
│
├── scripts/                # Utility scripts & tools
│   ├── health-check.js    # Health check utility
│   ├── auto-fix-integration.js
│   ├── database-setup.sql
│   ├── server-backup.js
│   └── ...
│
└── tests/                  # Test files
    ├── comprehensive-api-testing.cjs
    ├── security-testing.js
    ├── testing-suite.js
    └── ...
```

## 🎨 Frontend Structure (MonsterFrontend/)

```
MonsterFrontend/
├── package.json            # Frontend dependencies
├── vite.config.ts         # Vite build configuration
├── tsconfig.json          # TypeScript configuration
├── tailwind.config.js     # Tailwind CSS configuration
├── index.html             # HTML entry point
│
├── public/                 # Static assets (served as-is)
│   ├── vite.svg
│   └── assets/            # Public image assets
│
├── src/                    # Source code
│   ├── main.tsx           # Application entry point
│   ├── App.tsx            # Root component
│   ├── index.css          # Global styles
│   │
│   ├── components/         # React components
│   │   ├── admin/         # Admin-specific components
│   │   ├── common/        # Shared/common components
│   │   ├── error/         # Error handling components
│   │   ├── home/          # Homepage components
│   │   ├── layout/        # Layout components (Header, Footer, etc.)
│   │   ├── product/       # Product-related components
│   │   ├── ui/            # UI library components
│   │   └── wholesale/     # Wholesale-specific components
│   │
│   ├── pages/              # Page components
│   │   ├── admin/         # Admin pages
│   │   ├── buyer/         # Buyer pages
│   │   ├── checkout/      # Checkout pages
│   │   ├── home/          # Homepage
│   │   ├── order/         # Order pages
│   │   ├── wholesaler/    # Wholesaler pages
│   │   └── NotFound.tsx   # 404 page
│   │
│   ├── routes/             # Routing configuration
│   │   ├── AppRoutes.tsx
│   │   ├── ProtectedRoute.tsx
│   │   ├── AdminProtectedRoute.tsx
│   │   └── WholesalerProtectedRoute.tsx
│   │
│   ├── context/            # React Context providers
│   │   ├── AuthContext.tsx
│   │   ├── AdminContext.tsx
│   │   ├── CartContext.tsx
│   │   ├── UserTypeContext.tsx
│   │   └── ThemeProvider.tsx
│   │
│   ├── hooks/              # Custom React hooks
│   │   ├── useAuth.ts
│   │   ├── useCart.ts
│   │   ├── useAdmin.ts
│   │   └── ...
│   │
│   ├── lib/                # Libraries and utilities
│   │   ├── supabase.ts    # Supabase client
│   │   ├── services/      # API service layers
│   │   │   ├── auth.service.ts
│   │   │   ├── admin.service.ts
│   │   │   └── ...
│   │   └── utils/         # Utility functions
│   │       ├── auth.utils.ts
│   │       └── ...
│   │
│   └── types/              # TypeScript type definitions
│       ├── admin-types.ts
│       ├── api-types.ts
│       ├── cart-types.ts
│       └── ...
│
├── supabase/               # Supabase configuration
│   ├── config.toml
│   ├── migrations/         # Database migrations
│   └── schemas/            # Schema definitions
│
├── scripts/                # Utility scripts
│   ├── setup-database.cjs
│   └── ...
│
└── tests/                  # Test files
    ├── admin-authorization-test.ts
    ├── test-api-integration.ts
    └── ...
```

## 📝 Key Organizational Principles

### Backend Organization
- **Separation of Concerns**: Routes handle HTTP, services contain business logic, utils provide helpers
- **Test Isolation**: All test files are in the `tests/` directory
- **Script Organization**: Utility and setup scripts are in the `scripts/` directory
- **Config Management**: Configuration files are centralized in the `config/` directory

### Frontend Organization
- **Feature-based Structure**: Components organized by feature/domain (admin, buyer, wholesale)
- **Type Safety**: TypeScript types defined in dedicated `types/` directory
- **Reusability**: Common components in `components/common/`, UI library in `components/ui/`
- **State Management**: Context providers in `context/`, custom hooks in `hooks/`

### File Naming Conventions
- **Routes**: `*.routes.js` (backend)
- **Services**: `*.service.js/ts`
- **Middleware**: `*.middleware.js`
- **Utilities**: `*.util.js/ts` or `*.utils.ts`
- **Tests**: `test-*.js/ts` or `*.test.js/ts`
- **Config**: `*.config.js/ts`

## 🚀 Running the Application

See the main [README.md](./README.md) for detailed instructions on running the application.

## 📚 Additional Documentation

- [Docs/SIMPLE_START.md](./Docs/SIMPLE_START.md) - Quick start guide
- [Docs/RUNNING_THE_PLATFORM.md](./Docs/RUNNING_THE_PLATFORM.md) - Platform running instructions
- [Docs/ADMIN_SETUP_GUIDE.md](./Docs/ADMIN_SETUP_GUIDE.md) - Admin setup guide


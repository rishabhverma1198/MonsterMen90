# MonsterMen90 - E-commerce Platform

A modern, full-stack e-commerce platform built with React, TypeScript, Node.js, and Supabase.

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm
- Supabase account and project
- Environment variables configured

### Installation

1. **Install Backend Dependencies**
   ```bash
   cd MonsterBackend
   npm install
   ```

2. **Install Frontend Dependencies**
   ```bash
   cd MonsterFrontend
   npm install
   ```

3. **Configure Environment Variables**
   - Copy `.env.example` to `.env` in both `MonsterBackend` and `MonsterFrontend`
   - Add your Supabase credentials

### Running the Application

**Backend:**
```bash
cd MonsterBackend
npm start
```

**Frontend:**
```bash
cd MonsterFrontend
npm run dev
```

The application will be available at:
- Frontend: http://localhost:5173
- Backend API: http://localhost:3001

## 📁 Project Structure

For detailed project structure, see [PROJECT_STRUCTURE.md](./PROJECT_STRUCTURE.md)

```
MonsterMen90/
├── MonsterBackend/          # Node.js/Express backend
│   ├── routes/              # API routes
│   ├── middleware/          # Authentication & validation
│   ├── services/            # Business logic services
│   ├── utils/               # Utility functions
│   ├── db/                  # Database configuration
│   ├── migrations/          # Database migrations
│   ├── config/              # Configuration files
│   ├── scripts/             # Utility scripts
│   ├── tests/               # Test files
│   └── server.js            # Main server file
│
├── MonsterFrontend/         # React/TypeScript frontend
│   ├── src/
│   │   ├── components/      # React components (by feature)
│   │   ├── pages/          # Page components
│   │   ├── routes/         # Routing configuration
│   │   ├── context/        # React contexts
│   │   ├── hooks/          # Custom React hooks
│   │   ├── lib/            # Utilities and services
│   │   └── types/          # TypeScript types
│   ├── public/             # Static assets
│   ├── scripts/            # Utility scripts
│   ├── tests/              # Test files
│   └── vite.config.ts      # Vite configuration
│
├── Docs/                    # Documentation
│   ├── SIMPLE_START.md      # Quick start guide
│   ├── RUNNING_THE_PLATFORM.md
│   └── ADMIN_SETUP_GUIDE.md
│
├── scripts/                 # Root-level utility scripts
└── supabase/                # Supabase Edge Functions
```

## 🔑 Key Features

- **User Management**: Buyer, Wholesaler, and Admin roles
- **Product Management**: Full CRUD with variants (size, color, stock)
- **Order Processing**: Complete order lifecycle management
- **Inventory Management**: Stock tracking and low stock alerts
- **Admin Dashboard**: Analytics, user management, and product administration
- **Authentication**: Secure JWT-based authentication with Supabase

## 📚 Documentation

- [Project Structure](PROJECT_STRUCTURE.md) - Detailed folder structure documentation
- [Simple Start Guide](Docs/SIMPLE_START.md)
- [Running the Platform](Docs/RUNNING_THE_PLATFORM.md)
- [Admin Setup Guide](Docs/ADMIN_SETUP_GUIDE.md)
- [Backend README](MonsterBackend/README.md)
- [Frontend README](MonsterFrontend/README.md)

## 🛠️ Technology Stack

**Frontend:**
- React 18 + TypeScript
- Vite
- React Router
- Tailwind CSS
- Supabase Client

**Backend:**
- Node.js + Express
- Supabase (PostgreSQL)
- JWT Authentication
- Zod Validation

## 📝 License

This project is part of the MonsterMen90 e-commerce platform.


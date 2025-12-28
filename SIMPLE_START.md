# 🚀 Simple Start Guide

## EASIEST WAY TO START YOUR PROJECT:

### Option 1: Double-click this file
```
start-simple.bat
```

### Option 2: Run this command
```bash
npm run dev
```

## ✅ What I Fixed For You:

1. **Missing Dependencies**: Installed `tailwindcss`, `autoprefixer`, and `postcss`
2. **Backend IPv6 Error**: Fixed the rate limiting configuration
3. **Created Simple Script**: `start-simple.bat` for one-click startup

## 🌐 After Starting:

- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:3001  
- **Admin Panel**: http://localhost:5173/admin/login

## 🛑 To Stop:

Press `Ctrl+C` in the terminal

## 🔧 If You Still Get Errors:

1. **Missing Dependencies**:
   ```bash
   cd MonsterFrontend && npm install @supabase/supabase-js tailwindcss autoprefixer postcss
   ```

2. **Clean Install**:
   ```bash
   npm run clean
   npm run setup
   ```

3. **Manual Install**:
   ```bash
   npm install
   cd MonsterBackend && npm install
   cd ../MonsterFrontend && npm install
   ```

That's it! Your project should now start without errors.
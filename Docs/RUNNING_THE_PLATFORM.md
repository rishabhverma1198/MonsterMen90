# 🚀 Running Monster Men90 Platform

You can run both frontend and backend with a single command using any of these methods:

## Method 1: NPM Scripts (Cross-Platform - Recommended)

First, install the root dependencies:
```bash
npm install
```

Then run either of these commands:

### Development Mode (with auto-reload)
```bash
npm run dev
```
- Starts backend on http://localhost:3001
- Starts frontend on http://localhost:5173
- Both services restart automatically on code changes

### Production Mode
```bash
npm start
```
- Starts backend on http://localhost:3001
- Serves built frontend on http://localhost:4173

## Method 2: Batch File (Windows Only)

```bash
cd MonsterFrontend
npm run start-platform
```

This opens two separate terminal windows:
- Backend terminal (http://localhost:3001)
- Frontend terminal (http://localhost:5173)

## Method 3: Shell Script (Unix/Linux/Mac)

```bash
./start-platform.sh
```

**Note:** Make sure the script is executable:
```bash
chmod +x start-platform.sh
```

## Method 4: Individual Commands

If you prefer to run them separately:

### Backend Only
```bash
cd MonsterBackend
npm start
```

### Frontend Only
```bash
cd MonsterFrontend
npm run dev
```

## 📊 Server URLs

Once running, access your application at:

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:3001
- **Admin Panel**: http://localhost:5173/admin/login
- **API Health Check**: http://localhost:3001/api/health
- **API Products**: http://localhost:3001/api/products

## 🛠 Development Commands

```bash
# Install all dependencies
npm run install

# Build both frontend and backend
npm run build

# Clean all node_modules
npm run clean

# Run tests
npm run test

# Setup from scratch
npm run setup
```

## 🔧 Troubleshooting

### Port Already in Use
If you get port conflicts:
```bash
# Kill processes using ports 3001 or 5173
# Windows
netstat -ano | findstr :3001
netstat -ano | findstr :5173
taskkill /PID <PID_NUMBER> /F

# Mac/Linux
lsof -ti:3001 | xargs kill -9
lsof -ti:5173 | xargs kill -9
```

### Dependencies Issues
```bash
# Clean install
npm run clean
npm run install
```

### Backend Database Connection
Make sure your `.env` file in MonsterBackend has the correct Supabase credentials:
```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 🎯 Quick Start (Recommended)

1. **Clone and setup**:
   ```bash
   npm run setup
   ```

2. **Start in development mode**:
   ```bash
   npm run dev
   ```

3. **Open your browser**:
   - Frontend: http://localhost:5173
   - Backend API: http://localhost:3001

That's it! Both services will start automatically and you'll see logs in your terminal.
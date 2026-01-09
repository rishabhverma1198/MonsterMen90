#!/bin/bash

echo "🚀 Admin Panel Setup Script"
echo "============================"

cd MonsterFrontend

echo ""
echo "1. Creating admin user..."
node scripts/create-admin.js

echo ""
echo "2. Admin user creation completed!"
echo ""
echo "📋 Admin Login Credentials:"
echo "   Email: admin@example.com"
echo "   Password: admin123456"
echo ""
echo "🌐 Admin Panel URL: http://localhost:5174/admin/login"
echo ""
echo "✅ Setup Complete! You can now test the admin panel."
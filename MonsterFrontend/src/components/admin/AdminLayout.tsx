import React, { useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Users,
  Tags,
  BarChart3,
  Settings,
  LogOut,
  ChevronDown,
  Menu,
  X,
  DollarSign,
  TrendingUp,
  AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { supabase } from '@/lib/supabase';

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  path: string;
  subItems?: NavItem[];
}

interface AdminLayoutProps {
  children: React.ReactNode;
  adminName?: string;
  adminEmail?: string;
}

const navItems: NavItem[] = [
  {
    id: 'dashboard',
    label: 'Dashboard',
    icon: <LayoutDashboard className="w-5 h-5" />,
    path: '/admin/dashboard'
  },
  {
    id: 'products',
    label: 'Products',
    icon: <Package className="w-5 h-5" />,
    path: '/admin/products',
    subItems: [
      { id: 'products-list', label: 'All Products', icon: <Package className="w-4 h-4" />, path: '/admin/products' },
      { id: 'categories', label: 'Categories', icon: <Tags className="w-4 h-4" />, path: '/admin/categories' },
      { id: 'inventory', label: 'Inventory', icon: <AlertCircle className="w-4 h-4" />, path: '/admin/inventory' }
    ]
  },
  {
    id: 'orders',
    label: 'Orders',
    icon: <ShoppingCart className="w-5 h-5" />,
    path: '/admin/orders'
  },
  {
    id: 'users',
    label: 'Users',
    icon: <Users className="w-5 h-5" />,
    path: '/admin/users'
  },
  {
    id: 'pricing',
    label: 'Pricing & Offers',
    icon: <DollarSign className="w-5 h-5" />,
    path: '/admin/pricing',
    subItems: [
      { id: 'pricing-setup', label: 'Price Setup', icon: <DollarSign className="w-4 h-4" />, path: '/admin/pricing' },
      { id: 'discounts', label: 'Discounts', icon: <TrendingUp className="w-4 h-4" />, path: '/admin/discounts' }
    ]
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: <BarChart3 className="w-5 h-5" />,
    path: '/admin/analytics'
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: <Settings className="w-5 h-5" />,
    path: '/admin/settings'
  }
];

export default function AdminLayout({
  children,
  adminName = 'Admin',
  adminEmail = 'admin@example.com'
}: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [expandedMenu, setExpandedMenu] = useState<string | null>(null);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate('/admin/login');
  };

  const toggleMenu = (menuId: string) => {
    setExpandedMenu(expandedMenu === menuId ? null : menuId);
  };

  const isActive = (path: string) => {
    return location.pathname === path;
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-gray-900 text-white transition-all duration-300 flex flex-col overflow-hidden`}
      >
        {/* Logo */}
        <div className="p-6 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <div className={`flex items-center space-x-2 ${!sidebarOpen && 'justify-center w-full'}`}>
              <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center font-bold">
                M
              </div>
              {sidebarOpen && <span className="font-bold text-lg">MonsterMen</span>}
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="text-gray-400 hover:text-white"
            >
              {sidebarOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </Button>
          </div>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 space-y-2">
          {navItems.map((item) => (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.subItems) {
                    toggleMenu(item.id);
                  } else {
                    navigate(item.path);
                  }
                }}
                className={`w-full flex items-center justify-between px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-orange-500 text-white'
                    : 'text-gray-300 hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
                </div>
                {sidebarOpen && item.subItems && (
                  <ChevronDown
                    className={`w-4 h-4 transition-transform ${
                      expandedMenu === item.id ? 'rotate-180' : ''
                    }`}
                  />
                )}
              </button>

              {/* Sub items */}
              {sidebarOpen && item.subItems && expandedMenu === item.id && (
                <div className="ml-4 mt-2 space-y-1 border-l border-gray-700 pl-3">
                  {item.subItems.map((subItem) => (
                    <button
                      key={subItem.id}
                      onClick={() => navigate(subItem.path)}
                      className={`w-full flex items-center space-x-2 px-3 py-2 rounded text-sm transition-colors ${
                        isActive(subItem.path)
                          ? 'bg-orange-500 text-white'
                          : 'text-gray-400 hover:text-white hover:bg-gray-800'
                      }`}
                    >
                      {subItem.icon}
                      <span>{subItem.label}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          ))}
        </nav>

        {/* User Profile */}
        <div className="p-4 border-t border-gray-800">
          <div className="flex items-center space-x-3">
            <Avatar className="w-10 h-10">
              <AvatarFallback className="bg-orange-500">
                {adminName.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {sidebarOpen && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{adminName}</p>
                <p className="text-xs text-gray-400 truncate">{adminEmail}</p>
              </div>
            )}
            <Button
              variant="ghost"
              size="sm"
              onClick={handleLogout}
              className="text-gray-400 hover:text-red-500"
            >
              <LogOut className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold text-gray-900">Admin Panel</h1>
            <div className="flex items-center space-x-4">
              <input
                type="search"
                placeholder="Search..."
                className="px-4 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-500"
              />
              <Button variant="outline" size="sm">
                Settings
              </Button>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>
    </div>
  );
}

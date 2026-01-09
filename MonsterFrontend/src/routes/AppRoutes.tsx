import React, { lazy, Suspense, useMemo } from "react";
import { Routes, Route, Navigate, useLocation, Outlet } from "react-router-dom";
import Header from "@/components/layout/Header";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";

// --- COMPONENTS ---

// Optimized Loading State
const PageLoader = () => (
  <div className="min-h-[60vh] w-full flex flex-col items-center justify-center bg-gray-50/50 backdrop-blur-sm">
    <div className="relative">
      <Loader2 className="h-12 w-12 animate-spin text-blue-600" />
      <div className="absolute inset-0 h-12 w-12 animate-pulse rounded-full border-4 border-blue-100"></div>
    </div>
    <p className="mt-4 font-medium text-gray-600 animate-pulse">Loading your experience...</p>
  </div>
);

// Enhanced Error Boundary with better UI
class RouteErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  
  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gray-50">
          <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8 text-center border border-gray-100">
            <div className="bg-red-50 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
              <AlertCircle className="h-8 w-8 text-red-600" />
            </div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-8">The page failed to load. This might be due to a temporary connection issue.</p>
            <button 
              onClick={() => window.location.reload()} 
              className="flex items-center justify-center w-full gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 rounded-xl transition-all active:scale-95 shadow-lg shadow-blue-200"
            >
              <RefreshCw className="h-4 w-4" /> Try Again
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

// --- LAZY IMPORTS ---
// Humne grouping ki hai taaki bundles management asan ho

const Hero = lazy(() => import("@/components/home/Hero"));
const NotFound = lazy(() => import("@/pages/NotFound"));

// Buyer
const BuyerHome = lazy(() => import("@/pages/buyer/home/BuyerHome"));
const BuyerOrders = lazy(() => import("@/pages/buyer/BuyerOrders"));
const CartPage = lazy(() => import("@/pages/buyer/cart/CartPage"));
const BuyerCheckout = lazy(() => import("@/pages/checkout/BuyerCheckout"));
const MenCollection = lazy(() => import("@/pages/buyer/MenCollection"));
const WomenCollection = lazy(() => import("@/pages/buyer/WomenCollection"));
const ProductDetail = lazy(() => import("@/pages/buyer/ProductDetail"));

// Wholesaler - ProtectedRoute should NOT be lazy loaded for proper nested routing
const WholesalerHome = lazy(() => import("@/pages/wholesaler/WholesalerHome"));
const WholesalerMenCollection = lazy(() => import("@/pages/wholesaler/WholesalerMenCollection"));
const WholesalerWomenCollection = lazy(() => import("@/pages/wholesaler/WholesalerWomenCollection"));
const WholesalerCartPage = lazy(() => import("@/pages/wholesaler/WholesalerCartPage"));
const WholesalerCheckout = lazy(() => import("@/pages/wholesaler/WholesalerCheckout"));
const WholesalerOrders = lazy(() => import("@/pages/wholesaler/WholesalerOrders"));

// Admin
const AdminProtectedRoute = lazy(() => import("./AdminProtectedRoute"));
const AdminLogin = lazy(() => import("@/pages/admin/AdminLogin"));
const AdminDashboard = lazy(() => import("@/pages/admin/AdminDashboard"));
const AdminProductManagement = lazy(() => import("@/pages/admin/AdminProductManagement"));
const AdminOrderManagement = lazy(() => import("@/pages/admin/AdminOrderManagement"));
const AdminUserManagement = lazy(() => import("@/pages/admin/AdminUserManagement"));
const AdminCategoryManagement = lazy(() => import("@/pages/admin/AdminCategoryManagement"));
const AdminInventoryManagement = lazy(() => import("@/pages/admin/AdminInventoryManagement"));
const AdminAnalytics = lazy(() => import("@/pages/admin/AdminAnalytics"));
const AdminStockPage = lazy(() => import("@/pages/admin/AdminStockPage"));
const AdminPricingManagement = lazy(() => import("@/pages/admin/AdminPricingManagement"));
const AdminDiscountManagement = lazy(() => import("@/pages/admin/AdminDiscountManagement"));
const AdminSettings = lazy(() => import("@/pages/admin/AdminSettings"));

const OrderSuccess = lazy(() => import("@/pages/order/OrderSuccess"));

// --- MAIN ROUTER ---

export default function AppRoutes() {
  // Navigation scroll to top logic (Important for eCommerce)
  const { pathname } = useLocation();
  React.useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return (
    <RouteErrorBoundary>
      <Header />
      <Suspense fallback={<PageLoader />}>
        <Routes>
          {/* LANDING & COMMON */}
          <Route path="/" element={<Hero />} />
          <Route path="/order-success" element={<OrderSuccess />} />

          {/* BUYER GROUP */}
          <Route path="/buyer">
            <Route index element={<BuyerHome />} />
            <Route path="orders" element={<BuyerOrders />} />
            <Route path="men" element={<MenCollection />} />
            <Route path="women" element={<WomenCollection />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="checkout" element={<BuyerCheckout />} />
          </Route>
          <Route path="/cart" element={<CartPage />} />

          {/* WHOLESALER GROUP (Public Access) */}
          <Route path="/wholesaler" element={<Outlet />}>
            <Route index element={<WholesalerHome />} />
            <Route path="men" element={<WholesalerMenCollection />} />
            <Route path="women" element={<WholesalerWomenCollection />} />
            <Route path="cart" element={<WholesalerCartPage />} />
            <Route path="checkout" element={<WholesalerCheckout />} />
            <Route path="orders" element={<WholesalerOrders />} />
          </Route>

          {/* LEGACY REDIRECTS (Retained as per original requirement) */}
          <Route path="/wholeseller/*" element={<Navigate to="/wholesaler" replace />} />

          {/* ADMIN GROUP (Security Hardened) */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin">
             <Route index element={<AdminStockPage />} />
             <Route path="dashboard" element={<AdminProtectedRoute><AdminDashboard /></AdminProtectedRoute>} />
             <Route path="products" element={<AdminProtectedRoute><AdminProductManagement /></AdminProtectedRoute>} />
             <Route path="orders" element={<AdminProtectedRoute><AdminOrderManagement /></AdminProtectedRoute>} />
             <Route path="users" element={<AdminProtectedRoute><AdminUserManagement /></AdminProtectedRoute>} />
             <Route path="categories" element={<AdminProtectedRoute><AdminCategoryManagement /></AdminProtectedRoute>} />
             <Route path="inventory" element={<AdminProtectedRoute><AdminInventoryManagement /></AdminProtectedRoute>} />
             <Route path="analytics" element={<AdminProtectedRoute><AdminAnalytics /></AdminProtectedRoute>} />
             <Route path="pricing" element={<AdminProtectedRoute><AdminPricingManagement /></AdminProtectedRoute>} />
             <Route path="discounts" element={<AdminProtectedRoute><AdminDiscountManagement /></AdminProtectedRoute>} />
             <Route path="settings" element={<AdminProtectedRoute><AdminSettings /></AdminProtectedRoute>} />
          </Route>

          {/* 404 CATCH-ALL */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </RouteErrorBoundary>
  );
}
import { Routes, Route } from "react-router-dom";
import Header from "../components/layout/Header";
import Hero from "../components/home/Hero";

/* BUYER */
import BuyerHome from "../pages/buyer/home/BuyerHome";
import BuyerOrders from "../pages/buyer/BuyerOrders";
import CartPage from "../pages/buyer/cart/CartPage";
import BuyerCheckout from "../pages/checkout/BuyerCheckout";
import MenCollection from "../pages/buyer/MenCollection.tsx";
import WomenCollection from "../pages/buyer/WomenCollection.tsx";

/* WHOLESELLER */
import WholesellerHome from "../pages/wholeseller/WholesellerHome";
import WholesalerMenCollection from "../pages/wholeseller/WholesalerMenCollection";
import WholesalerWomenCollection from "../pages/wholeseller/WholesalerWomenCollection";
import WholesellerCartPage from "../pages/wholeseller/WholesellerCartPage";
import WholesellerCheckout from "../pages/wholeseller/WholesellerCheckout";

/* ORDER */
import OrderSuccess from "../pages/order/OrderSuccess";

/* ADMIN */
import AdminStockPage from "../pages/admin/AdminStockPage.tsx";
import AdminLogin from "../pages/admin/AdminLogin.tsx";
import AdminDashboard from "../pages/admin/AdminDashboard.tsx";

import AdminProductManagement from "../pages/admin/AdminProductManagement.tsx";
import AdminOrderManagement from "../pages/admin/AdminOrderManagement.tsx";
import AdminUserManagement from "../pages/admin/AdminUserManagement.tsx";
import AdminCategoryManagement from "../pages/admin/AdminCategoryManagement.tsx";
import AdminInventoryManagement from "../pages/admin/AdminInventoryManagement.tsx";
import AdminAnalytics from "../pages/admin/AdminAnalytics.tsx";
import AdminProtectedRoute from "./AdminProtectedRoute.tsx";

export default function AppRoutes() {
  return (
    <>
      {/* HEADER ALWAYS VISIBLE */}
      <Header />

      <Routes>
        {/* LANDING */}
        <Route path="/" element={<Hero />} />

        {/* BUYER */}
        <Route path="/buyer" element={<BuyerHome />} />
        <Route path="/buyer/orders" element={<BuyerOrders />} />
        <Route path="/buyer/men" element={<MenCollection />} />
        <Route path="/buyer/women" element={<WomenCollection />} />
        <Route path="/cart" element={<CartPage />} />
        <Route
          path="/buyer/checkout"
          element={<BuyerCheckout />}
        />

        {/* WHOLESELLER */}
        <Route
          path="/wholeseller"
          element={<WholesellerHome />}
        />
        <Route
          path="/wholeseller/men"
          element={<WholesalerMenCollection />}
        />
        <Route
          path="/wholeseller/women"
          element={<WholesalerWomenCollection />}
        />
        <Route
          path="/wholeseller/cart"
          element={<WholesellerCartPage />}
        />
        <Route
          path="/wholeseller/checkout"
          element={<WholesellerCheckout />}
        />

        {/* SUCCESS */}
        <Route
          path="/order-success"
          element={<OrderSuccess />}
        />

        {/* ADMIN */}
        <Route path="/admin/login" element={<AdminLogin />} />

        <Route
          path="/admin/dashboard"
          element={
            <AdminProtectedRoute>
              <AdminDashboard />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/products"
          element={
            <AdminProtectedRoute>
              <AdminProductManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/orders"
          element={
            <AdminProtectedRoute>
              <AdminOrderManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/users"
          element={
            <AdminProtectedRoute>
              <AdminUserManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/categories"
          element={
            <AdminProtectedRoute>
              <AdminCategoryManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/inventory"
          element={
            <AdminProtectedRoute>
              <AdminInventoryManagement />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin/analytics"
          element={
            <AdminProtectedRoute>
              <AdminAnalytics />
            </AdminProtectedRoute>
          }
        />
        <Route
          path="/admin"
          element={<AdminStockPage />}
        />
      </Routes>
    </>
  );
}
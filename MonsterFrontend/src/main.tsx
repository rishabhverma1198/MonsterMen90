import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import "./index.css";

// Load deprecations and future flags early
import "./deprecations";

import { AuthProvider } from "./context/AuthContext";
import { UserTypeProvider } from "./context/UserTypeContext";
import { CartProvider } from "./context/CartContext";
import { ThemeProvider } from "./context/ThemeProvider";
import { AdminProvider } from "./context/AdminContext";
import App from "./App";

ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement
).render(
  // React.StrictMode commented out temporarily for development debugging
  // This prevents double rendering issues that can cause admin timeout problems
  // <React.StrictMode>
    <BrowserRouter
      future={{
        v7_startTransition: true,
        v7_relativeSplatPath: true,
      }}
    >
      <AuthProvider>
        <AdminProvider>
          <UserTypeProvider>
            <CartProvider>
              <ThemeProvider>
                <App />
              </ThemeProvider>
            </CartProvider>
          </UserTypeProvider>
        </AdminProvider>
      </AuthProvider>
    </BrowserRouter>
  // </React.StrictMode>
);
import { useNavigate, Link } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useMemo } from "react";
import { ShoppingCart, User, LogOut, Package } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

export default function WholesellerHeader() {
  const navigate = useNavigate();
  const { cart } = useCart();

  // ✅ Optimization: Calculation sirf tab hogi jab cart change hoga
  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  return (
    <header className="sticky top-0 z-50 w-full bg-white/80 backdrop-blur-md border-b shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* BRAND / LOGO */}
        <Link 
          to="/wholesaler" 
          className="flex items-center gap-3 hover:opacity-80 transition-all group"
        >
          <div className="w-10 h-10 rounded-xl bg-black text-white flex items-center justify-center font-black group-hover:rotate-6 transition-transform">
            M
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-black tracking-tighter leading-none">MonsterMen90</h1>
            <span className="text-[10px] uppercase tracking-widest font-bold text-blue-600">Wholesale</span>
          </div>
        </Link>

        {/* NAVIGATION & ACTIONS */}
        <div className="flex items-center gap-2 sm:gap-6">
          
          {/* BULK CART BUTTON */}
          <Button
            variant="ghost"
            onClick={() => navigate("/wholesaler/cart")}
            className="relative h-10 px-4 flex items-center gap-2 font-bold text-gray-700 hover:bg-gray-100 rounded-xl transition-all"
          >
            <ShoppingCart className="w-5 h-5" />
            <span className="hidden sm:inline">Bulk Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full animate-in zoom-in ring-2 ring-white">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Button>

          <div className="h-6 w-[1px] bg-gray-200 hidden sm:block" />

          {/* USER ACCOUNT MENU */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="rounded-full hover:bg-gray-100">
                <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                  <User className="w-4 h-4 text-gray-600" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56 rounded-xl mt-2">
              <DropdownMenuLabel className="font-bold text-gray-500 uppercase text-[10px] tracking-widest px-4">
                Partner Account
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate("/wholesaler/orders")} className="cursor-pointer gap-2 py-3">
                <Package size={16} /> Order History
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate("/profile")} className="cursor-pointer gap-2 py-3">
                <User size={16} /> Profile Settings
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                className="text-red-600 cursor-pointer gap-2 py-3 focus:bg-red-50 focus:text-red-600"
                onClick={() => {
                  // Logout logic here
                  navigate("/login");
                }}
              >
                <LogOut size={16} /> Sign Out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
import { useNavigate, Link, useLocation } from "react-router-dom";
import { useCart } from "@/context/CartContext";
import { useMemo, useState } from "react";
import { ShoppingCart, User, LogOut, Package, Settings, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { toast } from "@/hooks/use-toast";

export default function WholesellerHeader() {
  const navigate = useNavigate();
  const location = useLocation();
  const { cart } = useCart();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // ✅ Performance: Cart count memoized to avoid re-calculation on every hover/re-render
  const totalItems = useMemo(() => 
    cart.reduce((sum, item) => sum + item.quantity, 0), 
    [cart]
  );

  // ✅ Production Grade Logout Logic
  const handleLogout = async () => {
    try {
      setIsLoggingOut(true);
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      
      toast({ title: "Logged Out", description: "Aap safaltapurvak sign out ho gaye hain." });
      navigate("/login", { replace: true });
    } catch (error: any) {
      toast({ 
        title: "Logout Error", 
        description: error.message, 
        variant: "destructive" 
      });
    } finally {
      setIsLoggingOut(false);
    }
  };

  // Helper to check active route
  const isActive = (path: string) => location.pathname === path;

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        
        {/* BRAND / LOGO SECTION */}
        <Link 
          to="/wholesaler" 
          className="flex items-center gap-3 transition-transform hover:scale-[1.02] active:scale-95 group"
        >
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center font-black shadow-lg shadow-primary/20 group-hover:rotate-3 transition-transform">
            M
          </div>
          <div className="hidden xs:flex flex-col">
            <h1 className="text-lg font-black tracking-tighter leading-none">MonsterMen90</h1>
            <span className="text-[10px] uppercase tracking-[0.2em] font-bold text-blue-600">Wholesale B2B</span>
          </div>
        </Link>

        {/* NAVIGATION & ACTIONS */}
        <div className="flex items-center gap-1 sm:gap-4">
          
          {/* CART BUTTON - With active state styling */}
          <Button
            variant={isActive("/wholesaler/cart") ? "secondary" : "ghost"}
            onClick={() => navigate("/wholesaler/cart")}
            className="relative h-10 px-3 sm:px-4 flex items-center gap-2 font-bold rounded-xl transition-all"
          >
            <ShoppingCart className={`w-5 h-5 ${isActive("/wholesaler/cart") ? "text-blue-600" : "text-gray-600"}`} />
            <span className="hidden md:inline">Bulk Cart</span>
            {totalItems > 0 && (
              <span className="absolute -top-1 -right-1 bg-blue-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full ring-2 ring-white animate-in zoom-in duration-300">
                {totalItems > 99 ? '99+' : totalItems}
              </span>
            )}
          </Button>

          <div className="hidden sm:block h-8 w-[1px] bg-gray-200 mx-2" />

          {/* USER ACCOUNT DROPDOWN */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="h-10 gap-2 px-2 rounded-xl hover:bg-gray-100 group">
                <Avatar className="h-8 w-8 border shadow-sm">
                  <AvatarImage src="" /> {/* In production: add user profile image URL */}
                  <AvatarFallback className="bg-blue-50 text-blue-600 font-bold text-xs">
                    WS
                  </AvatarFallback>
                </Avatar>
                <ChevronDown className="w-4 h-4 text-gray-400 group-data-[state=open]:rotate-180 transition-transform" />
              </Button>
            </DropdownMenuTrigger>
            
            <DropdownMenuContent align="end" className="w-60 rounded-2xl p-2 shadow-2xl border-gray-100">
              <DropdownMenuLabel className="px-3 py-3">
                <div className="flex flex-col space-y-1">
                  <p className="text-sm font-bold leading-none">Wholesale Partner</p>
                  <p className="text-xs leading-none text-muted-foreground mt-1">b2b-support@monstermen90.com</p>
                </div>
              </DropdownMenuLabel>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={() => navigate("/wholesaler/orders")}
                className="rounded-lg py-2.5 cursor-pointer focus:bg-blue-50"
              >
                <Package className="mr-2 h-4 w-4 text-blue-600" />
                <span>Bulk Order History</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/profile")}
                className="rounded-lg py-2.5 cursor-pointer focus:bg-blue-50"
              >
                <User className="mr-2 h-4 w-4 text-blue-600" />
                <span>Account Settings</span>
              </DropdownMenuItem>

              <DropdownMenuItem 
                onClick={() => navigate("/help")}
                className="rounded-lg py-2.5 cursor-pointer focus:bg-blue-50"
              >
                <Settings className="mr-2 h-4 w-4 text-blue-600" />
                <span>Support Desk</span>
              </DropdownMenuItem>
              
              <DropdownMenuSeparator />
              
              <DropdownMenuItem 
                onClick={handleLogout}
                disabled={isLoggingOut}
                className="rounded-lg py-2.5 text-red-600 cursor-pointer focus:bg-red-50 focus:text-red-600 font-bold"
              >
                <LogOut className="mr-2 h-4 w-4" />
                <span>{isLoggingOut ? "Signing out..." : "Logout Account"}</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

        </div>
      </div>
    </header>
  );
}
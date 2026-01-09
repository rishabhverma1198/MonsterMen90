import { useNavigate } from "react-router-dom";
import { CheckCircle2, ShoppingBag, ArrowRight, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export default function OrderSuccess() {
  const navigate = useNavigate();
  
  // Real app mein aap order ID URL params ya state se le sakte hain
  const orderId = "ORD-" + Math.random().toString(36).substr(2, 9).toUpperCase();

  return (
    <div className="min-h-[80vh] flex flex-col items-center justify-center px-6 py-12 animate-in fade-in duration-700">
      
      {/* Success Icon Animation */}
      <div className="relative mb-8">
        <div className="absolute inset-0 bg-green-100 rounded-full scale-150 animate-ping opacity-20"></div>
        <CheckCircle2 className="h-20 w-20 text-green-500 relative z-10" />
      </div>

      <div className="max-w-md w-full text-center space-y-4">
        <h1 className="text-4xl font-black tracking-tight text-gray-900">
          Order Confirmed!
        </h1>
        <p className="text-lg text-muted-foreground">
          Shukriya! Aapka order sahi se place ho gaya hai aur humne processing shuru kar di hai.
        </p>

        {/* Order Info Card */}
        <Card className="mt-8 border-none bg-gray-50 shadow-sm">
          <CardContent className="p-6 space-y-3">
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Order Number:</span>
              <span className="font-bold text-primary">{orderId}</span>
            </div>
            <div className="flex justify-between items-center text-sm">
              <span className="text-muted-foreground font-medium">Confirmation:</span>
              <span className="text-gray-700 font-semibold">Sent to your Email</span>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 pt-8">
          <Button 
            onClick={() => navigate("/buyer/orders")} 
            variant="outline"
            className="flex-1 h-12 rounded-xl border-2 font-bold group"
          >
            <Package className="mr-2 h-4 w-4" />
            Track Order
          </Button>
          
          <Button 
            onClick={() => navigate("/buyer")} 
            className="flex-1 h-12 rounded-xl bg-black hover:bg-gray-900 font-bold group shadow-lg"
          >
            <ShoppingBag className="mr-2 h-4 w-4" />
            Continue Shopping
            <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
          </Button>
        </div>

        <p className="pt-10 text-xs text-muted-foreground">
          Koi sawal hai? Hamari <span className="underline cursor-pointer">Support Team</span> se baat karein.
        </p>
      </div>
    </div>
  );
}
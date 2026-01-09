import React, { useState } from "react";
import { supabase } from "../../lib/supabase";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Loader2, PackagePlus, CheckCircle2, AlertCircle } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const AddProduct = () => {
  const [loading, setLoading] = useState<boolean>(false);
  const [formData, setFormData] = useState({
    name: "",
    price: "",
    stock_quantity: "",
    description: "",
    is_active: true,
  });

  // Input change handler
  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // Submit Logic
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Simple Validation
    if (!formData.name.trim() || parseFloat(formData.price) <= 0) {
      return toast({ 
        title: "Validation Error", 
        description: "Naam aur sahi keemat bharna jaroori hai.", 
        variant: "destructive" 
      });
    }

    setLoading(true);
    try {
      const { error } = await supabase.from("products").insert([
        {
          name: formData.name.trim(),
          price: parseFloat(formData.price),
          stock_quantity: parseInt(formData.stock_quantity) || 0,
          description: formData.description.trim(),
          is_active: formData.is_active,
          updated_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      toast({ 
        title: "Product Added! ✅", 
        description: `${formData.name} inventory mein save ho gaya hai.` 
      });

      // Form reset logic
      setFormData({ name: "", price: "", stock_quantity: "", description: "", is_active: true });
    } catch (error: any) {
      toast({ 
        title: "Error", 
        description: error.message || "Failed to add product", 
        variant: "destructive" 
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto p-4 md:p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <Card className="border-none shadow-2xl bg-white/80 backdrop-blur-md">
        <CardHeader className="space-y-1 border-b pb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-100 rounded-lg">
              <PackagePlus className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <CardTitle className="text-2xl font-bold">Add New Product</CardTitle>
              <CardDescription>Product ki details bharein aur status set karein.</CardDescription>
            </div>
          </div>
        </CardHeader>

        <CardContent className="pt-8">
          <form onSubmit={handleSubmit} className="space-y-8">
            
            {/* Status Toggle Area */}
            <div className="flex items-center justify-between p-4 rounded-xl border bg-gray-50/50 group transition-colors hover:bg-gray-50">
              <div className="space-y-0.5">
                <Label className="text-base font-semibold">Product Visibility</Label>
                <p className="text-sm text-muted-foreground">
                  {formData.is_active ? "Ye product website par live dikhega." : "Product abhi hidden rahega."}
                </p>
              </div>
              <Switch 
                checked={formData.is_active} 
                onCheckedChange={(val) => setFormData({...formData, is_active: val})} 
              />
            </div>

            {/* Form Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-sm font-bold">Product Name *</Label>
                <Input 
                  id="name" name="name" placeholder="e.g. Premium White Shirt" 
                  value={formData.name} onChange={handleChange} required
                  className="rounded-lg border-gray-200 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="price" className="text-sm font-bold">Price (₹) *</Label>
                <Input 
                  id="price" name="price" type="number" step="0.01" 
                  placeholder="0.00" value={formData.price} onChange={handleChange} required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="stock_quantity" className="text-sm font-bold">Stock Quantity</Label>
                <Input 
                  id="stock_quantity" name="stock_quantity" type="number" 
                  placeholder="e.g. 100" value={formData.stock_quantity} onChange={handleChange}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description" className="text-sm font-bold">Description</Label>
              <Textarea 
                id="description" name="description" rows={5}
                placeholder="Product details likhein..." 
                value={formData.description} onChange={handleChange}
                className="resize-none rounded-lg"
              />
            </div>

            <div className="flex items-center gap-4 pt-4 border-t">
              <Button 
                type="submit" 
                className="flex-1 h-12 text-md font-bold rounded-xl shadow-lg"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> Saving...</>
                ) : (
                  <><CheckCircle2 className="mr-2 h-5 w-5" /> Add Product</>
                )}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
};

export default AddProduct;
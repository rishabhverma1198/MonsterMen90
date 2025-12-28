import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
// import { Separator } from '@/components/ui/separator'; // Not used
import { AlertCircle, Save, Type, FileText, Image } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import EnhancedMediaUpload from './EnhancedMediaUpload';
import type { MediaFile } from '@/lib/services/media-compression.service';

interface ProductFormData {
  name: string;
  description: string;
  shortDescription: string;
  categoryId: string;
  gender: 'men' | 'women' | 'unisex';
  productType: string;
  basePrice: number;
  wholesalePrice: number;
  costPrice: number;
  brand: string;
  material: string;
  careInstructions: string;
  sku: string;
  availableSizes: string[];
  isActive: boolean;
  isFeatured: boolean;
  media: MediaFile[];
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  colors: string[];
  weight: number;
  dimensions: {
    length: number;
    width: number;
    height: number;
  };
}

interface EnhancedProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

const PRODUCT_TYPES = {
  men: ['Shirt', 'T-Shirt', 'Pants', 'Jeans', 'Jacket', 'Sweater', 'Hoodie', 'Shorts', 'Blazer', 'Polo'],
  women: ['Dress', 'Top', 'Blouse', 'Skirt', 'Pants', 'Jeans', 'Jacket', 'Sweater', 'Hoodie', 'Blazer', 'Kurti', 'Saree'],
  unisex: ['Hoodie', 'T-Shirt', 'Polo', 'Sweatshirt', 'Cap', 'Bag', 'Accessories']
};

const SIZES = ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'];

const MATERIALS = [
  'Cotton', 'Polyester', 'Wool', 'Silk', 'Linen', 'Denim', 'Leather', 
  'Viscose', 'Nylon', 'Spandex', 'Cashmere', 'Bamboo', 'Hemp'
];

const COMMON_COLORS = [
  'Black', 'White', 'Navy', 'Gray', 'Red', 'Blue', 'Green', 'Yellow', 
  'Pink', 'Purple', 'Brown', 'Beige', 'Maroon', 'Orange', 'Khaki'
];

export default function EnhancedProductForm({
  initialData,
  onSubmit,
  onCancel,
  isLoading = false
}: EnhancedProductFormProps) {
  const [formData, setFormData] = useState<ProductFormData>({
    name: '',
    description: '',
    shortDescription: '',
    categoryId: '',
    gender: 'men',
    productType: '',
    basePrice: 0,
    wholesalePrice: 0,
    costPrice: 0,
    brand: '',
    material: '',
    careInstructions: '',
    sku: '',
    availableSizes: [],
    isActive: true,
    isFeatured: false,
    media: [],
    seoTitle: '',
    seoDescription: '',
    tags: [],
    colors: [],
    weight: 0,
    dimensions: { length: 0, width: 0, height: 0 },
    ...initialData
  });

  const [activeTab, setActiveTab] = useState('basic');
  const [newTag, setNewTag] = useState('');
  const [newColor, setNewColor] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [generatedSKU, setGeneratedSKU] = useState('');

  // Generate SKU function
  const generateSKU = () => {
    if (formData.name && formData.gender && formData.productType && !initialData?.sku) {
      const timestamp = Date.now().toString().slice(-6);
      const sku = `${formData.gender.toUpperCase()}-${formData.productType.toUpperCase().replace(/\s+/g, '')}-${timestamp}`;
      setGeneratedSKU(sku);
      setFormData(prev => ({ ...prev, sku }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim()) newErrors.description = 'Description is required';
    if (!formData.shortDescription.trim()) newErrors.shortDescription = 'Short description is required';
    if (!formData.categoryId) newErrors.categoryId = 'Category is required';
    if (!formData.productType) newErrors.productType = 'Product type is required';
    if (formData.basePrice <= 0) newErrors.basePrice = 'Base price must be greater than 0';
    if (formData.wholesalePrice <= 0) newErrors.wholesalePrice = 'Wholesale price must be greater than 0';
    if (formData.availableSizes.length === 0) newErrors.availableSizes = 'At least one size must be selected';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleInputChange = <T extends keyof ProductFormData>(field: T, value: ProductFormData[T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleSizeToggle = (size: string) => {
    setFormData(prev => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter(s => s !== size)
        : [...prev.availableSizes, size]
    }));
  };

  const addTag = () => {
    if (newTag.trim() && !formData.tags.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...prev.tags, newTag.trim()]
      }));
      setNewTag('');
    }
  };

  const removeTag = (tag: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.filter(t => t !== tag)
    }));
  };

  const addColor = () => {
    if (newColor.trim() && !formData.colors.includes(newColor.trim())) {
      setFormData(prev => ({
        ...prev,
        colors: [...prev.colors, newColor.trim()]
      }));
      setNewColor('');
    }
  };

  const removeColor = (color: string) => {
    setFormData(prev => ({
      ...prev,
      colors: prev.colors.filter(c => c !== color)
    }));
  };

  const handleMediaUpload = (files: MediaFile[]) => {
    setFormData(prev => ({ ...prev, media: files }));
  };

  const productTypes = PRODUCT_TYPES[formData.gender];

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="basic">Basic Info</TabsTrigger>
          <TabsTrigger value="pricing">Pricing</TabsTrigger>
          <TabsTrigger value="media">Media</TabsTrigger>
          <TabsTrigger value="details">Details</TabsTrigger>
          <TabsTrigger value="seo">SEO</TabsTrigger>
        </TabsList>

        {/* Basic Information */}
        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Type className="w-5 h-5 mr-2" />
                Basic Information
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="name">Product Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    placeholder="e.g., Men's Cotton Shirt"
                    className={errors.name ? 'border-red-500' : ''}
                  />
                  {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
                </div>

                <div>
                  <Label htmlFor="brand">Brand</Label>
                  <Input
                    id="brand"
                    value={formData.brand}
                    onChange={(e) => handleInputChange('brand', e.target.value)}
                    placeholder="e.g., MonsterMen90"
                  />
                </div>
              </div>

              <div>
                <Label htmlFor="shortDescription">Short Description *</Label>
                <Textarea
                  id="shortDescription"
                  value={formData.shortDescription}
                  onChange={(e) => handleInputChange('shortDescription', e.target.value)}
                  placeholder="Brief description for product listings"
                  className={errors.shortDescription ? 'border-red-500' : ''}
                />
                {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
              </div>

              <div>
                <Label htmlFor="description">Detailed Description *</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => handleInputChange('description', e.target.value)}
                  placeholder="Detailed product description with features, benefits, and styling tips"
                  className="min-h-[120px]"
                />
                {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gender">Gender *</Label>
                  <Select value={formData.gender} onValueChange={(value: 'men' | 'women' | 'unisex') => handleInputChange('gender', value)}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men">Men</SelectItem>
                      <SelectItem value="women">Women</SelectItem>
                      <SelectItem value="unisex">Unisex</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="productType">Product Type *</Label>
                  <Select value={formData.productType} onValueChange={(value) => handleInputChange('productType', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      {productTypes.map((type) => (
                        <SelectItem key={type} value={type}>{type}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
                </div>

                <div>
                  <Label htmlFor="sku">SKU</Label>
                  <div className="flex gap-2">
                    <Input
                      id="sku"
                      value={formData.sku || generatedSKU}
                      onChange={(e) => handleInputChange('sku', e.target.value)}
                      placeholder="Auto-generated SKU"
                    />
                    <Button type="button" onClick={generateSKU} variant="outline">
                      Generate
                    </Button>
                  </div>
                </div>
              </div>

              <div>
                <Label>Available Sizes *</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {SIZES.map((size) => (
                    <Badge
                      key={size}
                      variant={formData.availableSizes.includes(size) ? 'default' : 'outline'}
                      className="cursor-pointer px-3 py-1"
                      onClick={() => handleSizeToggle(size)}
                    >
                      {size}
                    </Badge>
                  ))}
                </div>
                {errors.availableSizes && <p className="text-red-500 text-sm mt-1">{errors.availableSizes}</p>}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pricing */}
        <TabsContent value="pricing" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pricing Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="basePrice">Base Price (₹) *</Label>
                  <Input
                    id="basePrice"
                    type="number"
                    value={formData.basePrice}
                    onChange={(e) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
                    placeholder="899"
                    className={errors.basePrice ? 'border-red-500' : ''}
                  />
                  {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
                </div>

                <div>
                  <Label htmlFor="wholesalePrice">Wholesale Price (₹) *</Label>
                  <Input
                    id="wholesalePrice"
                    type="number"
                    value={formData.wholesalePrice}
                    onChange={(e) => handleInputChange('wholesalePrice', parseFloat(e.target.value) || 0)}
                    placeholder="699"
                    className={errors.wholesalePrice ? 'border-red-500' : ''}
                  />
                  {errors.wholesalePrice && <p className="text-red-500 text-sm mt-1">{errors.wholesalePrice}</p>}
                </div>

                <div>
                  <Label htmlFor="costPrice">Cost Price (₹)</Label>
                  <Input
                    id="costPrice"
                    type="number"
                    value={formData.costPrice}
                    onChange={(e) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
                    placeholder="499"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="weight">Weight (grams)</Label>
                  <Input
                    id="weight"
                    type="number"
                    value={formData.weight}
                    onChange={(e) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
                    placeholder="250"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isActive"
                    checked={formData.isActive}
                    onCheckedChange={(checked) => handleInputChange('isActive', checked)}
                  />
                  <Label htmlFor="isActive">Active Product</Label>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="isFeatured"
                    checked={formData.isFeatured}
                    onCheckedChange={(checked) => handleInputChange('isFeatured', checked)}
                  />
                  <Label htmlFor="isFeatured">Featured Product</Label>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Media Upload */}
        <TabsContent value="media" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Image className="w-5 h-5 mr-2" />
                Product Media
              </CardTitle>
            </CardHeader>
            <CardContent>
              <EnhancedMediaUpload
                onFilesUploaded={handleMediaUpload}
                maxFiles={10}
                maxSizeMB={5}
              />
              
              {formData.media.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-gray-600 mb-2">
                    Uploaded {formData.media.length} file(s) - Images and videos are automatically compressed
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Product Details */}
        <TabsContent value="details" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Product Details
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="material">Material</Label>
                  <Select value={formData.material} onValueChange={(value) => handleInputChange('material', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select material" />
                    </SelectTrigger>
                    <SelectContent>
                      {MATERIALS.map((material) => (
                        <SelectItem key={material} value={material}>{material}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="categoryId">Category *</Label>
                  <Select value={formData.categoryId} onValueChange={(value) => handleInputChange('categoryId', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="men-shirts">Men - Shirts</SelectItem>
                      <SelectItem value="men-tshirts">Men - T-Shirts</SelectItem>
                      <SelectItem value="men-pants">Men - Pants</SelectItem>
                      <SelectItem value="women-dresses">Women - Dresses</SelectItem>
                      <SelectItem value="women-tops">Women - Tops</SelectItem>
                      <SelectItem value="women-bottoms">Women - Bottoms</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
                </div>
              </div>

              <div>
                <Label htmlFor="careInstructions">Care Instructions</Label>
                <Textarea
                  id="careInstructions"
                  value={formData.careInstructions}
                  onChange={(e) => handleInputChange('careInstructions', e.target.value)}
                  placeholder="e.g., Machine wash cold, tumble dry low, iron on medium heat"
                />
              </div>

              <div>
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="flex items-center gap-1">
                      {tag}
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newTag}
                    onChange={(e) => setNewTag(e.target.value)}
                    placeholder="Add a tag"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                  />
                  <Button type="button" onClick={addTag}>Add</Button>
                </div>
              </div>

              <div>
                <Label>Colors</Label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {formData.colors.map((color) => (
                    <Badge key={color} variant="outline" className="flex items-center gap-1">
                      {color}
                      <button
                        type="button"
                        onClick={() => removeColor(color)}
                        className="text-red-500 hover:text-red-700"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
                <div className="flex flex-wrap gap-2 mb-2">
                  {COMMON_COLORS.map((color) => (
                    <Badge
                      key={color}
                      variant={formData.colors.includes(color) ? 'default' : 'outline'}
                      className="cursor-pointer"
                      onClick={() => {
                        if (formData.colors.includes(color)) {
                          removeColor(color);
                        } else {
                          setFormData(prev => ({
                            ...prev,
                            colors: [...prev.colors, color]
                          }));
                        }
                      }}
                    >
                      {color}
                    </Badge>
                  ))}
                </div>
                <div className="flex gap-2">
                  <Input
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    placeholder="Add custom color"
                    onKeyPress={(e) => e.key === 'Enter' && (e.preventDefault(), addColor())}
                  />
                  <Button type="button" onClick={addColor}>Add</Button>
                </div>
              </div>

              <div>
                <Label>Dimensions (cm)</Label>
                <div className="grid grid-cols-3 gap-2">
                  <Input
                    type="number"
                    placeholder="Length"
                    value={formData.dimensions.length}
                    onChange={(e) => handleInputChange('dimensions', {
                      ...formData.dimensions,
                      length: parseFloat(e.target.value) || 0
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Width"
                    value={formData.dimensions.width}
                    onChange={(e) => handleInputChange('dimensions', {
                      ...formData.dimensions,
                      width: parseFloat(e.target.value) || 0
                    })}
                  />
                  <Input
                    type="number"
                    placeholder="Height"
                    value={formData.dimensions.height}
                    onChange={(e) => handleInputChange('dimensions', {
                      ...formData.dimensions,
                      height: parseFloat(e.target.value) || 0
                    })}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* SEO */}
        <TabsContent value="seo" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>SEO Optimization</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="seoTitle">SEO Title</Label>
                <Input
                  id="seoTitle"
                  value={formData.seoTitle}
                  onChange={(e) => handleInputChange('seoTitle', e.target.value)}
                  placeholder="Custom SEO title for search engines"
                />
              </div>

              <div>
                <Label htmlFor="seoDescription">SEO Description</Label>
                <Textarea
                  id="seoDescription"
                  value={formData.seoDescription}
                  onChange={(e) => handleInputChange('seoDescription', e.target.value)}
                  placeholder="Meta description for search engines (150-160 characters)"
                  maxLength={160}
                />
                <p className="text-sm text-gray-500 mt-1">
                  {formData.seoDescription.length}/160 characters
                </p>
              </div>

              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  SEO fields help improve search engine visibility. Leave blank to auto-generate from product name and description.
                </AlertDescription>
              </Alert>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Form Actions */}
      <div className="flex justify-end space-x-4 pt-6 border-t">
        <Button type="button" variant="outline" onClick={onCancel} disabled={isLoading}>
          Cancel
        </Button>
        <Button type="submit" disabled={isLoading}>
          {isLoading ? (
            <>
              <Save className="w-4 h-4 mr-2 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4 mr-2" />
              Save Product
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
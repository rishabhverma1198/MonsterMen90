import React, { useState } from 'react';

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
  seoTitle: string;
  seoDescription: string;
  tags: string[];
  colors: string[];
  weight: number;
}

interface ProductFormProps {
  initialData?: Partial<ProductFormData>;
  onSubmit: (data: ProductFormData) => void;
}

const PRODUCT_TYPES = {
  men: [
    'Shirt',
    'T-Shirt',
    'Pants',
    'Jeans',
    'Jacket',
    'Sweater',
    'Hoodie',
    'Shorts',
    'Blazer',
    'Polo'
  ],
  women: [
    'Dress',
    'Top',
    'Blouse',
    'Skirt',
    'Pants',
    'Jeans',
    'Jacket',
    'Sweater',
    'Hoodie',
    'Blazer',
    'Kurti',
    'Saree'
  ],
  unisex: [
    'Hoodie',
    'T-Shirt',
    'Polo',
    'Sweatshirt',
    'Cap',
    'Bag',
    'Accessories'
  ]
};



export default function ProductForm({
  initialData,
  onSubmit
}: ProductFormProps) {
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
    availableSizes: initialData?.availableSizes ?? [],
    isActive: true,
    isFeatured: false,
    seoTitle: '',
    seoDescription: '',
    tags: initialData?.tags ?? [],
    colors: initialData?.colors ?? [],
    weight: 0,
    ...(initialData ?? {})
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  // Helper function to handle input changes
  const handleInputChange = <T extends keyof ProductFormData>(
    field: T,
    value: ProductFormData[T]
  ) => {
    setFormData((prev: ProductFormData) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Record<string, string>) => ({ ...prev, [field]: '' }));
    }
  };

  // Helper function to toggle sizes
  const handleSizeToggle = (size: string) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      availableSizes: prev.availableSizes.includes(size)
        ? prev.availableSizes.filter((s: string) => s !== size)
        : [...prev.availableSizes, size]
    }));
  };

  // Helper function to add tags
  const addTag = (tag: string) => {
    if (tag.trim() && !formData.tags.includes(tag.trim())) {
      setFormData((prev: ProductFormData) => ({
        ...prev,
        tags: [...prev.tags, tag.trim()]
      }));
    }
  };

  // Helper function to remove tags
  const removeTag = (tagToRemove: string) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      tags: prev.tags.filter((tag: string) => tag !== tagToRemove)
    }));
  };

  // Helper function to add colors
  const addColor = (color: string) => {
    if (color.trim() && !formData.colors.includes(color.trim())) {
      setFormData((prev: ProductFormData) => ({
        ...prev,
        colors: [...prev.colors, color.trim()]
      }));
    }
  };

  // Helper function to remove colors
  const removeColor = (colorToRemove: string) => {
    setFormData((prev: ProductFormData) => ({
      ...prev,
      colors: prev.colors.filter((color: string) => color !== colorToRemove)
    }));
  };

  // Get product types based on selected gender
  const productTypes = PRODUCT_TYPES[formData.gender as keyof typeof PRODUCT_TYPES] || [];

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) newErrors.name = 'Product name is required';
    if (!formData.description.trim())
      newErrors.description = 'Description is required';
    if (!formData.shortDescription.trim())
      newErrors.shortDescription = 'Short description is required';
    if (!formData.categoryId)
      newErrors.categoryId = 'Category is required';
    if (!formData.productType)
      newErrors.productType = 'Product type is required';
    if (formData.basePrice <= 0)
      newErrors.basePrice = 'Base price must be greater than 0';
    if (formData.wholesalePrice <= 0)
      newErrors.wholesalePrice = 'Wholesale price must be greater than 0';
    if (formData.availableSizes.length === 0)
      newErrors.availableSizes = 'At least one size must be selected';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* ---- FORM STRUCTURE IMPLEMENTED ---- */}
      {/* Basic form structure with error handling and data management */}
      
      {/* Error Display */}
      {Object.keys(errors).length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <h3 className="text-sm font-medium text-red-800">Please fix the following errors:</h3>
          <ul className="mt-2 text-sm text-red-700 list-disc list-inside">
            {Object.entries(errors).map(([field, error]) => (
              <li key={field}>{error}</li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Basic Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Name *
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('name', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.name ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter product name"
          />
          {errors.name && <p className="text-red-500 text-sm mt-1">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SKU *
          </label>
          <input
            type="text"
            value={formData.sku}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('sku', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.sku ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter SKU"
          />
          {errors.sku && <p className="text-red-500 text-sm mt-1">{errors.sku}</p>}
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Short Description *
        </label>
        <textarea
          value={formData.shortDescription}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('shortDescription', e.target.value)}
          rows={3}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.shortDescription ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter short description"
        />
        {errors.shortDescription && <p className="text-red-500 text-sm mt-1">{errors.shortDescription}</p>}
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Full Description *
        </label>
        <textarea
          value={formData.description}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('description', e.target.value)}
          rows={5}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            errors.description ? 'border-red-500' : 'border-gray-300'
          }`}
          placeholder="Enter full description"
        />
        {errors.description && <p className="text-red-500 text-sm mt-1">{errors.description}</p>}
      </div>

      {/* Category and Type Selection */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Gender *
          </label>
          <select
            value={formData.gender}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('gender', e.target.value as 'men' | 'women' | 'unisex')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            title="Select product gender"
          >
            <option value="men">Men</option>
            <option value="women">Women</option>
            <option value="unisex">Unisex</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Type *
          </label>
          <select
            value={formData.productType}
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => handleInputChange('productType', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.productType ? 'border-red-500' : 'border-gray-300'
            }`}
            title="Select product type"
          >
            <option value="">Select product type</option>
            {productTypes.map((type) => (
              <option key={type} value={type}>
                {type}
              </option>
            ))}
          </select>
          {errors.productType && <p className="text-red-500 text-sm mt-1">{errors.productType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Category ID *
          </label>
          <input
            type="text"
            value={formData.categoryId}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('categoryId', e.target.value)}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.categoryId ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Enter category ID"
          />
          {errors.categoryId && <p className="text-red-500 text-sm mt-1">{errors.categoryId}</p>}
        </div>
      </div>

      {/* Pricing Information */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Base Price *
          </label>
          <input
            type="number"
            value={formData.basePrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('basePrice', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.basePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.basePrice && <p className="text-red-500 text-sm mt-1">{errors.basePrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Wholesale Price *
          </label>
          <input
            type="number"
            value={formData.wholesalePrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('wholesalePrice', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              errors.wholesalePrice ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="0.00"
          />
          {errors.wholesalePrice && <p className="text-red-500 text-sm mt-1">{errors.wholesalePrice}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Cost Price
          </label>
          <input
            type="number"
            value={formData.costPrice}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('costPrice', parseFloat(e.target.value) || 0)}
            min="0"
            step="0.01"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="0.00"
          />
        </div>
      </div>

      {/* Product Details */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Brand
          </label>
          <input
            type="text"
            value={formData.brand}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('brand', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter brand name"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Material
          </label>
          <input
            type="text"
            value={formData.material}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('material', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter material"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Care Instructions
        </label>
        <textarea
          value={formData.careInstructions}
          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => handleInputChange('careInstructions', e.target.value)}
          rows={3}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Enter care instructions"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Weight (kg)
        </label>
        <input
          type="number"
          value={formData.weight}
          onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('weight', parseFloat(e.target.value) || 0)}
          min="0"
          step="0.01"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="0.00"
        />
      </div>

      {/* Available Sizes */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Available Sizes *
        </label>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
          {['XS', 'S', 'M', 'L', 'XL', 'XXL'].map((size) => (
            <button
              key={size}
              type="button"
              onClick={() => handleSizeToggle(size)}
              className={`px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
                formData.availableSizes.includes(size)
                  ? 'bg-blue-500 text-white border-blue-500'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
        {errors.availableSizes && <p className="text-red-500 text-sm mt-1">{errors.availableSizes}</p>}
        {formData.availableSizes.length > 0 && (
          <p className="text-sm text-gray-600 mt-2">
            Selected sizes: {formData.availableSizes.join(', ')}
          </p>
        )}
      </div>

      {/* Tags */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Tags
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.tags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-blue-100 text-blue-800"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="ml-2 text-blue-600 hover:text-blue-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a tag"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const target = e.target as HTMLInputElement;
                addTag(target.value);
                target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* Colors */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Colors
        </label>
        <div className="flex flex-wrap gap-2 mb-2">
          {formData.colors.map((color) => (
            <span
              key={color}
              className="inline-flex items-center px-3 py-1 rounded-full text-sm bg-green-100 text-green-800"
            >
              {color}
              <button
                type="button"
                onClick={() => removeColor(color)}
                className="ml-2 text-green-600 hover:text-green-800"
              >
                ×
              </button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Add a color"
            className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                const target = e.target as HTMLInputElement;
                addColor(target.value);
                target.value = '';
              }
            }}
          />
        </div>
      </div>

      {/* SEO Fields */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Title
          </label>
          <input
            type="text"
            value={formData.seoTitle}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('seoTitle', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter SEO title"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            SEO Description
          </label>
          <input
            type="text"
            value={formData.seoDescription}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('seoDescription', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Enter SEO description"
          />
        </div>
      </div>

      {/* Product Status */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="flex items-center">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('isActive', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isActive" className="ml-2 block text-sm text-gray-900">
            Active Product
          </label>
        </div>

        <div className="flex items-center">
          <input
            type="checkbox"
            id="isFeatured"
            checked={formData.isFeatured}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleInputChange('isFeatured', e.target.checked)}
            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
          />
          <label htmlFor="isFeatured" className="ml-2 block text-sm text-gray-900">
            Featured Product
          </label>
        </div>
      </div>

      {/* Submit Button */}
      <div className="flex justify-end">
        <button
          type="submit"
          className="px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
        >
          {initialData ? 'Update Product' : 'Create Product'}
        </button>
      </div>
    </form>
  );
}
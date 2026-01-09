/**
 * Enhanced Validation Utility
 * Comprehensive data validation for database operations
 */

import Joi from 'joi';

// Initialize Joi
const joi = Joi.defaults((schema) => {
  return schema.options({
    abortEarly: false,
    allowUnknown: false,
    stripUnknown: true
  });
});

/**
 * Product Validation Schema
 */
export const productSchema = joi.object({
  name: joi.string().min(3).max(100).required().messages({
    'string.base': 'Product name must be a string',
    'string.empty': 'Product name cannot be empty',
    'string.min': 'Product name must be at least 3 characters',
    'string.max': 'Product name cannot exceed 100 characters',
    'any.required': 'Product name is required'
  }),
  
  slug: joi.string().min(3).max(100).required().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({
    'string.base': 'Slug must be a string',
    'string.empty': 'Slug cannot be empty',
    'string.min': 'Slug must be at least 3 characters',
    'string.max': 'Slug cannot exceed 100 characters',
    'string.pattern.base': 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
    'any.required': 'Slug is required'
  }),
  
  description: joi.string().max(2000).allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 2000 characters'
  }),
  
  short_description: joi.string().max(200).allow('').messages({
    'string.base': 'Short description must be a string',
    'string.max': 'Short description cannot exceed 200 characters'
  }),
  
  sku: joi.string().min(3).max(50).required().uppercase().messages({
    'string.base': 'SKU must be a string',
    'string.empty': 'SKU cannot be empty',
    'string.min': 'SKU must be at least 3 characters',
    'string.max': 'SKU cannot exceed 50 characters',
    'any.required': 'SKU is required'
  }),
  
  category_id: joi.string().uuid().required().messages({
    'string.base': 'Category ID must be a string',
    'string.empty': 'Category ID cannot be empty',
    'string.guid': 'Category ID must be a valid UUID',
    'any.required': 'Category ID is required'
  }),
  
  base_price: joi.number().min(0).max(10000).precision(2).required().messages({
    'number.base': 'Base price must be a number',
    'number.min': 'Base price cannot be negative',
    'number.max': 'Base price cannot exceed 10000',
    'number.precision': 'Base price cannot have more than 2 decimal places',
    'any.required': 'Base price is required'
  }),
  
  wholesale_price: joi.number().min(0).max(10000).precision(2).messages({
    'number.base': 'Wholesale price must be a number',
    'number.min': 'Wholesale price cannot be negative',
    'number.max': 'Wholesale price cannot exceed 10000',
    'number.precision': 'Wholesale price cannot have more than 2 decimal places'
  }),
  
  cost_price: joi.number().min(0).max(10000).precision(2).messages({
    'number.base': 'Cost price must be a number',
    'number.min': 'Cost price cannot be negative',
    'number.max': 'Cost price cannot exceed 10000',
    'number.precision': 'Cost price cannot have more than 2 decimal places'
  }),
  
  brand: joi.string().max(100).allow('').messages({
    'string.base': 'Brand must be a string',
    'string.max': 'Brand cannot exceed 100 characters'
  }),
  
  material: joi.string().max(200).allow('').messages({
    'string.base': 'Material must be a string',
    'string.max': 'Material cannot exceed 200 characters'
  }),
  
  care_instructions: joi.string().max(500).allow('').messages({
    'string.base': 'Care instructions must be a string',
    'string.max': 'Care instructions cannot exceed 500 characters'
  }),
  
  is_active: joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean'
  }),
  
  is_featured: joi.boolean().default(false).messages({
    'boolean.base': 'Featured status must be a boolean'
  }),
  
  meta_title: joi.string().max(100).allow('').messages({
    'string.base': 'Meta title must be a string',
    'string.max': 'Meta title cannot exceed 100 characters'
  }),
  
  meta_description: joi.string().max(200).allow('').messages({
    'string.base': 'Meta description must be a string',
    'string.max': 'Meta description cannot exceed 200 characters'
  }),
  
  images: joi.array().items(joi.string().uri()).max(10).messages({
    'array.base': 'Images must be an array',
    'array.max': 'Cannot have more than 10 images',
    'string.uri': 'Image URLs must be valid URIs'
  }),
  
  specifications: joi.object().pattern(joi.string(), joi.string()).messages({
    'object.base': 'Specifications must be an object'
  }),
  
  created_by: joi.string().uuid().messages({
    'string.base': 'Created by must be a string',
    'string.guid': 'Created by must be a valid UUID'
  }),
  
  updated_by: joi.string().uuid().messages({
    'string.base': 'Updated by must be a string',
    'string.guid': 'Updated by must be a valid UUID'
  })
});

/**
 * User Validation Schema
 */
export const userSchema = joi.object({
  email: joi.string().email().required().messages({
    'string.base': 'Email must be a string',
    'string.empty': 'Email cannot be empty',
    'string.email': 'Email must be a valid email address',
    'any.required': 'Email is required'
  }),
  
  full_name: joi.string().min(2).max(100).required().messages({
    'string.base': 'Full name must be a string',
    'string.empty': 'Full name cannot be empty',
    'string.min': 'Full name must be at least 2 characters',
    'string.max': 'Full name cannot exceed 100 characters',
    'any.required': 'Full name is required'
  }),
  
  user_type: joi.string().valid('admin', 'buyer', 'wholesaler').required().messages({
    'string.base': 'User type must be a string',
    'any.only': 'User type must be one of: admin, buyer, wholesaler',
    'any.required': 'User type is required'
  }),
  
  phone: joi.string().pattern(/^\+?[0-9\s-]{10,15}$/).allow('').messages({
    'string.base': 'Phone must be a string',
    'string.pattern.base': 'Phone must be a valid phone number'
  }),
  
  is_active: joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean'
  }),
  
  created_by: joi.string().uuid().messages({
    'string.base': 'Created by must be a string',
    'string.guid': 'Created by must be a valid UUID'
  }),
  
  updated_by: joi.string().uuid().messages({
    'string.base': 'Updated by must be a string',
    'string.guid': 'Updated by must be a valid UUID'
  })
});

/**
 * Product Variant Validation Schema
 */
export const productVariantSchema = joi.object({
  product_id: joi.string().uuid().required().messages({
    'string.base': 'Product ID must be a string',
    'string.empty': 'Product ID cannot be empty',
    'string.guid': 'Product ID must be a valid UUID',
    'any.required': 'Product ID is required'
  }),
  
  size: joi.string().min(1).max(10).required().messages({
    'string.base': 'Size must be a string',
    'string.empty': 'Size cannot be empty',
    'string.min': 'Size must be at least 1 character',
    'string.max': 'Size cannot exceed 10 characters',
    'any.required': 'Size is required'
  }),
  
  color: joi.string().min(2).max(50).required().messages({
    'string.base': 'Color must be a string',
    'string.empty': 'Color cannot be empty',
    'string.min': 'Color must be at least 2 characters',
    'string.max': 'Color cannot exceed 50 characters',
    'any.required': 'Color is required'
  }),
  
  stock_quantity: joi.number().integer().min(0).max(10000).required().messages({
    'number.base': 'Stock quantity must be a number',
    'number.integer': 'Stock quantity must be an integer',
    'number.min': 'Stock quantity cannot be negative',
    'number.max': 'Stock quantity cannot exceed 10000',
    'any.required': 'Stock quantity is required'
  }),
  
  price: joi.number().min(0).max(10000).precision(2).required().messages({
    'number.base': 'Price must be a number',
    'number.min': 'Price cannot be negative',
    'number.max': 'Price cannot exceed 10000',
    'number.precision': 'Price cannot have more than 2 decimal places',
    'any.required': 'Price is required'
  }),
  
  wholesale_price: joi.number().min(0).max(10000).precision(2).messages({
    'number.base': 'Wholesale price must be a number',
    'number.min': 'Wholesale price cannot be negative',
    'number.max': 'Wholesale price cannot exceed 10000',
    'number.precision': 'Wholesale price cannot have more than 2 decimal places'
  }),
  
  sku: joi.string().min(3).max(50).required().messages({
    'string.base': 'SKU must be a string',
    'string.empty': 'SKU cannot be empty',
    'string.min': 'SKU must be at least 3 characters',
    'string.max': 'SKU cannot exceed 50 characters',
    'any.required': 'SKU is required'
  }),
  
  min_stock_level: joi.number().integer().min(0).max(1000).default(5).messages({
    'number.base': 'Minimum stock level must be a number',
    'number.integer': 'Minimum stock level must be an integer',
    'number.min': 'Minimum stock level cannot be negative',
    'number.max': 'Minimum stock level cannot exceed 1000'
  }),
  
  is_active: joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean'
  })
});

/**
 * Category Validation Schema
 */
export const categorySchema = joi.object({
  name: joi.string().min(2).max(100).required().messages({
    'string.base': 'Category name must be a string',
    'string.empty': 'Category name cannot be empty',
    'string.min': 'Category name must be at least 2 characters',
    'string.max': 'Category name cannot exceed 100 characters',
    'any.required': 'Category name is required'
  }),
  
  slug: joi.string().min(2).max(100).required().pattern(/^[a-z0-9]+(?:-[a-z0-9]+)*$/).messages({
    'string.base': 'Slug must be a string',
    'string.empty': 'Slug cannot be empty',
    'string.min': 'Slug must be at least 2 characters',
    'string.max': 'Slug cannot exceed 100 characters',
    'string.pattern.base': 'Slug must be URL-friendly (lowercase letters, numbers, and hyphens only)',
    'any.required': 'Slug is required'
  }),
  
  description: joi.string().max(500).allow('').messages({
    'string.base': 'Description must be a string',
    'string.max': 'Description cannot exceed 500 characters'
  }),
  
  sort_order: joi.number().integer().min(0).max(1000).default(0).messages({
    'number.base': 'Sort order must be a number',
    'number.integer': 'Sort order must be an integer',
    'number.min': 'Sort order cannot be negative',
    'number.max': 'Sort order cannot exceed 1000'
  }),
  
  is_active: joi.boolean().default(true).messages({
    'boolean.base': 'Active status must be a boolean'
  }),
  
  parent_category_id: joi.string().uuid().allow(null).messages({
    'string.base': 'Parent category ID must be a string',
    'string.guid': 'Parent category ID must be a valid UUID'
  }),
  
  meta_title: joi.string().max(100).allow('').messages({
    'string.base': 'Meta title must be a string',
    'string.max': 'Meta title cannot exceed 100 characters'
  }),
  
  meta_description: joi.string().max(200).allow('').messages({
    'string.base': 'Meta description must be a string',
    'string.max': 'Meta description cannot exceed 200 characters'
  })
});

/**
 * Validate data against schema
 * @param {Object} data - Data to validate
 * @param {Object} schema - Joi schema
 * @param {string} context - Context for error messages
 * @returns {Object} Validation result
 */
export function validateData(data, schema, context = 'Data') {
  const { error, value } = schema.validate(data, { abortEarly: false });
  
  if (error) {
    const validationErrors = error.details.map(detail => ({
      field: detail.path.join('.'),
      message: detail.message,
      type: detail.type
    }));
    
    return {
      isValid: false,
      errors: validationErrors,
      errorMessage: `${context} validation failed`,
      cleanData: null
    };
  }
  
  return {
    isValid: true,
    errors: [],
    errorMessage: null,
    cleanData: value
  };
}

/**
 * Sanitize HTML input to prevent XSS
 * @param {string} input - Input string
 * @returns {string} Sanitized string
 */
export function sanitizeHtml(input) {
  if (!input || typeof input !== 'string') {
    return input;
  }
  
  // Basic HTML sanitization - remove all HTML tags
  return input.replace(/<[^>]*>/g, '');
}

/**
 * Sanitize object by sanitizing all string properties
 * @param {Object} obj - Object to sanitize
 * @returns {Object} Sanitized object
 */
export function sanitizeObject(obj) {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }
  
  const sanitized = {};
  
  for (const key in obj) {
    if (obj.hasOwnProperty(key)) {
      const value = obj[key];
      
      if (typeof value === 'string') {
        sanitized[key] = sanitizeHtml(value);
      } else if (typeof value === 'object' && value !== null) {
        sanitized[key] = sanitizeObject(value);
      } else {
        sanitized[key] = value;
      }
    }
  }
  
  return sanitized;
}

/**
 * Validate and sanitize product data
 * @param {Object} productData - Product data
 * @param {string} operation - Operation type (create/update)
 * @returns {Object} Validation result
 */
export function validateAndSanitizeProduct(productData, operation = 'create') {
  // Sanitize first
  const sanitizedData = sanitizeObject(productData);
  
  // Validate
  return validateData(sanitizedData, productSchema, 'Product');
}

/**
 * Validate and sanitize user data
 * @param {Object} userData - User data
 * @param {string} operation - Operation type (create/update)
 * @returns {Object} Validation result
 */
export function validateAndSanitizeUser(userData, operation = 'create') {
  // Sanitize first
  const sanitizedData = sanitizeObject(userData);
  
  // Validate
  return validateData(sanitizedData, userSchema, 'User');
}

/**
 * Validate and sanitize product variant data
 * @param {Object} variantData - Product variant data
 * @returns {Object} Validation result
 */
export function validateAndSanitizeProductVariant(variantData) {
  // Sanitize first
  const sanitizedData = sanitizeObject(variantData);
  
  // Validate
  return validateData(sanitizedData, productVariantSchema, 'Product Variant');
}

/**
 * Validate and sanitize category data
 * @param {Object} categoryData - Category data
 * @returns {Object} Validation result
 */
export function validateAndSanitizeCategory(categoryData) {
  // Sanitize first
  const sanitizedData = sanitizeObject(categoryData);
  
  // Validate
  return validateData(sanitizedData, categorySchema, 'Category');
}

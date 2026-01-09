/**
 * Admin Products Service
 * Handles all CRUD operations for products from admin perspective
 * Implements proper authentication, authorization, and validation
 */

const { supabase } = require('../config/supabase');
const { responseUtil } = require('../utils/response.util');
const { validationUtil } = require('../utils/validation.util');
const { validateAndSanitizeProduct } = require('../utils/validation.util');

class AdminProductsService {
    /**
     * Get all products with admin privileges (including inactive ones)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getAllProducts(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { page = 1, limit = 20, search = '', category = '', status = '' } = req.query;
            const offset = (page - 1) * limit;

            // Build query with filters
            let query = supabase
                .from('products')
                .select(`
                    *,
                    categories:category_id(name),
                    inventory:inventory(*),
                    variants:product_variants(*)
                `, { count: 'exact' });

            // Apply search filter
            if (search) {
                query = query.or(`name.ilike.%${search}%,description.ilike.%${search}%,sku.ilike.%${search}%`);
            }

            // Apply category filter
            if (category) {
                query = query.eq('category_id', category);
            }

            // Apply status filter
            if (status) {
                query = query.eq('status', status);
            }

            // Apply pagination
            query = query.range(offset, offset + parseInt(limit) - 1);

            // Execute query
            const { data, error, count } = await query;

            if (error) {
                console.error('Error fetching products:', error);
                return responseUtil.serverError(res, 'Failed to fetch products');
            }

            // Calculate pagination info
            const totalPages = Math.ceil(count / limit);
            const hasNextPage = page < totalPages;
            const hasPrevPage = page > 1;

            return responseUtil.success(res, {
                products: data || [],
                pagination: {
                    currentPage: parseInt(page),
                    totalPages,
                    totalItems: count,
                    itemsPerPage: parseInt(limit),
                    hasNextPage,
                    hasPrevPage
                }
            });

        } catch (error) {
            console.error('Error in getAllProducts:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Get single product by ID with admin privileges
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getProductById(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { id } = req.params;

            // Get product with all related data
            const { data, error } = await supabase
                .from('products')
                .select(`
                    *,
                    categories:category_id(name),
                    inventory:inventory(*),
                    variants:product_variants(*),
                    created_by_user:created_by(id, email, full_name),
                    updated_by_user:updated_by(id, email, full_name)
                `)
                .eq('id', id)
                .single();

            if (error) {
                console.error('Error fetching product:', error);
                return responseUtil.notFound(res, 'Product not found');
            }

            return responseUtil.success(res, { product: data });

        } catch (error) {
            console.error('Error in getProductById:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Create new product (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async createProduct(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            // Validate request data
            const validation = await this.validateProductData(req.body, 'create');
            if (!validation.isValid) {
                return responseUtil.validationError(res, validation.errors);
            }

            const productData = {
                ...validation.cleanData,
                created_by: adminAuth.userId,
                updated_by: adminAuth.userId,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString()
            };

            // Create product
            const { data, error } = await supabase
                .from('products')
                .insert(productData)
                .select(`
                    *,
                    categories:category_id(name),
                    created_by_user:created_by(id, email, full_name)
                `)
                .single();

            if (error) {
                console.error('Error creating product:', error);
                return responseUtil.serverError(res, 'Failed to create product');
            }

            // Log the action
            await this.logAdminAction(adminAuth.userId, 'CREATE_PRODUCT', `Created product: ${data.name}`, data.id);

            return responseUtil.created(res, { 
                product: data,
                message: 'Product created successfully' 
            });

        } catch (error) {
            console.error('Error in createProduct:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Update existing product (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async updateProduct(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { id } = req.params;

            // Validate request data
            const validation = await this.validateProductData(req.body, 'update');
            if (!validation.isValid) {
                return responseUtil.validationError(res, validation.errors);
            }

            const updateData = {
                ...validation.cleanData,
                updated_by: adminAuth.userId,
                updated_at: new Date().toISOString()
            };

            // Update product
            const { data, error } = await supabase
                .from('products')
                .update(updateData)
                .eq('id', id)
                .select(`
                    *,
                    categories:category_id(name),
                    updated_by_user:updated_by(id, email, full_name)
                `)
                .single();

            if (error) {
                console.error('Error updating product:', error);
                return responseUtil.serverError(res, 'Failed to update product');
            }

            // Log the action
            await this.logAdminAction(adminAuth.userId, 'UPDATE_PRODUCT', `Updated product: ${data.name}`, data.id);

            return responseUtil.success(res, { 
                product: data,
                message: 'Product updated successfully' 
            });

        } catch (error) {
            console.error('Error in updateProduct:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Delete product (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async deleteProduct(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { id } = req.params;

            // Get product info before deletion for logging
            const { data: productData } = await supabase
                .from('products')
                .select('name')
                .eq('id', id)
                .single();

            // Delete product (this will cascade to related records if set up)
            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', id);

            if (error) {
                console.error('Error deleting product:', error);
                return responseUtil.serverError(res, 'Failed to delete product');
            }

            // Log the action
            await this.logAdminAction(adminAuth.userId, 'DELETE_PRODUCT', `Deleted product: ${productData?.name || 'Unknown'}`, id);

            return responseUtil.success(res, { 
                message: 'Product deleted successfully' 
            });

        } catch (error) {
            console.error('Error in deleteProduct:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Bulk operations for products (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async bulkOperations(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { operation, productIds, data } = req.body;

            if (!operation || !productIds || !Array.isArray(productIds) || productIds.length === 0) {
                return responseUtil.validationError(res, 'Invalid bulk operation request');
            }

            let result;

            switch (operation) {
                case 'bulk_update':
                    result = await this.bulkUpdateProducts(productIds, data, adminAuth.userId);
                    break;
                case 'bulk_delete':
                    result = await this.bulkDeleteProducts(productIds, adminAuth.userId);
                    break;
                case 'bulk_status_change':
                    result = await this.bulkStatusChange(productIds, data.status, adminAuth.userId);
                    break;
                default:
                    return responseUtil.validationError(res, 'Invalid bulk operation');
            }

            // Log the action
            await this.logAdminAction(adminAuth.userId, 'BULK_OPERATION', `Performed ${operation} on ${productIds.length} products`);

            return responseUtil.success(res, {
                operation,
                affectedCount: result.affectedCount,
                message: `Bulk ${operation} completed successfully`
            });

        } catch (error) {
            console.error('Error in bulkOperations:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    /**
     * Get product analytics (admin only)
     * @param {Object} req - Express request object
     * @param {Object} res - Express response object
     */
    async getProductAnalytics(req, res) {
        try {
            // Verify admin authentication
            const adminAuth = await this.verifyAdminAuth(req);
            if (!adminAuth.success) {
                return responseUtil.unauthorized(res, adminAuth.message);
            }

            const { period = '30d' } = req.query;

            // Calculate date range
            const endDate = new Date();
            const startDate = new Date();
            
            switch (period) {
                case '7d':
                    startDate.setDate(startDate.getDate() - 7);
                    break;
                case '30d':
                    startDate.setDate(startDate.getDate() - 30);
                    break;
                case '90d':
                    startDate.setDate(startDate.getDate() - 90);
                    break;
                default:
                    startDate.setDate(startDate.getDate() - 30);
            }

            // Get analytics data
            const analytics = await this.calculateProductAnalytics(startDate, endDate);

            return responseUtil.success(res, { analytics, period });

        } catch (error) {
            console.error('Error in getProductAnalytics:', error);
            return responseUtil.serverError(res, 'Internal server error');
        }
    }

    // Private helper methods

    /**
     * Verify admin authentication
     * @param {Object} req - Express request object
     * @returns {Object} Authentication result
     */
    async verifyAdminAuth(req) {
        try {
            const authHeader = req.headers.authorization;
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
                return { success: false, message: 'No token provided' };
            }

            const token = authHeader.substring(7);
            const { data: { user }, error } = await supabase.auth.getUser(token);

            if (error || !user) {
                return { success: false, message: 'Invalid token' };
            }

            // Check if user has admin role
            const { data: userData, error: userError } = await supabase
                .from('users')
                .select('role')
                .eq('id', user.id)
                .single();

            if (userError || !userData || userData.role !== 'admin') {
                return { success: false, message: 'Admin access required' };
            }

            return { success: true, userId: user.id, user: userData };

        } catch (error) {
            console.error('Error verifying admin auth:', error);
            return { success: false, message: 'Authentication error' };
        }
    }

    /**
     * Validate product data
     * @param {Object} data - Product data to validate
     * @param {string} operation - Operation type (create/update)
     * @returns {Object} Validation result
     */
    async validateProductData(data, operation) {
        // Use enhanced validation utility
        return validateAndSanitizeProduct(data, operation);
    }

    /**
     * Log admin action
     * @param {string} userId - Admin user ID
     * @param {string} action - Action performed
     * @param {string} description - Action description
     * @param {string} productId - Product ID (optional)
     */
    async logAdminAction(userId, action, description, productId = null) {
        try {
            await supabase
                .from('admin_logs')
                .insert({
                    user_id: userId,
                    action,
                    description,
                    product_id: productId,
                    created_at: new Date().toISOString()
                });
        } catch (error) {
            console.error('Error logging admin action:', error);
        }
    }

    /**
     * Bulk update products
     * @param {Array} productIds - Array of product IDs
     * @param {Object} data - Update data
     * @param {string} userId - Admin user ID
     * @returns {Object} Update result
     */
    async bulkUpdateProducts(productIds, data, userId) {
        const updateData = {
            ...data,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const { error, count } = await supabase
            .from('products')
            .update(updateData)
            .in('id', productIds);

        if (error) {
            throw new Error(`Bulk update failed: ${error.message}`);
        }

        return { affectedCount: count || productIds.length };
    }

    /**
     * Bulk delete products
     * @param {Array} productIds - Array of product IDs
     * @param {string} userId - Admin user ID
     * @returns {Object} Delete result
     */
    async bulkDeleteProducts(productIds, userId) {
        // Log the deletion
        await this.logAdminAction(userId, 'BULK_DELETE', `Bulk deleted ${productIds.length} products`);

        const { error, count } = await supabase
            .from('products')
            .delete()
            .in('id', productIds);

        if (error) {
            throw new Error(`Bulk delete failed: ${error.message}`);
        }

        return { affectedCount: count || productIds.length };
    }

    /**
     * Bulk status change
     * @param {Array} productIds - Array of product IDs
     * @param {string} status - New status
     * @param {string} userId - Admin user ID
     * @returns {Object} Status change result
     */
    async bulkStatusChange(productIds, status, userId) {
        const updateData = {
            status,
            updated_by: userId,
            updated_at: new Date().toISOString()
        };

        const { error, count } = await supabase
            .from('products')
            .update(updateData)
            .in('id', productIds);

        if (error) {
            throw new Error(`Bulk status change failed: ${error.message}`);
        }

        await this.logAdminAction(userId, 'BULK_STATUS_CHANGE', `Changed status to ${status} for ${productIds.length} products`);

        return { affectedCount: count || productIds.length };
    }

    /**
     * Calculate product analytics
     * @param {Date} startDate - Start date for analytics
     * @param {Date} endDate - End date for analytics
     * @returns {Object} Analytics data
     */
    async calculateProductAnalytics(startDate, endDate) {
        // This would typically query order items and other tables
        // For now, returning mock analytics structure
        return {
            totalProducts: 0,
            activeProducts: 0,
            inactiveProducts: 0,
            lowStockProducts: 0,
            topSellingProducts: [],
            categoryBreakdown: [],
            salesTrends: []
        };
    }
}

module.exports = new AdminProductsService();
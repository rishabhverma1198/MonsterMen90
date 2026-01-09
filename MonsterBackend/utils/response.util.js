/**
 * Standardized API Response Utility
 * Ensures all API responses follow the same format:
 * { success: boolean, data: any, error: string | null, message: string }
 */

/**
 * Success response helper
 */
export const successResponse = (res, data, message = 'Success', statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    data,
    error: null,
    message
  });
};

/**
 * Error response helper
 */
export const errorResponse = (res, error, message = 'An error occurred', statusCode = 500) => {
  return res.status(statusCode).json({
    success: false,
    data: null,
    error: error || 'Internal Server Error',
    message
  });
};

/**
 * Not found response helper
 */
export const notFoundResponse = (res, message = 'Resource not found') => {
  return res.status(404).json({
    success: false,
    data: null,
    error: 'Not Found',
    message
  });
};

/**
 * Unauthorized response helper
 */
export const unauthorizedResponse = (res, message = 'Unauthorized') => {
  return res.status(401).json({
    success: false,
    data: null,
    error: 'Unauthorized',
    message
  });
};

/**
 * Forbidden response helper
 */
export const forbiddenResponse = (res, message = 'Forbidden') => {
  return res.status(403).json({
    success: false,
    data: null,
    error: 'Forbidden',
    message
  });
};

/**
 * Bad request response helper
 */
export const badRequestResponse = (res, message = 'Bad Request', errors = null) => {
  return res.status(400).json({
    success: false,
    data: null,
    error: 'Bad Request',
    message,
    ...(errors && { errors })
  });
};

/**
 * Paginated response helper
 */
export const paginatedResponse = (res, data, pagination, message = 'Success') => {
  return res.status(200).json({
    success: true,
    data,
    error: null,
    message,
    pagination: {
      page: pagination.page || 1,
      limit: pagination.limit || 20,
      total: pagination.total || 0,
      totalPages: Math.ceil((pagination.total || 0) / (pagination.limit || 20)),
      hasMore: pagination.hasMore || false
    }
  });
};


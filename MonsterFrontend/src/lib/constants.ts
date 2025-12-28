export const TIMEOUTS = {
  ADMIN_CHECK: 3000,
  RETRY_DELAY: 1000,
  MAX_RETRIES: 3
} as const;

export const LIMITS = {
  AVATAR_SIZE: 1 * 1024 * 1024, // 1MB
  PRODUCT_IMAGE_SIZE: 5 * 1024 * 1024 // 5MB
} as const;

export const VALIDATION = {
  AVATAR_TYPES: ['image/jpeg', 'image/png', 'image/gif'],
  PRODUCT_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4']
} as const;

export const ROUTES = {
  ADMIN: {
    DASHBOARD: '/admin/dashboard',
    PRODUCTS: '/admin/products',
    ORDERS: '/admin/orders',
    USERS: '/admin/users'
  }
} as const;

export const API = {
  ENDPOINTS: {
    USERS: '/api/users',
    PRODUCTS: '/api/products',
    ORDERS: '/api/orders',
    INVENTORY: '/api/inventory'
  }
} as const;

export const STORAGE = {
  BUCKET_NAMES: {
    AVATARS: 'avatars',
    PRODUCTS: 'products',
    MEDIA: 'media'
  }
} as const;

export const DEFAULTS = {
  ADMIN_NAME: 'System Administrator',
  USER_TYPE: {
    ADMIN: 'admin',
    CUSTOMER: 'customer'
  },
  PAGE_SIZE: 10
} as const;
// Admin Routing and Navigation Test Suite
// This script tests all admin routes, navigation, and protection mechanisms

import { test, expect } from '@playwright/test';

const ADMIN_ROUTES = [
  '/admin/login',
  '/admin/dashboard',
  '/admin/products',
  '/admin/orders',
  '/admin/users',
  '/admin/categories',
  '/admin/inventory',
  '/admin/analytics'
];

const NAVIGATION_LINKS = [
  { path: '/admin/dashboard', label: 'Dashboard' },
  { path: '/admin/products', label: 'Products' },
  { path: '/admin/orders', label: 'Orders' },
  { path: '/admin/users', label: 'Users' },
  { path: '/admin/categories', label: 'Categories' },
  { path: '/admin/inventory', label: 'Inventory' },
  { path: '/admin/analytics', label: 'Analytics' }
];

const SUB_NAVIGATION_LINKS = [
  { path: '/admin/products', label: 'All Products' },
  { path: '/admin/categories', label: 'Categories' },
  { path: '/admin/inventory', label: 'Inventory' }
];

test.describe('Admin Routing and Navigation', () => {
  
  test('should load admin login page', async ({ page }) => {
    await page.goto('/admin/login');
    await expect(page.locator('text=Admin Panel')).toBeVisible();
    await expect(page.locator('text=Email')).toBeVisible();
    await expect(page.locator('text=Password')).toBeVisible();
  });

  test('should redirect unauthenticated users to login', async ({ page }) => {
    // Clear any existing auth
    await page.evaluate(() => localStorage.clear());
    
    for (const route of ADMIN_ROUTES.slice(1)) { // Skip login page
      await page.goto(route);
      await expect(page).toHaveURL('/admin/login');
      await expect(page.locator('text=Admin Panel')).toBeVisible();
    }
  });

  test('should protect admin routes with authentication', async ({ page }) => {
    // Try to access protected routes without auth
    for (const route of ADMIN_ROUTES.slice(1)) {
      await page.goto(route);
      await expect(page).toHaveURL('/admin/login');
    }
  });

  test('should show proper error states for unauthorized access', async ({ page }) => {
    await page.goto('/admin/dashboard');
    await expect(page.locator('text=Security Alert')).toBeVisible();
    await expect(page.locator('text=Restricted Area')).toBeVisible();
  });

  test('should have working navigation in admin layout', async ({ page }) => {
    // First login as admin
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Wait for redirect to dashboard
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Test main navigation links
    for (const navLink of NAVIGATION_LINKS) {
      await page.click(`text=${navLink.label}`);
      await expect(page).toHaveURL(navLink.path);
    }
  });

  test('should have working sub-navigation', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Test products dropdown
    await page.click('text=Products');
    await page.click('text=All Products');
    await expect(page).toHaveURL('/admin/products');
    
    await page.click('text=Products');
    await page.click('text=Categories');
    await expect(page).toHaveURL('/admin/categories');
    
    await page.click('text=Products');
    await page.click('text=Inventory');
    await expect(page).toHaveURL('/admin/inventory');
  });

  test('should handle sidebar toggle', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Test sidebar toggle
    const sidebar = page.locator('aside');
    await expect(sidebar).toBeVisible();
    
    // Toggle sidebar
    await page.click('[aria-label="Toggle sidebar"]');
    // Note: This test would need to be adapted based on actual sidebar implementation
  });

  test('should handle logout functionality', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Click logout
    await page.click('button:has-text("Logout")');
    
    // Should redirect to login page
    await expect(page).toHaveURL('/admin/login');
  });

  test('should handle 404 for non-existent admin routes', async ({ page }) => {
    await page.goto('/admin/nonexistent');
    await expect(page.locator('text=404')).toBeVisible();
    await expect(page.locator('text=Page not found')).toBeVisible();
  });

  test('should maintain authentication state across page refreshes', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Refresh page
    await page.reload();
    
    // Should still be authenticated
    await expect(page).toHaveURL('/admin/dashboard');
  });

  test('should handle loading states properly', async ({ page }) => {
    await page.goto('/admin/dashboard');
    
    // Should show loading state initially
    await expect(page.locator('.animate-spin')).toBeVisible();
    
    // Should eventually show dashboard content
    await expect(page.locator('text=Dashboard')).toBeVisible();
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate network error
    await page.route('**/*', route => {
      if (route.request().resourceType() === 'xhr') {
        route.abort();
      } else {
        route.continue();
      }
    });
    
    await page.goto('/admin/dashboard');
    
    // Should show error state
    await expect(page.locator('text=Dashboard Error')).toBeVisible();
  });

  test('should have proper meta tags and SEO', async ({ page }) => {
    await page.goto('/admin/login');
    
    await expect(page.locator('title')).toHaveText('Admin Panel');
    await expect(page.locator('meta[name="description"]')).toHaveAttribute('content', /admin panel/i);
  });

  test('should handle browser back/forward navigation', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Navigate to another page
    await page.click('text=Products');
    await expect(page).toHaveURL('/admin/products');
    
    // Use browser back
    await page.goBack();
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Use browser forward
    await page.goForward();
    await expect(page).toHaveURL('/admin/products');
  });

  test('should handle deep linking correctly', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Direct navigation to specific route
    await page.goto('/admin/orders');
    await expect(page).toHaveURL('/admin/orders');
    
    // Direct navigation to sub-route
    await page.goto('/admin/categories');
    await expect(page).toHaveURL('/admin/categories');
  });

  test('should handle concurrent route changes', async ({ page }) => {
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Rapid navigation
    await page.click('text=Products');
    await page.click('text=Orders');
    await page.click('text=Users');
    
    // Should end up on users page
    await expect(page).toHaveURL('/admin/users');
  });

  test('should handle route parameters correctly', async ({ page }) => {
    // Test routes that might have parameters
    await page.goto('/admin/products');
    await expect(page).toHaveURL('/admin/products');
    
    // If there are routes with parameters, test them here
    // await page.goto('/admin/products/123');
    // await expect(page).toHaveURL('/admin/products/123');
  });

  test('should handle mobile responsive navigation', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 812 });
    
    // Login first
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Test mobile navigation
    // This would depend on the actual mobile implementation
    // await page.click('[data-testid="mobile-menu-button"]');
    // await page.click('text=Products');
  });

});

// Additional utility functions for testing
export const testAdminRoutes = {
  checkRouteAccessibility: async (page, route, shouldRequireAuth = true) => {
    await page.goto(route);
    if (shouldRequireAuth) {
      await expect(page).toHaveURL('/admin/login');
    } else {
      await expect(page).toHaveURL(route);
    }
  },

  checkNavigationFlow: async (page, navigationSequence) => {
    for (const step of navigationSequence) {
      await page.click(`text=${step.label}`);
      await expect(page).toHaveURL(step.path);
    }
  },

  checkAuthenticationPersistence: async (page) => {
    // Login
    await page.goto('/admin/login');
    await page.fill('input[type="email"]', 'admin@example.com');
    await page.fill('input[type="password"]', 'admin123');
    await page.click('button[type="submit"]');
    
    // Verify login
    await expect(page).toHaveURL('/admin/dashboard');
    
    // Refresh and verify persistence
    await page.reload();
    await expect(page).toHaveURL('/admin/dashboard');
  }
};
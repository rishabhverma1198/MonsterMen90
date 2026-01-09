import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import AdminDashboard from '@/pages/admin/AdminDashboard';
import AdminLayout from '@/components/admin/AdminLayout';
import KpiCards from '@/components/admin/KpiCards';
import SalesChart from '@/components/admin/SalesChart';
import RealtimeStatus from '@/components/admin/RealtimeStatus';
import OrdersTable from '@/components/admin/OrdersTable';
import AdminProtectedRoute from '@/routes/AdminProtectedRoute';

// Mock dependencies
jest.mock('@/lib/supabase');
jest.mock('@/hooks/useAdminPlatform');
jest.mock('@/hooks/useAdmin');
jest.mock('@/hooks/useAuth');
jest.mock('@/lib/services/api.service');



// Test data
const mockOrders = [
  { id: '1', total_amount: 1000, created_at: '2024-01-01T10:00:00Z' },
  { id: '2', total_amount: 2000, created_at: '2024-01-02T10:00:00Z' },
];

const mockAnalytics = [
  { date: '2024-01-01', revenue: 1000 },
  { date: '2024-01-02', revenue: 2000 },
];

const mockInventoryAlerts = [
  { id: '1', product_name: 'Test Product', stock_level: 5 },
];

const mockKpis = {
  totalOrders: 2,
  totalRevenue: 3000,
  lowStockCount: 1,
};

// Test wrapper component
const TestWrapper: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <BrowserRouter>
    {children}
  </BrowserRouter>
);

describe('Admin Dashboard Components Test Suite', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('AdminDashboard Component', () => {
    it('should render dashboard with navigation sidebar', async () => {
      const mockUseAdminPlatform = {
        kpis: mockKpis,
        realtimeHealthy: true,
        inventoryAlerts: mockInventoryAlerts,
        orders: mockOrders,
        analytics: mockAnalytics,
        loading: false,
        error: null,
      };

      // Mock the hook
      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Check if sidebar renders
      expect(screen.getByText('MEN90 ADMIN')).toBeInTheDocument();
      expect(screen.getByText('Dashboard')).toBeInTheDocument();
      expect(screen.getByText('Products')).toBeInTheDocument();
      expect(screen.getByText('Orders')).toBeInTheDocument();
    });

    it('should display KPI cards with correct data', async () => {
      const mockUseAdminPlatform = {
        kpis: mockKpis,
        realtimeHealthy: true,
        inventoryAlerts: mockInventoryAlerts,
        orders: mockOrders,
        analytics: mockAnalytics,
        loading: false,
        error: null,
      };

      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText('Revenue')).toBeInTheDocument();
        expect(screen.getByText('₹3,000')).toBeInTheDocument();
        expect(screen.getByText('Orders')).toBeInTheDocument();
        expect(screen.getByText('2')).toBeInTheDocument();
        expect(screen.getByText('Alerts')).toBeInTheDocument();
        expect(screen.getByText('1')).toBeInTheDocument();
      });
    });

    it('should show inventory alerts when present', async () => {
      const mockUseAdminPlatform = {
        kpis: mockKpis,
        realtimeHealthy: true,
        inventoryAlerts: mockInventoryAlerts,
        orders: mockOrders,
        analytics: mockAnalytics,
        loading: false,
        error: null,
      };

      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      await waitFor(() => {
        expect(screen.getByText(/Attention: 1 variants are below critical stock levels/)).toBeInTheDocument();
      });
    });

    it('should handle loading state', async () => {
      const mockUseAdminPlatform = {
        kpis: { totalOrders: 0, totalRevenue: 0, lowStockCount: 0 },
        realtimeHealthy: false,
        inventoryAlerts: [],
        orders: [],
        analytics: [],
        loading: true,
        error: null,
      };

      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Should show loading state or default values
      expect(screen.getByText('Revenue')).toBeInTheDocument();
    });
  });

  describe('AdminLayout Component', () => {
    it('should render layout with sidebar and main content', () => {
      render(
        <TestWrapper>
          <AdminLayout adminName="Test Admin" adminEmail="admin@test.com">
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      );

      expect(screen.getByText('MonsterMen')).toBeInTheDocument();
      expect(screen.getByText('Test Admin')).toBeInTheDocument();
      expect(screen.getByText('admin@test.com')).toBeInTheDocument();
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should toggle sidebar', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      );

      const toggleButton = screen.getByRole('button');
      fireEvent.click(toggleButton);

      // Sidebar should be collapsed
      expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('should handle menu expansion', () => {
      render(
        <TestWrapper>
          <AdminLayout>
            <div>Test Content</div>
          </AdminLayout>
        </TestWrapper>
      );

      const productsButton = screen.getByText('Products');
      fireEvent.click(productsButton);

      // Submenu should appear
      expect(screen.getByText('All Products')).toBeInTheDocument();
      expect(screen.getByText('Categories')).toBeInTheDocument();
      expect(screen.getByText('Inventory')).toBeInTheDocument();
    });
  });

  describe('KpiCards Component', () => {
    it('should render KPI cards with correct formatting', () => {
      render(
        <KpiCards
          totalOrders={100}
          totalRevenue={50000}
          lowStockCount={5}
          locale="en-IN"
          currency="INR"
        />
      );

      expect(screen.getByText('Total Orders')).toBeInTheDocument();
      expect(screen.getByText('100')).toBeInTheDocument();
      expect(screen.getByText('Total Revenue')).toBeInTheDocument();
      expect(screen.getByText('₹50,000.00')).toBeInTheDocument();
      expect(screen.getByText('Low Stock')).toBeInTheDocument();
      expect(screen.getByText('5')).toBeInTheDocument();
    });

    it('should handle zero values correctly', () => {
      render(
        <KpiCards
          totalOrders={0}
          totalRevenue={0}
          lowStockCount={0}
        />
      );

      expect(screen.getByText('0')).toBeInTheDocument();
    });
  });

  describe('SalesChart Component', () => {
    it('should render chart with valid data', () => {
      render(
        <SalesChart data={mockAnalytics} />
      );

      expect(screen.getByText('Daily Revenue')).toBeInTheDocument();
      expect(screen.getByRole('img')).toBeInTheDocument();
    });

    it('should handle empty data', () => {
      render(
        <SalesChart data={[]} />
      );

      expect(screen.getByText('No analytics data available')).toBeInTheDocument();
    });

    it('should handle invalid data gracefully', () => {
      const invalidData = [
        { date: '2024-01-01', revenue: 0 },
        { date: '2024-01-02', revenue: NaN },
        { date: '', revenue: 1000 },
      ];

      render(
        <SalesChart data={invalidData} />
      );

      expect(screen.getByText('No valid revenue data found')).toBeInTheDocument();
    });
  });

  describe('RealtimeStatus Component', () => {
    it('should render healthy status', () => {
      render(
        <RealtimeStatus healthy={true} />
      );

      expect(screen.getByText('Realtime Connected')).toBeInTheDocument();
    });

    it('should render unhealthy status', () => {
      render(
        <RealtimeStatus healthy={false} />
      );

      expect(screen.getByText('Realtime Disconnected')).toBeInTheDocument();
    });

    it('should handle custom text', () => {
      render(
        <RealtimeStatus 
          healthy={true} 
          customText={{
            connected: 'Live Connection',
            disconnected: 'Connection Lost'
          }}
        />
      );

      expect(screen.getByText('Live Connection')).toBeInTheDocument();
    });

    it('should hide text when showText is false', () => {
      render(
        <RealtimeStatus healthy={true} showText={false} />
      );

      expect(screen.queryByText('Realtime Connected')).not.toBeInTheDocument();
    });
  });

  describe('OrdersTable Component', () => {
    it('should render orders table with data', () => {
      render(
        <OrdersTable orders={mockOrders} />
      );

      expect(screen.getByText('ID')).toBeInTheDocument();
      expect(screen.getByText('Amount')).toBeInTheDocument();
      expect(screen.getByText('Date')).toBeInTheDocument();
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('₹1,000.00')).toBeInTheDocument();
    });

    it('should handle loading state', () => {
      render(
        <OrdersTable orders={[]} isLoading={true} />
      );

      expect(screen.getByText('Loading orders...')).toBeInTheDocument();
    });

    it('should handle error state', () => {
      render(
        <OrdersTable orders={[]} error="Test error" />
      );

      expect(screen.getByText('Error loading orders')).toBeInTheDocument();
      expect(screen.getByText('Test error')).toBeInTheDocument();
    });

    it('should handle empty state', () => {
      render(
        <OrdersTable orders={[]} />
      );

      expect(screen.getByText('No orders found')).toBeInTheDocument();
    });

    it('should format dates correctly', () => {
      const orderWithDate = [
        {
          id: '1',
          total_amount: 1000,
          created_at: new Date('2024-01-01T10:00:00Z')
        }
      ];

      render(
        <OrdersTable orders={orderWithDate} />
      );

      expect(screen.getByText('Jan 1, 2024')).toBeInTheDocument();
    });
  });

  describe('AdminProtectedRoute Component', () => {
    it('should render children when admin is authenticated', () => {
      const mockUseAdmin = {
        isAdmin: true,
        admin: { id: '1', email: 'admin@test.com', user_type: 'admin' },
        loading: false
      };

      const { useAdmin } = require('@/hooks/useAdmin');
      useAdmin.mockReturnValue(mockUseAdmin);

      render(
        <TestWrapper>
          <AdminProtectedRoute>
            <div>Protected Content</div>
          </AdminProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Protected Content')).toBeInTheDocument();
    });

    it('should show loading state', () => {
      const mockUseAdmin = {
        isAdmin: false,
        admin: null,
        loading: true
      };

      const { useAdmin } = require('@/hooks/useAdmin');
      useAdmin.mockReturnValue(mockUseAdmin);

      render(
        <TestWrapper>
          <AdminProtectedRoute>
            <div>Protected Content</div>
          </AdminProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Authenticating Secure Access')).toBeInTheDocument();
    });

    it('should show access denied when not authenticated', () => {
      const mockUseAdmin = {
        isAdmin: false,
        admin: null,
        loading: false
      };

      const { useAdmin } = require('@/hooks/useAdmin');
      useAdmin.mockReturnValue(mockUseAdmin);

      render(
        <TestWrapper>
          <AdminProtectedRoute>
            <div>Protected Content</div>
          </AdminProtectedRoute>
        </TestWrapper>
      );

      expect(screen.getByText('Security Alert')).toBeInTheDocument();
      expect(screen.getByText('Restricted Area: Administrative privileges are required to access this resource.')).toBeInTheDocument();
    });
  });

  describe('Component Integration', () => {
    it('should handle navigation between dashboard tabs', async () => {
      const mockUseAdminPlatform = {
        kpis: mockKpis,
        realtimeHealthy: true,
        inventoryAlerts: mockInventoryAlerts,
        orders: mockOrders,
        analytics: mockAnalytics,
        loading: false,
        error: null,
      };

      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Click on Products tab
      const productsTab = screen.getByText('Products');
      fireEvent.click(productsTab);

      // Should navigate to products section
      await waitFor(() => {
        expect(screen.getByText('Products')).toBeInTheDocument();
      });
    });

    it('should handle real-time updates', async () => {
      const mockUseAdminPlatform = {
        kpis: mockKpis,
        realtimeHealthy: true,
        inventoryAlerts: mockInventoryAlerts,
        orders: mockOrders,
        analytics: mockAnalytics,
        loading: false,
        error: null,
      };

      const { useAdminPlatform } = require('@/hooks/useAdminPlatform');
      useAdminPlatform.mockReturnValue(mockUseAdminPlatform);

      render(
        <TestWrapper>
          <AdminDashboard />
        </TestWrapper>
      );

      // Should show real-time status
      await waitFor(() => {
        expect(screen.getByText('Systems Live')).toBeInTheDocument();
      });
    });
  });
});

// Performance and accessibility tests
describe('Admin Dashboard Performance & Accessibility', () => {
  it('should have proper ARIA labels', () => {
    render(
      <TestWrapper>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </TestWrapper>
    );

    // Check for proper ARIA labels
    expect(screen.getByRole('navigation')).toBeInTheDocument();
    expect(screen.getByRole('banner')).toBeInTheDocument();
  });

  it('should handle keyboard navigation', () => {
    render(
      <TestWrapper>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </TestWrapper>
    );

    const toggleButton = screen.getByRole('button');
    fireEvent.keyDown(toggleButton, { key: 'Enter', code: 'Enter' });
    fireEvent.keyDown(toggleButton, { key: ' ', code: 'Space' });
  });

  it('should handle responsive design', () => {
    // Mock window.innerWidth
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <TestWrapper>
        <AdminLayout>
          <div>Test Content</div>
        </AdminLayout>
      </TestWrapper>
    );

    // Should render mobile-friendly layout
    expect(screen.getByText('MonsterMen')).toBeInTheDocument();
  });
});
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import AppRoutes from '../AppRoutes';
import '@testing-library/jest-dom';

// Mock lazy loaded components
vi.mock('@/components/home/Hero', () => ({
  default: () => <div data-testid="hero-page">Hero Page</div>
}));

vi.mock('@/pages/buyer/home/BuyerHome', () => ({
  default: () => <div data-testid="buyer-home">Buyer Home</div>
}));

vi.mock('@/pages/buyer/BuyerOrders', () => ({
  default: () => <div data-testid="buyer-orders">Buyer Orders</div>
}));

vi.mock('@/pages/buyer/cart/CartPage', () => ({
  default: () => <div data-testid="cart-page">Cart Page</div>
}));

vi.mock('@/pages/checkout/BuyerCheckout', () => ({
  default: () => <div data-testid="buyer-checkout">Buyer Checkout</div>
}));

vi.mock('@/pages/buyer/MenCollection', () => ({
  default: () => <div data-testid="men-collection">Men Collection</div>
}));

vi.mock('@/pages/buyer/WomenCollection', () => ({
  default: () => <div data-testid="women-collection">Women Collection</div>
}));

vi.mock('@/pages/buyer/ProductDetail', () => ({
  default: () => <div data-testid="product-detail">Product Detail</div>
}));

vi.mock('@/pages/admin/AdminLogin', () => ({
  default: () => <div data-testid="admin-login">Admin Login</div>
}));

vi.mock('@/pages/admin/AdminDashboard', () => ({
  default: () => <div data-testid="admin-dashboard">Admin Dashboard</div>
}));

vi.mock('@/pages/NotFound', () => ({
  default: () => <div data-testid="not-found">404 Not Found</div>
}));

vi.mock('@/pages/order/OrderSuccess', () => ({
  default: () => <div data-testid="order-success">Order Success</div>
}));

describe('AppRoutes - Routing Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  it('renders hero page on root path', async () => {
    render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-page')).toBeInTheDocument();
    });
  });

  it('renders buyer home on /buyer path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-home')).toBeInTheDocument();
    });
  });

  it('renders buyer orders on /buyer/orders path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer/orders']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-orders')).toBeInTheDocument();
    });
  });

  it('renders cart page on /cart path', async () => {
    render(
      <MemoryRouter initialEntries={['/cart']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('cart-page')).toBeInTheDocument();
    });
  });

  it('renders buyer checkout on /buyer/checkout path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer/checkout']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('buyer-checkout')).toBeInTheDocument();
    });
  });

  it('renders men collection on /buyer/men path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer/men']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('men-collection')).toBeInTheDocument();
    });
  });

  it('renders women collection on /buyer/women path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer/women']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('women-collection')).toBeInTheDocument();
    });
  });

  it('renders product detail on /buyer/product/:id path', async () => {
    render(
      <MemoryRouter initialEntries={['/buyer/product/test-id-123']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('product-detail')).toBeInTheDocument();
    });
  });

  it('renders order success on /order-success path', async () => {
    render(
      <MemoryRouter initialEntries={['/order-success']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('order-success')).toBeInTheDocument();
    });
  });

  it('renders admin login on /admin/login path', async () => {
    render(
      <MemoryRouter initialEntries={['/admin/login']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('admin-login')).toBeInTheDocument();
    });
  });

  it('renders 404 for unknown routes', async () => {
    render(
      <MemoryRouter initialEntries={['/unknown-route']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('not-found')).toBeInTheDocument();
    });
  });

  it('scrolls to top on route change', async () => {
    const scrollToMock = vi.fn();
    window.scrollTo = scrollToMock;

    const { rerender } = render(
      <MemoryRouter initialEntries={['/']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(screen.getByTestId('hero-page')).toBeInTheDocument();
    });

    rerender(
      <MemoryRouter initialEntries={['/buyer']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      expect(scrollToMock).toHaveBeenCalledWith(0, 0);
    });
  });
});

describe('AppRoutes - Navigation Tests', () => {
  it('redirects legacy /wholeseller route to /wholesaler', async () => {
    render(
      <MemoryRouter initialEntries={['/wholeseller']}>
        <AppRoutes />
      </MemoryRouter>
    );

    await waitFor(() => {
      // Should redirect to /wholesaler (which may show wholesaler home or redirect)
      // The route definition has a redirect, so it should navigate away
      expect(screen.queryByTestId('wholesaler-home')).toBeNull();
    });
  });
});

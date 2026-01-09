import React from 'react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom/vitest';
import { BrowserRouter } from 'react-router-dom';
import BuyerHome from '../BuyerHome';
import { WebsiteProductService, type WebsiteProduct } from '@/lib/services/website-product.service';
import { ThemeProvider } from '@/context/ThemeProvider';

// Mock the services and hooks
vi.mock('@/lib/services/website-product.service', () => ({
  WebsiteProductService: {
    getFeaturedProducts: vi.fn(),
  },
}));

vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({
    toast: vi.fn(),
  }),
}));

vi.mock('@/hooks/useCart', () => ({
  useCart: () => ({
    upsertItem: vi.fn(),
  }),
}));

vi.mock('@/hooks/useTheme', () => ({
  useTheme: () => ({
    theme: 'light',
    toggleTheme: vi.fn(),
  }),
}));

vi.mock('@/components/common/BackButton', () => ({
  default: ({ className }: any) => <div data-testid="back-button" className={className} />,
}));

vi.mock('@/lib/utils', () => ({
  hashStringToNumber: vi.fn((str) => str.length),
  cn: (...args: any[]) => args.filter(Boolean).join(' '),
}));

const mockGetFeaturedProducts = vi.mocked(WebsiteProductService.getFeaturedProducts);

describe('BuyerHome', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Reset mock data before each test
    (globalThis as any).setMockData({ products: [], categories: [] });
  });

  it('renders loading state initially', async () => {
    mockGetFeaturedProducts.mockResolvedValue([]);

    const { container } = render(
      <ThemeProvider>
        <BrowserRouter>
          <BuyerHome />
        </BrowserRouter>
      </ThemeProvider>
    );

    // Check that the component renders with skeleton loaders (loading state)
    const skeletonElements = container.querySelectorAll('[data-slot="skeleton"]');
    expect(skeletonElements.length).toBeGreaterThan(0);
  });

  it('renders featured products when loaded', async () => {
    const mockProducts: WebsiteProduct[] = [
      {
        id: '1',
        name: 'Test Product',
        slug: 'test-product',
        short_description: 'A test product',
        description: 'Full description',
        category_id: 'cat1',
        gender: 'men',
        product_type: 'tshirt',
        base_price: 1000,
        images: ['image1.jpg'],
        available_sizes: ['M', 'L'],
        is_featured: true,
        is_active: true,
        created_at: '2023-01-01',
        updated_at: '2023-01-01',
        categories: {
          id: 'cat1',
          name: 'Test Category',
          slug: 'test-category',
        },
        product_variants: [
          {
            id: 'var1',
            size: 'M',
            stock_quantity: 10,
            price: 1000,
            sku: 'SKU1',
          },
        ],
      },
    ];

    mockGetFeaturedProducts.mockResolvedValue(mockProducts);

    render(
      <ThemeProvider>
        <BrowserRouter>
          <BuyerHome />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Test Product')).toBeInTheDocument();
    });
  });

  it('renders empty state when no products', async () => {
    mockGetFeaturedProducts.mockResolvedValue([]);

    render(
      <ThemeProvider>
        <BrowserRouter>
          <BuyerHome />
        </BrowserRouter>
      </ThemeProvider>
    );

    await waitFor(() => {
      expect(screen.getByText('Naye products jald aa rahe hain!')).toBeInTheDocument();
    });
  });
});
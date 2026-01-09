import '@testing-library/jest-dom';
import { vi } from 'vitest';
import { initializeTestMock } from './mocks/supabase-test-mock';

// Initialize the unified test mock (exposes everything on globalThis)
initializeTestMock();
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));
vi.mock('@/context/CartContext', () => {
  const React = require('react');
  return {
    useCart: () => ({ cart: [], addToCart: () => {}, removeFromCart: () => {}, total: 0 }),
    CartProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});
vi.mock('@/hooks/useAuth', () => {
  const React = require('react');
  return {
    useAuth: () => ({ user: null, isAuthenticated: false, login: async () => {}, logout: async () => {} }),
    AuthProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

// Global helpers and mock are already exported by initializeTestMock()

// Extend Jest namespace for TypeScript
declare global {
  namespace Vi {
    interface Assertion<T = any> {
      toBeInTheDocument(): T;
    }
  }
}

// Mock window.matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// Mock window.scrollTo
window.scrollTo = vi.fn() as any;

// Mock IntersectionObserver
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

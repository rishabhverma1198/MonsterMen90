import { vi } from 'vitest';
const mockDataStore: Record<string, any> = {
  users: {
    id: 'uid-123',
    email: 'admin@example.com',
    full_name: 'Admin User',
    user_type: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  products: [
    { id: '1', name: 'Product 1', base_price: 999 },
    { id: '2', name: 'Product 2', base_price: 1499 },
  ],
  categories: [
    { id: 'c1', name: 'Shirts' },
    { id: 'c2', name: 'Pants' },
  ],
};

export function setMockData(data: Record<string, any>) {
  Object.assign(mockDataStore, data);
}

// Allow tests to inject errors per table
const mockErrorStore: Record<string, any> = {};
export function setMockError(table: string, error: any) {
  if (error === null) delete mockErrorStore[table];
  else mockErrorStore[table] = error;
}

// Helper: create a chainable query object for a table
function createQuery(table: string) {
  const state = { table, _from: 0, _to: undefined, _limit: undefined, filters: [], orFilters: [] } as any;

  const resultFor = async () => {
    // If test injected an error for this table, return it
    if (mockErrorStore[table]) {
      return { data: null, error: mockErrorStore[table], count: 0 };
    }

    const tableData = mockDataStore[table];
    if (Array.isArray(tableData)) {
      // apply filters
      let items = tableData.slice();
      // apply eq/gte/lte/gt/lt filters
      for (const f of state.filters) {
        const { op, col, val } = f;
        items = items.filter((it: any) => {
          const v = it[col];
          if (v === undefined) return false;
          switch (op) {
            case 'eq':
              return v === val;
            case 'gte':
              return Number(v) >= Number(val);
            case 'lte':
              return Number(v) <= Number(val);
            case 'gt':
              return Number(v) > Number(val);
            case 'lt':
              return Number(v) < Number(val);
            case 'neq':
              return v !== val;
            default:
              return true;
          }
        });
      }

      // apply OR filters (simple ilike matching support)
      if (state.orFilters.length) {
        items = items.filter((it: any) => {
          return state.orFilters.some((clause: string) => {
            // clause like 'name.ilike.%shirt%'
            const parts = clause.split('.');
            if (parts.length < 3) return false;
            const field = parts[0];
            const operator = parts[1];
            const raw = parts.slice(2).join('.');
            const pattern = raw.replace(/%/g, '').replace(/^\(|\)$/g, '');
            const val = String(it[field] ?? '');
            if (operator === 'ilike') {
              return val.toLowerCase().includes(pattern.toLowerCase());
            }
            return false;
          });
        });
      }

      // apply range/limit slicing if requested
      if (typeof state._from === 'number' && typeof state._to === 'number') {
        items = items.slice(state._from, state._to + 1);
      } else if (typeof state._limit === 'number') {
        items = items.slice(0, state._limit);
      }

      return { data: items, error: null, count: items.length };
    }
    return { data: tableData ?? null, error: null };
  };

  const query: any = {
    select: (..._args: any[]) => query,
    eq: (col: string, val: any) => { state.filters.push({ op: 'eq', col, val }); return query; },
    or: (q: string) => { state.orFilters.push(...String(q).split(',')); return query; },
    range: (from: number, to: number) => { state._from = from; state._to = to; return query; },
    order: (_col: string, _opts?: any) => query,
    limit: (n: number) => { state._limit = n; return query; },
    gte: (col: string, val: any) => { state.filters.push({ op: 'gte', col, val }); return query; },
    lte: (col: string, val: any) => { state.filters.push({ op: 'lte', col, val }); return query; },
    single: async () => {
      if (mockErrorStore[table]) return { data: null, error: mockErrorStore[table] };
      const tableData = mockDataStore[table];
      if (Array.isArray(tableData)) {
        return { data: tableData[0] ?? null, error: null };
      }
      return { data: tableData ?? null, error: null };
    },
    then: (cb: any) => resultFor().then(cb),
    return: async () => resultFor(),
    orderBy: (_col: string) => query,
  };

  return query;
}

// Default export mock for module
vi.mock('@/lib/utils', () => ({ cn: (...args: any[]) => args.filter(Boolean).join(' ') }));

// Mock CartContext so tests rendering top-level routes don't need the real provider
vi.mock('@/context/CartContext', () => {
  const React = require('react');
  return {
    useCart: () => ({ cart: [], addToCart: () => {}, removeFromCart: () => {}, total: 0 }),
    CartProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

// Mock auth hook to avoid needing real AuthProvider in route tests
vi.mock('@/hooks/useAuth', () => {
  const React = require('react');
  return {
    useAuth: () => ({ user: null, isAuthenticated: false, login: async () => {}, logout: async () => {} }),
    AuthProvider: ({ children }: any) => React.createElement(React.Fragment, null, children),
  };
});

// Create supabase mock object
const supabaseMock = {
  auth: {
    getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
    onAuthStateChange: vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } })),
    signOut: vi.fn(async () => ({ error: null })),
  },
  from: vi.fn((table: string) => createQuery(table)),
};

// Provide a way for tests to override auth session
export function setSession(session: any) {
  supabaseMock.auth.getSession.mockImplementation(async () => ({ data: { session }, error: null }));
}

// Set implementation of supabase.from mock (hoisted so it can be used in vitest lifecycle)
vi.doMock('@/lib/supabase', () => ({ supabase: supabaseMock }));

// Export default for other imports
export default {
  supabase: supabaseMock,
  setMockData,
  setSession,
};

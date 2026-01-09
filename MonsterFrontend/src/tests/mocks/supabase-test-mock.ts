import { vi } from 'vitest';

/**
 * Unified Supabase test mock factory.
 * This module centralizes all mock creation and global setup to eliminate
 * import-order and initialization issues.
 */

// Global data stores (one source of truth)
const __TEST_MOCK_DATA__ = { products: [], categories: [] };
const __TEST_MOCK_ERROR__: Record<string, any> = {};

/**
 * Create a chainable query mock that emulates Supabase's fluent API.
 * Supports: select, eq, gte, lte, or, range, order, limit, single, then, and awaiting.
 */
function createQuery(table: string) {
  const state: any = {
    table,
    _from: 0,
    _to: undefined,
    _limit: undefined,
    filters: [],
    orFilters: []
  };

  const resultFor = async () => {
    if (__TEST_MOCK_ERROR__[table]) {
      return { data: null, error: __TEST_MOCK_ERROR__[table], count: 0 };
    }

    const tableData = __TEST_MOCK_DATA__[table as keyof typeof __TEST_MOCK_DATA__];
    if (Array.isArray(tableData)) {
      let items = tableData.slice();

      // Apply filters
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

      // Apply or filters (search/ilike patterns)
      if (state.orFilters.length) {
        items = items.filter((it: any) => {
          return state.orFilters.some((clause: string) => {
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

      // Apply range/limit
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
    eq: (col: string, val: any) => {
      state.filters.push({ op: 'eq', col, val });
      return query;
    },
    or: (q: string) => {
      state.orFilters.push(...String(q).split(','));
      return query;
    },
    range: (from: number, to: number) => {
      state._from = from;
      state._to = to;
      return query;
    },
    order: (_col: string, _opts?: any) => query,
    limit: (n: number) => {
      state._limit = n;
      return query;
    },
    gte: (col: string, val: any) => {
      state.filters.push({ op: 'gte', col, val });
      return query;
    },
    lte: (col: string, val: any) => {
      state.filters.push({ op: 'lte', col, val });
      return query;
    },
    single: async () => {
      if (__TEST_MOCK_ERROR__[table]) {
        return { data: null, error: __TEST_MOCK_ERROR__[table] };
      }
      const tableData = __TEST_MOCK_DATA__[table as keyof typeof __TEST_MOCK_DATA__];
      if (Array.isArray(tableData)) {
        const res = await resultFor();
        return { data: (res.data && res.data[0]) ?? null, error: null };
      }
      return { data: tableData ?? null, error: null };
    },
    then: (resolve: any, reject: any) => resultFor().then(resolve).catch(reject),
    return: async () => resultFor(),
    orderBy: (_col: string) => query,
  };

  return query;
}

/**
 * Create the centralized Supabase mock object.
 * Tracks which methods are called via vi.fn() for test assertions.
 */
export function createSupabaseMock() {
  // Wrap the from function to track calls while still returning the query
  const fromFn = vi.fn();
  
  const mock = {
    auth: {
      getSession: vi.fn(async () => ({ data: { session: null }, error: null })),
      onAuthStateChange: vi.fn(() => ({
        data: { subscription: { unsubscribe: vi.fn() } }
      })),
      signOut: vi.fn(async () => ({ error: null })),
    },
    from: (table: string) => {
      // Track the call but ensure we always return the query
      fromFn(table);
      console.log(`[supabase mock] from() called with table: ${table}`);
      const query = createQuery(table);
      if (!query) {
        console.error(`[supabase mock] ERROR: createQuery returned falsy for table: ${table}`);
      }
      return query;
    },
  };

  return mock;
}

/**
 * Initialize the global test environment.
 * Must be called from setup.ts before any tests run.
 */
export function initializeTestMock() {
  const supabaseMock = createSupabaseMock();

  // Expose stores so tests can call setMockData/setMockError
  (globalThis as any).__TEST_MOCK_DATA__ = __TEST_MOCK_DATA__;
  (globalThis as any).__TEST_MOCK_ERROR__ = __TEST_MOCK_ERROR__;

  // Expose the mock itself for both vi.mock and direct fallback access
  (globalThis as any).__TEST_SUPABASE_MOCK__ = supabaseMock;

  // Export helpers for tests
  (globalThis as any).setMockData = (data: Record<string, any>) => {
    Object.assign(__TEST_MOCK_DATA__, data);
  };

  (globalThis as any).setMockError = (table: string, error: any) => {
    if (error === null) {
      delete __TEST_MOCK_ERROR__[table];
    } else {
      __TEST_MOCK_ERROR__[table] = error;
    }
  };

  (globalThis as any).setSession = (session: any) => {
    supabaseMock.auth.getSession.mockImplementation(async () => ({
      data: { session },
      error: null,
    }));
  };

  console.log('[test-mock] Supabase mock initialized on globalThis');

  return supabaseMock;
}

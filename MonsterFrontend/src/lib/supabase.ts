import { createClient } from "@supabase/supabase-js";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

let realClient: any = null;
function getRealClient() {
  if (!realClient) {
    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error(
        "❌ Supabase environment variables are missing.\n" +
        "Check MonsterFrontend/.env for VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY"
      );
    }
    realClient = createClient(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      }
    });
  }
  return realClient;
}

// Wrapper that uses test mock if available, otherwise creates real client.
// Test mock is set globally by src/tests/mocks/supabase-test-mock.ts
export const supabase: any = {
  from(table: string) {
    const testMock = (globalThis as any).__TEST_SUPABASE_MOCK__;
    if (testMock && typeof testMock.from === 'function') {
      console.log(`[supabase] Using test mock for table: ${table}`);
      return testMock.from(table);
    }
    console.log(`[supabase] Using real client for table: ${table}`);
    return getRealClient().from(table);
  },
  auth: {
    getSession: async (...args: any[]) => {
      const testMock = (globalThis as any).__TEST_SUPABASE_MOCK__;
      if (testMock && testMock.auth && typeof testMock.auth.getSession === 'function') {
        return testMock.auth.getSession(...args);
      }
      return getRealClient().auth.getSession(...args);
    },
    onAuthStateChange: (...args: any[]) => {
      const testMock = (globalThis as any).__TEST_SUPABASE_MOCK__;
      if (testMock && testMock.auth && typeof testMock.auth.onAuthStateChange === 'function') {
        return testMock.auth.onAuthStateChange(...args);
      }
      return getRealClient().auth.onAuthStateChange(...args);
    },
    signOut: async (...args: any[]) => {
      const testMock = (globalThis as any).__TEST_SUPABASE_MOCK__;
      if (testMock && testMock.auth && typeof testMock.auth.signOut === 'function') {
        return testMock.auth.signOut(...args);
      }
      return getRealClient().auth.signOut(...args);
    }
  }
};

export default supabase;
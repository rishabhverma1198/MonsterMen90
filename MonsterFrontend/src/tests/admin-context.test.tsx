import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { vi } from 'vitest';

// Mock supabase module
vi.mock('@/lib/supabase', () => {
  const mockUserProfile = {
    id: 'uid-123',
    email: 'admin@example.com',
    full_name: 'Admin User',
    user_type: 'admin',
    is_active: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };

  const single = vi.fn(() => Promise.resolve({ data: mockUserProfile, error: null }));
  const eq = vi.fn(() => ({ single }));
  const select = vi.fn(() => ({ eq }));
  const from = vi.fn(() => ({ select }));

  const getSession = vi.fn(() => Promise.resolve({ data: { session: { user: { id: 'uid-123' } } }, error: null }));
  const onAuthStateChange = vi.fn(() => ({ data: { subscription: { unsubscribe: vi.fn() } } }));

  return {
    supabase: {
      auth: {
        getSession,
        onAuthStateChange
      },
      from,
    }
  };
});

import { AdminProvider, useAdmin } from '@/context/AdminContext';

function Consumer() {
  const { admin, isAdmin, loading } = useAdmin();
  if (loading) return <div>loading</div>;
  return <div>{isAdmin ? `admin:${admin?.email}` : 'not-admin'}</div>;
}

describe('AdminContext', () => {
  it('provides admin when session and profile exist', async () => {
    render(
      <AdminProvider>
        <Consumer />
      </AdminProvider>
    );

    await waitFor(() => expect(screen.queryByText(/loading/)).not.toBeInTheDocument());

    expect(screen.getByText(/admin:admin@example.com/)).toBeInTheDocument();
  });
});

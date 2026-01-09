import { vi } from 'vitest';

export const mockAdminUserService = {
  getUsers: vi.fn(),
  createUser: vi.fn(),
  updateUser: vi.fn(),
  deactivateUser: vi.fn(),
  getUser: vi.fn(),
  getUserActivity: vi.fn(),
  searchUsers: vi.fn(),
  exportUsers: vi.fn()
};
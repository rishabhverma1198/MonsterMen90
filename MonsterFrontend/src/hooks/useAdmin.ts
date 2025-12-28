import { AdminContext } from '@/context/AdminContextValue';
import { useContext } from 'react';

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within an AdminProvider');
  }
  return context;
}
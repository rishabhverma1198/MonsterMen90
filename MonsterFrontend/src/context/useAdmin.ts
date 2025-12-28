import { useContext } from 'react';
import { AdminContext } from './AdminContextValue';

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin must be used within AdminProvider');
  }
  return context;
}
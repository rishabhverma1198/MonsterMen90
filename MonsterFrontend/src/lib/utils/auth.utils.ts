/**
 * Authentication Utilities
 * Handles JWT token retrieval and session management
 */

import { supabase } from '@/lib/supabase';

/**
 * Get current session token
 * Waits for session to be ready before returning token
 */
export async function getAuthToken(): Promise<string | null> {
  try {
    // Wait for session to initialize
    const { data: { session }, error } = await supabase.auth.getSession();
    
    if (error) {
      console.error('[getAuthToken] Session error:', error);
      return null;
    }
    
    if (!session || !session.access_token) {
      console.warn('[getAuthToken] No active session');
      return null;
    }
    
    return session.access_token;
  } catch (error) {
    console.error('[getAuthToken] Error getting token:', error);
    return null;
  }
}

/**
 * Wait for session to be ready
 * Retries up to maxRetries times
 */
export async function waitForSession(
  maxRetries: number = 5,
  delayMs: number = 500
): Promise<string | null> {
  for (let i = 0; i < maxRetries; i++) {
    const token = await getAuthToken();
    if (token) {
      return token;
    }
    
    // Wait before retrying
    if (i < maxRetries - 1) {
      await new Promise(resolve => setTimeout(resolve, delayMs));
    }
  }
  
  console.warn('[waitForSession] Session not ready after', maxRetries, 'retries');
  return null;
}

/**
 * Check if user is authenticated
 */
export async function isAuthenticated(): Promise<boolean> {
  const token = await getAuthToken();
  return token !== null;
}

/**
 * Get authenticated headers for API requests
 */
export async function getAuthHeaders(): Promise<HeadersInit> {
  const token = await getAuthToken();
  
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }
  
  return headers;
}


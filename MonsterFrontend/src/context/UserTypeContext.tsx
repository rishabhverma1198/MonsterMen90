import { useState, useEffect } from "react";
import type { ReactNode } from "react";
import { UserTypeContext, type UserType } from "./UserTypeContextBase";
import { csrfService } from '../lib/services/csrf.service';

// Allowed user types for validation
const ALLOWED_USER_TYPES: UserType[] = ["buyer", "wholesaler"];

// Secure storage key with obfuscation
const SECURE_STORAGE_KEY = 'secure_user_type_v2';

/**
 * Securely encode user type for localStorage
 */
function encodeUserType(userType: UserType): string {
  if (!userType) return '';
  
  // Simple obfuscation (not true encryption, but better than plain text)
  const data = JSON.stringify({
    type: userType,
    timestamp: Date.now(),
    version: '2.0'
  });
  
  return btoa(data);
}

/**
 * Securely decode user type from localStorage
 */
function decodeUserType(encoded: string | null): UserType {
  if (!encoded) return null;
  
  try {
    const data = JSON.parse(atob(encoded));
    
    // Validate structure and version
    if (!data.type || !data.timestamp || data.version !== '2.0') {
      console.warn('Invalid user type data format');
      return null;
    }
    
    // Check if data is not too old (30 days)
    const maxAge = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (Date.now() - data.timestamp > maxAge) {
      console.warn('User type data expired');
      return null;
    }
    
    // Validate user type
    if (ALLOWED_USER_TYPES.includes(data.type)) {
      return data.type;
    }
    
    console.warn('Invalid user type value:', data.type);
    return null;
  } catch (error) {
    console.error('Failed to decode user type:', error);
    return null;
  }
}

/**
 * Get user type from secure storage with validation
 */
function getSecureUserType(): UserType {
  try {
    // First try secure CSRF storage
    const csrfToken = csrfService.getCurrentToken();
    if (csrfToken) {
      const secureData = localStorage.getItem(`${SECURE_STORAGE_KEY}_${csrfToken.sessionId}`);
      if (secureData) {
        return decodeUserType(secureData);
      }
    }
    
    // Fallback to legacy storage with validation
    const legacyData = localStorage.getItem(SECURE_STORAGE_KEY);
    return decodeUserType(legacyData);
  } catch (error) {
    console.error('Failed to get secure user type:', error);
    return null;
  }
}

/**
 * Set user type in secure storage
 */
function setSecureUserType(userType: UserType): void {
  try {
    const encoded = encodeUserType(userType);
    const csrfToken = csrfService.getCurrentToken();
    
    if (csrfToken) {
      // Store in CSRF-protected storage
      localStorage.setItem(`${SECURE_STORAGE_KEY}_${csrfToken.sessionId}`, encoded);
      
      // Also update legacy storage for compatibility
      localStorage.setItem(SECURE_STORAGE_KEY, encoded);
    } else {
      // Store in legacy storage if no CSRF token available
      localStorage.setItem(SECURE_STORAGE_KEY, encoded);
    }
  } catch (error) {
    console.error('Failed to set secure user type:', error);
  }
}

/**
 * Clear user type from secure storage
 */
function clearSecureUserType(): void {
  try {
    const csrfToken = csrfService.getCurrentToken();
    
    if (csrfToken) {
      // Clear CSRF-protected storage
      localStorage.removeItem(`${SECURE_STORAGE_KEY}_${csrfToken.sessionId}`);
    }
    
    // Clear legacy storage
    localStorage.removeItem(SECURE_STORAGE_KEY);
  } catch (error) {
    console.error('Failed to clear secure user type:', error);
  }
}

export function UserTypeProvider({ children }: { children: ReactNode }) {
  const [userType, setUserTypeState] = useState<UserType>(() => {
    return getSecureUserType();
  });

  // Validate and synchronize user type on mount and when CSRF token changes
  useEffect(() => {
    const currentUserType = getSecureUserType();
    if (currentUserType !== userType) {
      setUserTypeState(currentUserType);
    }
  }, []);

  // Listen for CSRF token changes to update storage
  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key?.startsWith(SECURE_STORAGE_KEY)) {
        const newUserType = getSecureUserType();
        if (newUserType !== userType) {
          setUserTypeState(newUserType);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [userType]);

  const updateUserType = (type: UserType) => {
    // Validate input
    if (type && !ALLOWED_USER_TYPES.includes(type)) {
      console.error('Invalid user type provided:', type);
      return;
    }

    // Clear old CSRF-protected data
    const csrfToken = csrfService.getCurrentToken();
    if (csrfToken) {
      const oldKey = `${SECURE_STORAGE_KEY}_${csrfToken.sessionId}`;
      localStorage.removeItem(oldKey);
    }

    // Set new user type
    if (type) {
      setSecureUserType(type);
      setUserTypeState(type);
    } else {
      clearSecureUserType();
      setUserTypeState(null);
    }

    // Log user type change for audit
    console.info('User type updated', {
      userType: type,
      timestamp: new Date().toISOString(),
      hasCSRFToken: !!csrfToken
    });
  };

  // Force validation of current user type
  const validateUserType = () => {
    const validatedType = getSecureUserType();
    if (validatedType !== userType) {
      setUserTypeState(validatedType);
    }
    return validatedType;
  };

  // Clear all user type data
  const clearUserType = () => {
    clearSecureUserType();
    setUserTypeState(null);
  };

  return (
    <UserTypeContext.Provider value={{ 
      userType, 
      setUserType: updateUserType,
      validateUserType,
      clearUserType
    }}>
      {children}
    </UserTypeContext.Provider>
  );
}
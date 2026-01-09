import { useState, useRef, useCallback } from 'react';

/**
 * Production-Ready Form Utilities
 * Prevents double-submission and handles form state
 */

/**
 * Hook to prevent double-submission
 */
export function useFormSubmission() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const submitRef = useRef<AbortController | null>(null);

  const handleSubmit = useCallback(
    async <T,>(
      submitFn: () => Promise<T>,
      onSuccess?: (result: T) => void,
      onError?: (error: Error) => void
    ): Promise<T | null> => {
      // Prevent double submission
      if (isSubmitting) {
        console.warn('Form submission already in progress');
        return null;
      }

      setIsSubmitting(true);
      submitRef.current = new AbortController();

      try {
        const result = await submitFn();
        onSuccess?.(result);
        return result;
      } catch (error) {
        const err = error instanceof Error ? error : new Error('Unknown error');
        onError?.(err);
        throw err;
      } finally {
        setIsSubmitting(false);
        submitRef.current = null;
      }
    },
    [isSubmitting]
  );

  const cancel = useCallback(() => {
    if (submitRef.current) {
      submitRef.current.abort();
      submitRef.current = null;
    }
    setIsSubmitting(false);
  }, []);

  return {
    isSubmitting,
    handleSubmit,
    cancel
  };
}

/**
 * Debounce function for form inputs
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: ReturnType<typeof setTimeout> | null = null;

  return function executedFunction(...args: Parameters<T>) {
    const later = () => {
      timeout = null;
      func(...args);
    };

    if (timeout) {
      clearTimeout(timeout);
    }
    timeout = setTimeout(later, wait);
  };
}


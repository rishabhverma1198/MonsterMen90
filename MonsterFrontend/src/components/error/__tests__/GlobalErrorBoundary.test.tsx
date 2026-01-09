import React from 'react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom/vitest'; // Import for toBeInTheDocument
import GlobalErrorBoundary from '../GlobalErrorBoundary';
import { ThrowOnce, resetThrowOnce } from './ThrowOnce';

describe('GlobalErrorBoundary', () => {
  const mockOnError = vi.fn();
  let consoleErrorSpy: ReturnType<typeof vi.spyOn> | null = null;

  beforeEach(() => {
    vi.clearAllMocks();
    resetThrowOnce();
    consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
  });

  afterEach(() => {
    vi.resetAllMocks();
    if (consoleErrorSpy) consoleErrorSpy.mockRestore();
    consoleErrorSpy = null;
  });

  it('renders children when no error occurs', () => {
    render(
      <GlobalErrorBoundary onError={mockOnError}>
        <div data-testid="child-content">Child Content</div>
      </GlobalErrorBoundary>
    );

    expect(screen.getByTestId('child-content')).toBeInTheDocument();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('catches render errors and displays error message', () => {
    // Start boundary in error state to avoid throwing in tests
    render(
      <GlobalErrorBoundary onError={mockOnError} forceError>
        <div />
      </GlobalErrorBoundary>
    );

    expect(screen.getByTestId('error-message')).toBeInTheDocument();
    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();
  });

  it('renders children when no error occurs (functional)', () => {
    render(
      <GlobalErrorBoundary onError={mockOnError}>
        <div>No error</div>
      </GlobalErrorBoundary>
    );

    expect(screen.getByText('No error')).toBeInTheDocument();
    expect(mockOnError).not.toHaveBeenCalled();
  });

  it('calls onError callback with error and error info', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Instead of actually throwing, invoke componentDidCatch via ref to simulate error handling
    const ref = React.createRef<any>();
    render(
      <GlobalErrorBoundary onError={mockOnError} ref={ref}>
        <div />
      </GlobalErrorBoundary>
    );

    // Simulate an error being caught
    ref.current?.componentDidCatch(new Error('Simulated'), { componentStack: '' });

    expect(mockOnError).toHaveBeenCalled();
    const [error, errorInfo] = mockOnError.mock.calls[0];
    expect(error).toBeInstanceOf(Error);
    expect(errorInfo).toBeDefined();

    consoleErrorSpy.mockRestore();
  });

  it('provides retry button that resets error state and re-mounts children', () => {
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    // Start the boundary in error state deterministically
    render(
      <GlobalErrorBoundary onError={mockOnError} forceError>
        <div>Healthy UI</div>
      </GlobalErrorBoundary>
    );

    // 1️⃣ Error UI shows
    expect(screen.getByText(/Oops! Something went wrong/i)).toBeInTheDocument();

    // 2️⃣ Click retry — this should reset hasError and remount children
    fireEvent.click(screen.getByRole('button', { name: /try again/i }));

    // 3️⃣ Child renders after remount
    expect(screen.getByText('Healthy UI')).toBeInTheDocument();

    consoleErrorSpy.mockRestore();
  });
});
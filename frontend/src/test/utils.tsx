/**
 * Test Utilities
 * Sprint 5: Frontend Testing Infrastructure
 *
 * Provides helper functions for rendering components with required providers
 */

import { render, RenderOptions } from '@testing-library/react';
import { ReactElement } from 'react';
import { vi } from 'vitest';
import { SettingsProvider } from '../contexts/SettingsContext';
import { AuthProvider } from '../contexts/AuthContext';
import { ModalProvider } from '../contexts/ModalContext';

/**
 * Custom render function that wraps components with required providers
 */
export function renderWithProviders(
  ui: ReactElement,
  options?: Omit<RenderOptions, 'wrapper'>
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <SettingsProvider>
        <AuthProvider>
          <ModalProvider>
            {children}
          </ModalProvider>
        </AuthProvider>
      </SettingsProvider>
    );
  }

  return render(ui, { wrapper: Wrapper, ...options });
}

/**
 * Mock Socket.IO client for testing
 */
export function createMockSocket(): any {
  const listeners: Record<string, Function[]> = {};

  const mockSocket: any = {
    id: 'test-socket-id',
    connected: true,
    disconnected: false,
    on: vi.fn((event: string, callback: Function) => {
      if (!listeners[event]) {
        listeners[event] = [];
      }
      listeners[event].push(callback);
      return mockSocket;
    }),
    off: vi.fn((event: string, callback?: Function) => {
      if (callback && listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      } else {
        delete listeners[event];
      }
      return mockSocket;
    }),
    emit: vi.fn((event: string, ...args: unknown[]) => {
      // Optionally trigger listeners for testing
      if (listeners[event]) {
        listeners[event].forEach(cb => cb(...args));
      }
      return mockSocket;
    }),
    disconnect: vi.fn(() => mockSocket),
    connect: vi.fn(() => mockSocket),
    once: vi.fn((event: string, callback: Function) => {
      mockSocket.on(event, callback);
      return mockSocket;
    }),
    // Helper to trigger events from tests
    __triggerEvent: (event: string, ...args: unknown[]) => {
      if (listeners[event]) {
        listeners[event].forEach(cb => cb(...args));
      }
    },
  };

  return mockSocket;
}

/**
 * Export all from testing library for convenience
 */
export * from '@testing-library/react';
export { default as userEvent } from '@testing-library/user-event';

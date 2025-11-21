/**
 * Common React Hooks for Reusable Patterns
 * Sprint 10: Code Quality - Custom hooks to reduce duplication
 *
 * These hooks encapsulate common patterns found throughout the frontend:
 * - Debounced state updates
 * - Local storage persistence
 * - Socket event handling
 * - Modal state management
 * - Form validation
 * - Async data loading
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { Socket } from 'socket.io-client';
import logger from '../utils/logger';

/**
 * Debounced value hook - delays state updates
 * Useful for search inputs and real-time validation
 */
export function useDebounce<T>(value: T, delay: number = 500): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(timer);
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Local storage hook with automatic JSON serialization
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // Get initial value from localStorage or use provided initial value
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      return item ? JSON.parse(item) : initialValue;
    } catch (error) {
      logger.error('Error loading localStorage key', error, { key });
      return initialValue;
    }
  });

  // Setter function that saves to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        setStoredValue(prevValue => {
          const valueToStore = value instanceof Function ? value(prevValue) : value;
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
          return valueToStore;
        });
      } catch (error) {
        logger.error('Error saving to localStorage key', error, { key });
      }
    },
    [key]
  );

  // Clear function
  const clearValue = useCallback(() => {
    try {
      window.localStorage.removeItem(key);
      setStoredValue(initialValue);
    } catch (error) {
      logger.error('Error clearing localStorage key', error, { key });
    }
  }, [key, initialValue]);

  return [storedValue, setValue, clearValue];
}

/**
 * Socket event listener hook with automatic cleanup
 */
export function useSocketListener<T = unknown>(
  socket: Socket | null,
  eventName: string,
  handler: (data: T) => void,
  dependencies: React.DependencyList = []
): void {
  useEffect(() => {
    if (!socket) return;

    const eventHandler = (data: T) => handler(data);
    socket.on(eventName, eventHandler);

    return () => {
      socket.off(eventName, eventHandler);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [socket, eventName, ...dependencies]);
}

/**
 * Modal state management hook
 */
export function useModal(initialState: boolean = false): {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
  setIsOpen: (value: boolean) => void;
} {
  const [isOpen, setIsOpen] = useState(initialState);

  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen(prev => !prev), []);

  return { isOpen, open, close, toggle, setIsOpen };
}

/**
 * Form field state management with validation
 */
export function useFormField<T>(
  initialValue: T,
  validator?: (value: T) => string | null
): {
  value: T;
  error: string | null;
  setValue: (value: T) => void;
  setError: (error: string | null) => void;
  validate: () => boolean;
  reset: () => void;
} {
  const [value, setValue] = useState<T>(initialValue);
  const [error, setError] = useState<string | null>(null);

  const validate = useCallback((): boolean => {
    if (validator) {
      const validationError = validator(value);
      setError(validationError);
      return validationError === null;
    }
    return true;
  }, [value, validator]);

  const reset = useCallback(() => {
    setValue(initialValue);
    setError(null);
  }, [initialValue]);

  return { value, error, setValue, setError, validate, reset };
}

/**
 * Async data loading hook
 */
export function useAsync<T>(
  asyncFunction: () => Promise<T>,
  dependencies: React.DependencyList = []
): {
  loading: boolean;
  error: Error | null;
  data: T | null;
  refetch: () => void;
} {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<T | null>(null);
  const mountedRef = useRef(true);

  const execute = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await asyncFunction();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err : new Error('An error occurred'));
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, [asyncFunction]);

  useEffect(() => {
    execute();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, dependencies);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return { loading, error, data, refetch: execute };
}

/**
 * Previous value hook - stores the previous value of a variable
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  }, [value]);

  return ref.current;
}

/**
 * Click outside detection hook
 */
export function useClickOutside(
  ref: React.RefObject<HTMLElement>,
  handler: () => void
): void {
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [ref, handler]);
}

/**
 * Window resize hook
 */
export function useWindowSize(): {
  width: number;
  height: number;
  isMobile: boolean;
  isTablet: boolean;
  isDesktop: boolean;
} {
  const [windowSize, setWindowSize] = useState({
    width: window.innerWidth,
    height: window.innerHeight,
  });

  useEffect(() => {
    const handleResize = () => {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return {
    ...windowSize,
    isMobile: windowSize.width < 640,
    isTablet: windowSize.width >= 640 && windowSize.width < 1024,
    isDesktop: windowSize.width >= 1024,
  };
}

/**
 * Interval hook with automatic cleanup
 */
export function useInterval(callback: () => void, delay: number | null): void {
  const savedCallback = useRef(callback);

  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  useEffect(() => {
    if (delay === null) return;

    const tick = () => savedCallback.current();
    const id = setInterval(tick, delay);
    return () => clearInterval(id);
  }, [delay]);
}

/**
 * Countdown timer hook
 */
export function useCountdown(
  initialTime: number,
  onComplete?: () => void
): {
  timeLeft: number;
  isActive: boolean;
  start: () => void;
  pause: () => void;
  reset: () => void;
} {
  const [timeLeft, setTimeLeft] = useState(initialTime);
  const [isActive, setIsActive] = useState(false);

  useEffect(() => {
    if (!isActive || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          setIsActive(false);
          onComplete?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isActive, timeLeft, onComplete]);

  const start = useCallback(() => setIsActive(true), []);
  const pause = useCallback(() => setIsActive(false), []);
  const reset = useCallback(() => {
    setTimeLeft(initialTime);
    setIsActive(false);
  }, [initialTime]);

  return { timeLeft, isActive, start, pause, reset };
}

/**
 * Toggle state hook
 */
export function useToggle(
  initialValue: boolean = false
): [boolean, () => void, (value: boolean) => void] {
  const [value, setValue] = useState(initialValue);
  const toggle = useCallback(() => setValue(prev => !prev), []);

  return [value, toggle, setValue];
}

/**
 * Copy to clipboard hook
 */
export function useCopyToClipboard(): {
  copiedText: string | null;
  copy: (text: string) => Promise<void>;
} {
  const [copiedText, setCopiedText] = useState<string | null>(null);

  const copy = useCallback(async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedText(text);
      // Clear copied text after 2 seconds
      setTimeout(() => setCopiedText(null), 2000);
    } catch (error) {
      logger.error('Failed to copy text:', error);
      throw error;
    }
  }, []);

  return { copiedText, copy };
}

// Type for experimental Network Information API
interface NetworkInformation extends EventTarget {
  effectiveType?: string;
  downlink?: number;
  addEventListener(type: 'change', listener: () => void): void;
  removeEventListener(type: 'change', listener: () => void): void;
}

interface NavigatorWithConnection extends Navigator {
  connection?: NetworkInformation;
  mozConnection?: NetworkInformation;
  webkitConnection?: NetworkInformation;
}

/**
 * Network status hook
 */
export function useNetworkStatus(): {
  isOnline: boolean;
  effectiveType: string | null;
  downlink: number | null;
} {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [networkInfo, setNetworkInfo] = useState<{
    effectiveType: string | null;
    downlink: number | null;
  }>({
    effectiveType: null,
    downlink: null,
  });

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Get network information if available
    const nav = navigator as NavigatorWithConnection;
    const connection = nav.connection || nav.mozConnection || nav.webkitConnection;

    if (connection) {
      const updateNetworkInfo = () => {
        setNetworkInfo({
          effectiveType: connection.effectiveType || null,
          downlink: connection.downlink || null,
        });
      };

      updateNetworkInfo();
      connection.addEventListener('change', updateNetworkInfo);

      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection.removeEventListener('change', updateNetworkInfo);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    ...networkInfo,
  };
}
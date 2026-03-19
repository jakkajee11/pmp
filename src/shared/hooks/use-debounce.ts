/**
 * useDebounce Hook
 *
 * Debounces a value with configurable delay using lodash.debounce pattern.
 * Useful for search inputs, auto-save, and other rate-limited operations.
 */

"use client";

import { useState, useEffect, useCallback, useRef } from "react";

/**
 * Debounce options
 */
interface DebounceOptions {
  delay?: number;
  leading?: boolean;
  trailing?: boolean;
}

/**
 * Debounce a value with specified delay
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Debounce a callback function
 */
export function useDebouncedCallback<T extends (...args: unknown[]) => unknown>(
  callback: T,
  options: DebounceOptions = {}
): (...args: Parameters<T>) => void {
  const { delay = 300, leading = false, trailing = true } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const leadingRef = useRef(false);

  // Update callback ref on each render
  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      // Leading edge call
      if (leading && !leadingRef.current) {
        leadingRef.current = true;
        callbackRef.current(...args);
      }

      // Clear existing timeout
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      // Set new timeout for trailing edge
      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          leadingRef.current = false;
          callbackRef.current(...args);
        }, delay);
      }
    },
    [delay, leading, trailing]
  );

  return debouncedCallback;
}

/**
 * Cancel any pending debounced execution
 */
export function useDebouncedCallbackWithCancel<
  T extends (...args: unknown[]) => unknown
>(
  callback: T,
  options: DebounceOptions = {}
): {
  debouncedCallback: (...args: Parameters<T>) => void;
  cancel: () => void;
  flush: () => void;
} {
  const { delay = 300, leading = false, trailing = true } = options;

  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const callbackRef = useRef(callback);
  const argsRef = useRef<Parameters<T> | null>(null);
  const leadingRef = useRef(false);

  useEffect(() => {
    callbackRef.current = callback;
  }, [callback]);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  const debouncedCallback = useCallback(
    (...args: Parameters<T>) => {
      argsRef.current = args;

      if (leading && !leadingRef.current) {
        leadingRef.current = true;
        callbackRef.current(...args);
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }

      if (trailing) {
        timeoutRef.current = setTimeout(() => {
          leadingRef.current = false;
          if (argsRef.current) {
            callbackRef.current(...argsRef.current);
          }
        }, delay);
      }
    },
    [delay, leading, trailing]
  );

  const cancel = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    leadingRef.current = false;
  }, []);

  const flush = useCallback(() => {
    cancel();
    if (argsRef.current) {
      callbackRef.current(...argsRef.current);
    }
  }, [cancel]);

  return { debouncedCallback, cancel, flush };
}

export default useDebounce;

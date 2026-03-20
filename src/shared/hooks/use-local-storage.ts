/**
 * useLocalStorage Hook
 *
 * Provides persistent storage for offline draft support.
 * Syncs with localStorage and handles SSR safety.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

/**
 * Local storage hook with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  // State to store our value
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize from localStorage on mount (client-side only)
  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      const item = window.localStorage.getItem(key);
      if (item) {
        setStoredValue(JSON.parse(item));
      }
    } catch (error) {
      console.warn(`Error reading localStorage key "${key}":`, error);
    }

    setIsInitialized(true);
  }, [key]);

  // Return a wrapped version of useState's setter function that
  // persists the new value to localStorage
  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        // Allow value to be a function so we have same API as useState
        const valueToStore =
          value instanceof Function ? value(storedValue) : value;

        // Save state
        setStoredValue(valueToStore);

        // Save to local storage
        if (typeof window !== "undefined") {
          window.localStorage.setItem(key, JSON.stringify(valueToStore));
        }
      } catch (error) {
        console.warn(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  // Remove item from localStorage
  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      if (typeof window !== "undefined") {
        window.localStorage.removeItem(key);
      }
    } catch (error) {
      console.warn(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Hook for managing draft content with auto-save
 */
export function useDraft<T extends object>(
  draftKey: string,
  initialContent: T,
  options: {
    autoSaveDelay?: number;
    onAutoSave?: (content: T) => void;
  } = {}
): {
  content: T;
  setContent: (content: T | ((prev: T) => T)) => void;
  clearDraft: () => void;
  hasDraft: boolean;
  isDraftLoaded: boolean;
} {
  const { autoSaveDelay = 30000, onAutoSave } = options;

  const [content, setContent, clearDraft] = useLocalStorage<T>(
    `draft_${draftKey}`,
    initialContent
  );
  const [isDraftLoaded, setIsDraftLoaded] = useState(false);

  // Check if there's a saved draft
  const hasDraft =
    isDraftLoaded && JSON.stringify(content) !== JSON.stringify(initialContent);

  // Mark as loaded after initial mount
  useEffect(() => {
    setIsDraftLoaded(true);
  }, []);

  // Auto-save callback
  useEffect(() => {
    if (!onAutoSave || !isDraftLoaded) {
      return;
    }

    const timer = setTimeout(() => {
      if (hasDraft) {
        onAutoSave(content);
      }
    }, autoSaveDelay);

    return () => {
      clearTimeout(timer);
    };
  }, [content, hasDraft, isDraftLoaded, autoSaveDelay, onAutoSave]);

  return {
    content,
    setContent,
    clearDraft,
    hasDraft,
    isDraftLoaded,
  };
}

/**
 * Hook for storing evaluation drafts
 */
export function useEvaluationDraft(
  evaluationId: string,
  initialData: {
    ratings: Record<string, number>;
    comments: Record<string, string>;
  }
) {
  return useDraft(`evaluation_${evaluationId}`, initialData, {
    autoSaveDelay: 30000, // 30 seconds as per spec
  });
}

export default useLocalStorage;

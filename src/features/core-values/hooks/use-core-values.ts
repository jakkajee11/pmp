'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  coreValueApi,
  type CoreValue,
  type CreateCoreValueInput,
  type UpdateCoreValueInput,
  type CoreValueListQuery,
  type CoreValueListResponse,
} from '../api/handlers';

interface UseCoreValuesOptions {
  initialQuery?: CoreValueListQuery;
  autoFetch?: boolean;
}

interface UseCoreValuesReturn {
  coreValues: CoreValue[];
  isLoading: boolean;
  error: string | null;
  pagination: CoreValueListResponse['pagination'] | null;
  fetchCoreValues: (query?: CoreValueListQuery) => Promise<void>;
  createCoreValue: (data: CreateCoreValueInput) => Promise<CoreValue>;
  updateCoreValue: (id: string, data: UpdateCoreValueInput) => Promise<CoreValue>;
  deleteCoreValue: (id: string) => Promise<void>;
  toggleActive: (id: string, isActive: boolean) => Promise<void>;
  getActiveCoreValues: () => Promise<CoreValue[]>;
}

export function useCoreValues(options: UseCoreValuesOptions = {}): UseCoreValuesReturn {
  const { initialQuery, autoFetch = true } = options;

  const [coreValues, setCoreValues] = useState<CoreValue[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pagination, setPagination] = useState<CoreValueListResponse['pagination'] | null>(null);

  const fetchCoreValues = useCallback(async (query?: CoreValueListQuery) => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await coreValueApi.list(query ?? initialQuery);
      setCoreValues(response.data);
      setPagination(response.pagination);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch core values');
    } finally {
      setIsLoading(false);
    }
  }, [initialQuery]);

  const createCoreValue = useCallback(async (data: CreateCoreValueInput): Promise<CoreValue> => {
    setIsLoading(true);
    setError(null);
    try {
      const newCoreValue = await coreValueApi.create(data);
      setCoreValues((prev) => [...prev, newCoreValue]);
      return newCoreValue;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create core value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const updateCoreValue = useCallback(async (
    id: string,
    data: UpdateCoreValueInput
  ): Promise<CoreValue> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await coreValueApi.update(id, data);
      setCoreValues((prev) =>
        prev.map((cv) => (cv.id === id ? updated : cv))
      );
      return updated;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update core value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const deleteCoreValue = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      await coreValueApi.delete(id);
      setCoreValues((prev) => prev.filter((cv) => cv.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete core value');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const toggleActive = useCallback(async (id: string, isActive: boolean): Promise<void> => {
    setIsLoading(true);
    setError(null);
    try {
      const updated = await coreValueApi.update(id, { isActive });
      setCoreValues((prev) =>
        prev.map((cv) => (cv.id === id ? updated : cv))
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to toggle core value status');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const getActiveCoreValues = useCallback(async (): Promise<CoreValue[]> => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await coreValueApi.list({ isActive: true, limit: 100 });
      return response.data;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch active core values');
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (autoFetch) {
      fetchCoreValues();
    }
  }, [autoFetch, fetchCoreValues]);

  return {
    coreValues,
    isLoading,
    error,
    pagination,
    fetchCoreValues,
    createCoreValue,
    updateCoreValue,
    deleteCoreValue,
    toggleActive,
    getActiveCoreValues,
  };
}

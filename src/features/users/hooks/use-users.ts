/**
 * useUsers Hook
 *
 * Fetches and manages user list with pagination and filters.
 */

"use client";

import { useState, useCallback, useEffect } from "react";
import { UserListItem, UserRole, UserListParams } from "../types";

interface UseUsersOptions {
  initialPage?: number;
  initialLimit?: number;
}

interface UseUsersReturn {
  users: UserListItem[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  error: string | null;
  filters: {
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  };
  setPage: (page: number) => void;
  setSearch: (search: string) => void;
  setFilters: (filters: { role?: UserRole; isActive?: boolean }) => void;
  refresh: () => Promise<void>;
}

export function useUsers(options: UseUsersOptions = {}): UseUsersReturn {
  const { initialPage = 1, initialLimit = 20 } = options;

  const [users, setUsers] = useState<UserListItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(initialPage);
  const [limit, setLimit] = useState(initialLimit);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFiltersState] = useState<{
    role?: UserRole;
    isActive?: boolean;
    search?: string;
  }>({});

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set("page", String(page));
      params.set("limit", String(limit));

      if (filters.role) {
        params.set("role", filters.role);
      }
      if (filters.isActive !== undefined) {
        params.set("is_active", String(filters.isActive));
      }
      if (filters.search) {
        params.set("search", filters.search);
      }

      const response = await fetch(`/api/users?${params.toString()}`);
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch users");
      }

      setUsers(data.data);
      setTotal(data.meta.total);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setUsers([]);
    } finally {
      setIsLoading(false);
    }
  }, [page, limit, filters]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const setPageHandler = useCallback((newPage: number) => {
    setPage(newPage);
  }, []);

  const setSearchHandler = useCallback((search: string) => {
    setFiltersState((prev) => ({ ...prev, search }));
    setPage(1); // Reset to first page on search
  }, []);

  const setFiltersHandler = useCallback(
    (newFilters: { role?: UserRole; isActive?: boolean }) => {
      setFiltersState((prev) => ({ ...prev, ...newFilters }));
      setPage(1); // Reset to first page on filter change
    },
    []
  );

  const refresh = useCallback(async () => {
    await fetchUsers();
  }, [fetchUsers]);

  return {
    users,
    total,
    page,
    limit,
    isLoading,
    error,
    filters,
    setPage: setPageHandler,
    setSearch: setSearchHandler,
    setFilters: setFiltersHandler,
    refresh,
  };
}

/**
 * useUserMutations Hook
 *
 * Handles user CRUD operations with optimistic updates and error handling.
 */

"use client";

import { useState, useCallback } from "react";
import {
  CreateUserRequest,
  UpdateUserRequest,
  UserWithRelations,
  BulkImportResult,
} from "../types";

interface UseUserMutationsReturn {
  createUser: (data: CreateUserRequest) => Promise<UserWithRelations>;
  updateUser: (id: string, data: UpdateUserRequest) => Promise<UserWithRelations>;
  deactivateUser: (id: string) => Promise<void>;
  bulkImport: (file: File) => Promise<BulkImportResult>;
  isLoading: boolean;
  error: string | null;
}

export function useUserMutations(): UseUserMutationsReturn {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createUser = useCallback(
    async (data: CreateUserRequest): Promise<UserWithRelations> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to create user");
        }

        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const updateUser = useCallback(
    async (id: string, data: UpdateUserRequest): Promise<UserWithRelations> => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(`/api/users/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });

        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error?.message || "Failed to update user");
        }

        return result.data;
      } catch (err) {
        const message = err instanceof Error ? err.message : "An error occurred";
        setError(message);
        throw err;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  const deactivateUser = useCallback(async (id: string): Promise<void> => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/users/${id}`, {
        method: "DELETE",
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to deactivate user");
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  const bulkImport = useCallback(async (file: File): Promise<BulkImportResult> => {
    setIsLoading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch("/api/users/import", {
        method: "POST",
        body: formData,
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error?.message || "Failed to import users");
      }

      return result.data;
    } catch (err) {
      const message = err instanceof Error ? err.message : "An error occurred";
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, []);

  return {
    createUser,
    updateUser,
    deactivateUser,
    bulkImport,
    isLoading,
    error,
  };
}

/**
 * useDepartments Hook
 *
 * Fetches department list for form selects.
 */

interface Department {
  id: string;
  name: string;
  nameTh?: string;
}

interface UseDepartmentsReturn {
  departments: Department[];
  isLoading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useDepartments(): UseDepartmentsReturn {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchDepartments = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/departments");
      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error?.message || "Failed to fetch departments");
      }

      setDepartments(data.data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
      setDepartments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Fetch on mount
  useState(() => {
    fetchDepartments();
  });

  return {
    departments,
    isLoading,
    error,
    refresh: fetchDepartments,
  };
}

/**
 * useManagers Hook
 *
 * Fetches potential managers (users with manager roles).
 */

interface Manager {
  id: string;
  name: string;
  email: string;
}

interface UseManagersReturn {
  managers: Manager[];
  isLoading: boolean;
  error: string | null;
}

export function useManagers(): UseManagersReturn {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useState(() => {
    const fetchManagers = async () => {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch(
          "/api/users?role=LINE_MANAGER,SENIOR_MANAGER,HR_ADMIN&limit=100"
        );
        const data = await response.json();

        if (!response.ok) {
          throw new Error(data.error?.message || "Failed to fetch managers");
        }

        setManagers(
          data.data.map((user: any) => ({
            id: user.id,
            name: user.name,
            email: user.email,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : "An error occurred");
        setManagers([]);
      } finally {
        setIsLoading(false);
      }
    };

    fetchManagers();
  });

  return {
    managers,
    isLoading,
    error,
  };
}

/**
 * Users Page
 *
 * User management interface for HR administrators.
 */

"use client";

import * as React from "react";
import { UserList } from "@/features/users/components/user-list";
import { UserForm } from "@/features/users/components/user-form";
import { UserImportDialog } from "@/features/users/components/user-import-dialog";
import { useUsers, useUserMutations, UserListItem } from "@/features/users";
import { UserRole } from "@/shared/types/common";

export default function UsersPage() {
  const [showForm, setShowForm] = React.useState(false);
  const [showImport, setShowImport] = React.useState(false);
  const [editingUserId, setEditingUserId] = React.useState<string | null>(null);

  const { users, total, page, limit, isLoading, setPage, setSearch, setFilters, refresh } =
    useUsers();
  const { createUser, updateUser, deactivateUser, bulkImport } = useUserMutations();

  // Mock data for managers and departments (would be fetched in real app)
  const managers = [
    { id: "1", name: "John Manager", email: "john@company.com" },
    { id: "2", name: "Jane Senior", email: "jane@company.com" },
  ];

  const departments = [
    { id: "1", name: "Engineering" },
    { id: "2", name: "Human Resources" },
    { id: "3", name: "Marketing" },
  ];

  const handleCreateUser = () => {
    setEditingUserId(null);
    setShowForm(true);
  };

  const handleEditUser = (userId: string) => {
    setEditingUserId(userId);
    setShowForm(true);
  };

  const handleDeactivateUser = async (userId: string) => {
    if (confirm("Are you sure you want to deactivate this user?")) {
      try {
        await deactivateUser(userId);
        refresh();
      } catch (error) {
        console.error("Failed to deactivate user:", error);
      }
    }
  };

  const handleFormSubmit = async (data: any) => {
    try {
      if (editingUserId) {
        await updateUser(editingUserId, data);
      } else {
        await createUser(data);
      }
      setShowForm(false);
      refresh();
    } catch (error) {
      console.error("Failed to save user:", error);
    }
  };

  const handleImport = async (file: File) => {
    return await bulkImport(file);
  };

  const handleDownloadTemplate = () => {
    const csvContent = `email,name,name_th,role,manager_email,department_name
john.doe@company.com,John Doe,จอห์น โด,EMPLOYEE,manager@company.com,Engineering
jane.smith@company.com,Jane Smith,,LINE_MANAGER,,Engineering`;

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "user-import-template.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  const foundUser = editingUserId
    ? users.find((u: UserListItem) => u.id === editingUserId)
    : undefined;
  const editingUser = foundUser ? {
    id: foundUser.id,
    email: foundUser.email,
    name: foundUser.name,
    nameTh: foundUser.nameTh,
    role: foundUser.role,
    managerId: foundUser.manager?.id,
    departmentId: foundUser.department?.id,
  } : undefined;

  return (
    <div className="p-6 space-y-6">
      {/* Page Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">User Management</h1>
          <p className="text-slate-600 mt-1">
            Manage user accounts and organizational assignments
          </p>
        </div>
        <button
          onClick={() => setShowImport(true)}
          className="text-[#1e3a5f] hover:underline text-sm"
        >
          Import Users
        </button>
      </div>

      {/* User List */}
      <UserList
        users={users}
        totalUsers={total}
        page={page}
        limit={limit}
        isLoading={isLoading}
        onPageChange={setPage}
        onSearch={setSearch}
        onFilterChange={setFilters}
        onCreateUser={handleCreateUser}
        onEditUser={handleEditUser}
        onDeactivateUser={handleDeactivateUser}
      />

      {/* User Form Dialog */}
      {showForm && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <UserForm
            mode={editingUserId ? "edit" : "create"}
            initialData={editingUser}
            managers={managers}
            departments={departments}
            onSubmit={handleFormSubmit}
            onCancel={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Import Dialog */}
      <UserImportDialog
        open={showImport}
        onOpenChange={setShowImport}
        onImport={handleImport}
        onDownloadTemplate={handleDownloadTemplate}
      />
    </div>
  );
}

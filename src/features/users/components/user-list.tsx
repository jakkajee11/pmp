/**
 * User List Component
 *
 * Data table displaying users with search, filter, and pagination.
 * Uses Professional Corporate design with navy blue accents.
 */

"use client";

import * as React from "react";
import { Search, Filter, ChevronLeft, ChevronRight, UserPlus } from "lucide-react";
import { Input } from "@/shared/components/ui/input";
import { Button } from "@/shared/components/ui/button";
import { Badge } from "@/shared/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/shared/components/ui/select";
import { Separator } from "@/shared/components/ui/separator";
import { RoleBadge } from "./role-badge";
import { UserListItem, UserRole, USER_ROLES, ROLE_LABELS } from "../types";
import { cn } from "@/shared/lib/utils";

interface UserListProps {
  users: UserListItem[];
  totalUsers: number;
  page: number;
  limit: number;
  isLoading?: boolean;
  onPageChange: (page: number) => void;
  onSearch: (search: string) => void;
  onFilterChange: (filters: { role?: UserRole; isActive?: boolean }) => void;
  onCreateUser: () => void;
  onEditUser: (userId: string) => void;
  onDeactivateUser: (userId: string) => void;
}

export function UserList({
  users,
  totalUsers,
  page,
  limit,
  isLoading = false,
  onPageChange,
  onSearch,
  onFilterChange,
  onCreateUser,
  onEditUser,
  onDeactivateUser,
}: UserListProps) {
  const [searchValue, setSearchValue] = React.useState("");
  const [roleFilter, setRoleFilter] = React.useState<string>("all");
  const [statusFilter, setStatusFilter] = React.useState<string>("all");

  const totalPages = Math.ceil(totalUsers / limit);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(searchValue);
  };

  const handleRoleFilterChange = (value: string) => {
    setRoleFilter(value);
    onFilterChange({
      role: value === "all" ? undefined : (value as UserRole),
      isActive: statusFilter === "all" ? undefined : statusFilter === "active",
    });
  };

  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value);
    onFilterChange({
      role: roleFilter === "all" ? undefined : (roleFilter as UserRole),
      isActive: value === "all" ? undefined : value === "active",
    });
  };

  return (
    <Card className="w-full border-slate-200 shadow-sm">
      <CardHeader className="bg-slate-50 border-b border-slate-200">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-slate-900">
            User Management
          </CardTitle>
          <Button
            onClick={onCreateUser}
            className="bg-[#1e3a5f] hover:bg-[#152d4a] text-white"
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add User
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {/* Search and Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          {/* Search */}
          <form onSubmit={handleSearchSubmit} className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                type="search"
                placeholder="Search by name or email..."
                value={searchValue}
                onChange={handleSearchChange}
                className="pl-10 border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]"
              />
            </div>
          </form>

          {/* Role Filter */}
          <Select value={roleFilter} onValueChange={handleRoleFilterChange}>
            <SelectTrigger className="w-full md:w-48 border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
              <SelectValue placeholder="Filter by role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              {USER_ROLES.map((role) => (
                <SelectItem key={role} value={role}>
                  {ROLE_LABELS[role]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Status Filter */}
          <Select value={statusFilter} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full md:w-36 border-slate-300 focus:border-[#1e3a5f] focus:ring-[#1e3a5f]">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Separator className="mb-4 bg-slate-200" />

        {/* Table */}
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-slate-200">
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Name
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Email
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Role
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Department
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Manager
                </th>
                <th className="text-left py-3 px-4 font-medium text-slate-700 text-sm">
                  Status
                </th>
                <th className="text-right py-3 px-4 font-medium text-slate-700 text-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                // Loading skeleton
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b border-slate-100">
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} className="py-3 px-4">
                        <div className="h-4 bg-slate-100 rounded animate-pulse" />
                      </td>
                    ))}
                  </tr>
                ))
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-500">
                    No users found. Try adjusting your filters.
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user.id}
                    className="border-b border-slate-100 hover:bg-slate-50 transition-colors"
                  >
                    <td className="py-3 px-4">
                      <div className="flex flex-col">
                        <span className="font-medium text-slate-900">{user.name}</span>
                        {user.nameTh && (
                          <span className="text-sm text-slate-500">{user.nameTh}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-600">{user.email}</td>
                    <td className="py-3 px-4">
                      <RoleBadge role={user.role} />
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.department?.name || "-"}
                    </td>
                    <td className="py-3 px-4 text-slate-600">
                      {user.manager?.name || "-"}
                    </td>
                    <td className="py-3 px-4">
                      <Badge
                        variant={user.isActive ? "default" : "secondary"}
                        className={cn(
                          "font-medium",
                          user.isActive
                            ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-100"
                            : "bg-slate-100 text-slate-600 hover:bg-slate-100"
                        )}
                      >
                        {user.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onEditUser(user.id)}
                          className="text-[#1e3a5f] hover:bg-slate-100"
                        >
                          Edit
                        </Button>
                        {user.isActive && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => onDeactivateUser(user.id)}
                            className="text-red-600 hover:bg-red-50"
                          >
                            Deactivate
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-slate-200">
            <p className="text-sm text-slate-600">
              Showing {(page - 1) * limit + 1} to{" "}
              {Math.min(page * limit, totalUsers)} of {totalUsers} users
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page - 1)}
                disabled={page === 1 || isLoading}
                className="border-slate-300"
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-sm text-slate-600">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => onPageChange(page + 1)}
                disabled={page === totalPages || isLoading}
                className="border-slate-300"
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

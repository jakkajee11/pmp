/**
 * Users Feature - Public Exports
 *
 * Exports public API for user management functionality.
 */

// Types
export type {
  User,
  UserWithRelations,
  UserListItem,
  Department,
  DepartmentWithChildren,
  DepartmentTreeNode,
  OrgChartNode,
  OrgChartFilters,
  UserListParams,
  CreateUserRequest,
  UpdateUserRequest,
  BulkImportResult,
  UserCsvRow,
} from "./types";

export {
  USER_ROLES,
  ROLE_LABELS,
  ROLE_LABELS_TH,
  UserRoleSchema,
  CreateUserSchema,
  UpdateUserSchema,
  UserListQuerySchema,
  DepartmentSchema,
  BulkImportRowSchema,
} from "./types";

// API Handlers
export {
  getUsersHandler,
  getUserHandler,
  createUserHandler,
  updateUserHandler,
  deleteUserHandler,
  bulkImportUsersHandler,
  updateUserLanguageHandler,
  getDepartmentsHandler,
  getDepartmentTreeHandler,
  createDepartmentHandler,
  updateDepartmentHandler,
  deleteDepartmentHandler,
} from "./api/handlers";

// Components
export { RoleBadge, RoleBadgeCompact, getRoleBadgeColor } from "./components/role-badge";
export { UserForm } from "./components/user-form";
export { UserList } from "./components/user-list";
export { UserImportDialog } from "./components/user-import-dialog";

// Hooks
export { useUsers } from "./hooks/use-users";
export {
  useUserMutations,
  useDepartments,
  useManagers,
} from "./hooks/use-user-mutations";

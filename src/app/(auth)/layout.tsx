/**
 * Auth Layout
 *
 * Layout for authenticated routes with navigation sidebar.
 * Features: Role-based navigation, mobile responsive, language selector.
 *
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  Users,
  Calendar,
  Target,
  FileText,
  BarChart3,
  History,
  Settings,
  Bell,
  Building2,
  Menu,
  X,
  LogOut,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { cn } from "../../shared/lib/utils";
import { Button } from "../../shared/components/ui/button";
import { Separator } from "../../shared/components/ui/separator";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../../shared/components/ui/tooltip";
import { useSession, useHasAnyRole } from "../../features/auth/hooks/use-session";
import { LanguageSelector } from "../../features/settings/components/language-selector";

type NavItem = {
  href: string;
  label: string;
  labelTh: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: string[]; // If undefined, visible to all roles
};

const navItems: NavItem[] = [
  { href: "/", label: "Dashboard", labelTh: "หน้าหลัก", icon: LayoutDashboard },
  { href: "/users", label: "Users", labelTh: "ผู้ใช้งาน", icon: Users, roles: ["HR_ADMIN", "HR_STAFF", "SUPER_ADMIN"] },
  { href: "/org-chart", label: "Org Chart", labelTh: "แผนผลองค์กร", icon: Building2, roles: ["HR_ADMIN", "HR_STAFF", "SUPER_ADMIN"] },
  { href: "/cycles", label: "Cycles", labelTh: "รอบการประเมิน", icon: Calendar, roles: ["HR_ADMIN", "HR_STAFF", "SUPER_ADMIN"] },
  { href: "/objectives", label: "Objectives", labelTh: "เป้าหมาย", icon: Target, roles: ["LINE_MANAGER", "SENIOR_MANAGER", "HR_ADMIN", "HR_STAFF", "SUPER_ADMIN"] },
  { href: "/evaluations", label: "Evaluations", labelTh: "การประเมิน", icon: FileText },
  { href: "/reports", label: "Reports", labelTh: "รายงาน", icon: BarChart3, roles: ["HR_ADMIN", "HR_STAFF", "SUPER_ADMIN", "SENIOR_MANAGER"] },
  { href: "/audit-logs", label: "Audit Logs", labelTh: "ประวัติการใช้งาน", icon: History, roles: ["HR_ADMIN", "SUPER_ADMIN"] },
  { href: "/settings", label: "Settings", labelTh: "ตั้งค่า", icon: Settings },
];

const roleLabels: Record<string, string> = {
  SUPER_ADMIN: "Super Admin",
  HR_ADMIN: "HR Admin",
  HR_STAFF: "HR Staff",
  SENIOR_MANAGER: "Senior Manager",
  LINE_MANAGER: "Line Manager",
  EMPLOYEE: "Employee",
};

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const { user, isAuthenticated } = useSession();
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(false);
  const [notificationsCount] = React.useState(3); // TODO: Connect to notifications

  // Filter nav items based on user role
  const visibleNavItems = React.useMemo(() => {
    if (!user) return navItems.filter((item) => !item.roles);
    return navItems.filter((item) => {
      if (!item.roles) return true;
      return item.roles.includes(user.role);
    });
  }, [user]);

  // Close mobile sidebar on route change
  React.useEffect(() => {
    setSidebarOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    signOut({ callbackUrl: "/login" });
  };

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-slate-50">
        {/* Mobile Header */}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4">
          <button
            onClick={() => setSidebarOpen(true)}
            className="p-2 rounded-lg hover:bg-slate-100"
            aria-label="Open menu"
          >
            <Menu className="h-6 w-6 text-slate-700" />
          </button>
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="text-white font-bold text-sm">PMP</span>
            </div>
            <span className="font-semibold text-slate-900">Performance Portal</span>
          </Link>
          <div className="flex items-center gap-2">
            <LanguageSelector compact />
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              {notificationsCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                  {notificationsCount}
                </span>
              )}
            </Button>
          </div>
        </header>

        {/* Mobile Overlay */}
        {sidebarOpen && (
          <div
            className="lg:hidden fixed inset-0 z-40 bg-black/50"
            onClick={() => setSidebarOpen(false)}
          />
        )}

        {/* Sidebar */}
        <aside
          className={cn(
            "fixed left-0 top-0 z-40 h-screen bg-white border-r border-slate-200 transition-all duration-300",
            "lg:translate-x-0",
            sidebarOpen ? "translate-x-0 w-64" : "-translate-x-full lg:translate-x-0",
            sidebarCollapsed ? "lg:w-20" : "lg:w-64"
          )}
        >
          {/* Logo */}
          <div className="flex h-16 items-center border-b border-slate-200 px-4 lg:px-6">
            <Link href="/" className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                <span className="text-white font-bold text-sm">PMP</span>
              </div>
              {!sidebarCollapsed && (
                <span className="font-semibold text-slate-900">Performance Portal</span>
              )}
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden ml-auto p-2 rounded-lg hover:bg-slate-100"
              aria-label="Close menu"
            >
              <X className="h-5 w-5 text-slate-700" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4 space-y-1">
            {visibleNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = item.icon;

              const linkContent = (
                <Link
                  key={item.href}
                  href={item.href as any}
                  className={cn(
                    "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                    isActive
                      ? "bg-[#1e3a5f] text-white"
                      : "text-slate-700 hover:bg-slate-100",
                    sidebarCollapsed && "lg:justify-center lg:px-2"
                  )}
                >
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  {!sidebarCollapsed && <span>{item.label}</span>}
                </Link>
              );

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.href}>
                    <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p>{item.label}</p>
                    </TooltipContent>
                  </Tooltip>
                );
              }

              return linkContent;
            })}
          </nav>

          {/* Collapse Toggle (Desktop) */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden lg:flex items-center justify-center w-full py-2 border-t border-slate-200 text-slate-500 hover:text-slate-700 hover:bg-slate-50 transition-colors"
            aria-label={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? (
              <ChevronRight className="h-5 w-5" />
            ) : (
              <ChevronLeft className="h-5 w-5" />
            )}
          </button>

          {/* Footer */}
          <div className="border-t border-slate-200 p-4">
            {!sidebarCollapsed && (
              <>
                <Separator className="mb-4" />
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <div className="h-8 w-8 rounded-full bg-[#1e3a5f] flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-sm font-medium">
                        {user?.name?.split(" ").map((n) => n[0]).join("").slice(0, 2) || "??"}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-slate-900 truncate">
                        {user?.name || "User"}
                      </p>
                      <p className="text-xs text-slate-500 truncate">
                        {user?.role ? roleLabels[user.role] || user.role : ""}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <LanguageSelector compact />
                  <div className="flex items-center gap-1">
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {notificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[8px] font-medium text-white flex items-center justify-center">
                          {notificationsCount}
                        </span>
                      )}
                    </Button>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={handleLogout}
                          className="text-slate-500 hover:text-red-600"
                        >
                          <LogOut className="h-4 w-4" />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>Logout</p>
                      </TooltipContent>
                    </Tooltip>
                  </div>
                </div>
              </>
            )}
            {sidebarCollapsed && (
              <div className="flex flex-col items-center gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="icon" className="relative">
                      <Bell className="h-4 w-4" />
                      {notificationsCount > 0 && (
                        <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-red-500 text-[8px] font-medium text-white flex items-center justify-center">
                          {notificationsCount}
                        </span>
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Notifications</p>
                  </TooltipContent>
                </Tooltip>
                <LanguageSelector compact />
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="text-slate-500 hover:text-red-600"
                    >
                      <LogOut className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p>Logout</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main
          className={cn(
            "min-h-screen pt-16 lg:pt-0 transition-all duration-300",
            sidebarCollapsed ? "lg:ml-20" : "lg:ml-64"
          )}
        >
          <div className="p-6">{children}</div>
        </main>
      </div>
    </TooltipProvider>
  );
}

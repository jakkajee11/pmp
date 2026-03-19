/**
 * Auth Layout
 *
 * Layout for authenticated routes with navigation sidebar.
 */

"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
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
} from "lucide-react";
import { cn } from "../../shared/lib/utils";
import { Button } from "../../shared/components/ui/button";
import { Separator } from "../../shared/components/ui/separator";

const navItems: Array<{
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
}> = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/users", label: "Users", icon: Users },
  { href: "/org-chart", label: "Org Chart", icon: Building2 },
  { href: "/cycles", label: "Cycles", icon: Calendar },
  { href: "/objectives", label: "Objectives", icon: Target },
  { href: "/evaluations", label: "Evaluations", icon: FileText },
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/audit-logs", label: "Audit Logs", icon: History },
  { href: "/settings", label: "Settings", icon: Settings },
];

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 z-40 h-screen w-64 border-r border-slate-200 bg-white">
        {/* Logo */}
        <div className="flex h-16 items-center border-b border-slate-200 px-6">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-[#1e3a5f] flex items-center justify-center">
              <span className="text-white font-bold text-sm">PMP</span>
            </div>
            <span className="font-semibold text-slate-900">Performance Portal</span>
          </Link>
        </div>

        {/* Navigation */}
        <nav className="flex-1 space-y-1 p-4">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;

            return (
              <Link
                key={item.href}
                href={item.href as any}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-[#1e3a5f] text-white"
                    : "text-slate-700 hover:bg-slate-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div className="border-t border-slate-200 p-4">
          <Separator className="mb-4" />
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-full bg-slate-200" />
              <div>
                <p className="text-sm font-medium text-slate-900">User Name</p>
                <p className="text-xs text-slate-500">HR Admin</p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="relative">
              <Bell className="h-5 w-5" />
              <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-red-500 text-[10px] font-medium text-white flex items-center justify-center">
                3
              </span>
            </Button>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="ml-64 min-h-screen">
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}

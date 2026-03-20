"use client";

import Link from "next/link";
import { useSession } from "@/features/auth/hooks/use-session";
import { Button } from "@/shared/components/ui/button";
import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Home() {
  const { isAuthenticated, isLoading } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated) {
      router.push("/dashboard");
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-slate-50">
        <div className="animate-pulse">
          <div className="h-12 w-64 bg-slate-200 rounded-lg mb-4"></div>
          <div className="h-6 w-48 bg-slate-200 rounded"></div>
        </div>
      </main>
    );
  }

  if (isAuthenticated) {
    return null; // Will redirect via useEffect
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-slate-50 to-slate-100">
      <div className="max-w-md w-full text-center space-y-8">
        {/* Logo */}
        <div className="flex justify-center">
          <div className="h-16 w-16 rounded-xl bg-[#1e3a5f] flex items-center justify-center">
            <span className="text-white font-bold text-2xl">PMP</span>
          </div>
        </div>

        {/* Title */}
        <div>
          <h1 className="text-3xl font-bold text-slate-900">
            Performance Metrics Portal
          </h1>
          <p className="mt-3 text-slate-600">
            Enterprise performance review and evaluation management system
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-1 gap-3 text-left text-sm">
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
            <div className="h-8 w-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="text-slate-700">Track objectives and key results</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
            <div className="h-8 w-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <span className="text-slate-700">360° feedback and self-assessments</span>
          </div>
          <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-slate-200">
            <div className="h-8 w-8 rounded-lg bg-[#1e3a5f]/10 flex items-center justify-center">
              <svg className="h-4 w-4 text-[#1e3a5f]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <span className="text-slate-700">Comprehensive analytics and reports</span>
          </div>
        </div>

        {/* Login Button */}
        <div className="pt-4">
          <Link href="/dashboard">
            <Button className="w-full h-12 text-base bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
              Sign In
            </Button>
          </Link>
          <p className="mt-3 text-xs text-slate-500">
            Secure authentication via corporate SSO
          </p>
        </div>
      </div>
    </main>
  );
}

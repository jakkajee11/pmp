/**
 * Sign In Page
 *
 * Development mode: Shows mock login form with predefined users
 * Production mode: Shows OIDC SSO login button
 */

"use client";

import * as React from "react";
import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/shared/components/ui/card";

const DEV_USERS = [
  { email: "admin@pmp.local", name: "Super Admin", role: "SUPER_ADMIN" },
  { email: "hr@pmp.local", name: "HR Admin", role: "HR_ADMIN" },
  { email: "manager@pmp.local", name: "Line Manager", role: "LINE_MANAGER" },
  { email: "employee@pmp.local", name: "Employee", role: "EMPLOYEE" },
];

const roleBadgeColors: Record<string, string> = {
  SUPER_ADMIN: "bg-purple-100 text-purple-800",
  HR_ADMIN: "bg-blue-100 text-blue-800",
  HR_STAFF: "bg-cyan-100 text-cyan-800",
  SENIOR_MANAGER: "bg-green-100 text-green-800",
  LINE_MANAGER: "bg-yellow-100 text-yellow-800",
  EMPLOYEE: "bg-gray-100 text-gray-800",
};

function SignInForm() {
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [email, setEmail] = React.useState("admin@pmp.local");
  const [password, setPassword] = React.useState("password");
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(false);
  const isDev = process.env.NODE_ENV === "development";

  const handleCredentialsLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Use redirect: true (default) to let NextAuth handle the redirect
      await signIn("credentials", {
        email,
        password,
        callbackUrl,
      });
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleQuickLogin = async (userEmail: string) => {
    setIsLoading(true);
    setError(null);

    try {
      // Use redirect: true (default) to let NextAuth handle the redirect
      await signIn("credentials", {
        email: userEmail,
        password: "password",
        callbackUrl,
      });
    } catch (err) {
      setError("An error occurred. Please try again.");
      setIsLoading(false);
    }
  };

  const handleOIDCLogin = async () => {
    setIsLoading(true);
    await signIn("oidc", { callbackUrl });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6">
        {/* Logo */}
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-[#1e3a5f]">
            <span className="text-white font-bold text-2xl">PMP</span>
          </div>
          <h1 className="mt-4 text-2xl font-bold text-slate-900">
            Performance Metrics Portal
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Sign in to access your account
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
            {error}
          </div>
        )}

        {isDev ? (
          <>
            {/* Quick Login Buttons for Development */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Quick Login (Dev)</CardTitle>
                <CardDescription>
                  Click a user to instantly sign in
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-2">
                {DEV_USERS.map((user) => (
                  <button
                    key={user.email}
                    onClick={() => handleQuickLogin(user.email)}
                    disabled={isLoading}
                    className="w-full flex items-center justify-between p-3 rounded-lg border border-slate-200 hover:border-[#1e3a5f] hover:bg-slate-50 transition-colors text-left disabled:opacity-50"
                  >
                    <div>
                      <p className="font-medium text-slate-900">{user.name}</p>
                      <p className="text-sm text-slate-500">{user.email}</p>
                    </div>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${roleBadgeColors[user.role]}`}>
                      {user.role.replace("_", " ")}
                    </span>
                  </button>
                ))}
              </CardContent>
            </Card>

            {/* Custom Credentials Form */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Custom Login</CardTitle>
                <CardDescription>
                  Enter credentials manually (all passwords: "password")
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleCredentialsLogin} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="admin@pmp.local"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input
                      id="password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="password"
                      required
                    />
                  </div>
                  <Button
                    type="submit"
                    className="w-full bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Signing in..." : "Sign In"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </>
        ) : (
          /* Production: OIDC SSO Only */
          <Card>
            <CardHeader className="text-center">
              <CardTitle>Corporate SSO</CardTitle>
              <CardDescription>
                Sign in using your corporate credentials
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                onClick={handleOIDCLogin}
                className="w-full bg-[#1e3a5f] hover:bg-[#1e3a5f]/90"
                disabled={isLoading}
              >
                {isLoading ? "Signing in..." : "Sign in with Corporate SSO"}
              </Button>
            </CardContent>
          </Card>
        )}

        <p className="text-center text-xs text-slate-500">
          {isDev ? "Development Mode - Mock Authentication" : "Secure authentication via corporate SSO"}
        </p>
      </div>
    </div>
  );
}

function SignInLoading() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-slate-50 to-slate-100 p-4">
      <div className="w-full max-w-md space-y-6 animate-pulse">
        <div className="text-center">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-slate-200" />
          <div className="mt-4 h-8 w-64 mx-auto bg-slate-200 rounded" />
          <div className="mt-2 h-4 w-48 mx-auto bg-slate-200 rounded" />
        </div>
        <div className="h-64 bg-slate-200 rounded-lg" />
      </div>
    </div>
  );
}

export default function SignInPage() {
  return (
    <Suspense fallback={<SignInLoading />}>
      <SignInForm />
    </Suspense>
  );
}

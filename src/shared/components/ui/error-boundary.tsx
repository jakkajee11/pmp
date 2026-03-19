/**
 * Error Boundary Components
 *
 * Reusable error boundaries for graceful error handling across the application.
 * Professional Corporate style: Navy blue (#1e3a5f), slate gray accents.
 */

"use client";

import * as React from "react";
import { cn } from "../lib/utils";
import { Button } from "./button";
import { AlertTriangle, RefreshCw, Home, Bug } from "lucide-react";

// Error Boundary Class Component
export interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  onReset?: () => void;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
    this.props.onError?.(error, errorInfo);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
    this.props.onReset?.();
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) {
        return this.props.fallback;
      }

      return (
        <ErrorFallback
          error={this.state.error}
          onReset={this.handleReset}
        />
      );
    }

    return this.props.children;
  }
}

// Error Fallback Component
export interface ErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  showDetails?: boolean;
  className?: string;
}

export function ErrorFallback({
  error,
  onReset,
  showDetails = process.env.NODE_ENV === "development",
  className,
}: ErrorFallbackProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[400px] p-8 text-center",
        className
      )}
    >
      <div className="w-16 h-16 rounded-full bg-red-100 flex items-center justify-center mb-4">
        <AlertTriangle className="h-8 w-8 text-red-600" />
      </div>
      <h2 className="text-xl font-semibold text-slate-900 mb-2">
        Something went wrong
      </h2>
      <p className="text-slate-500 max-w-md mb-6">
        An unexpected error occurred. Please try again or contact support if the problem persists.
      </p>

      {showDetails && error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg max-w-lg overflow-auto">
          <div className="flex items-center gap-2 text-red-700 font-medium mb-2">
            <Bug className="h-4 w-4" />
            <span>Error Details</span>
          </div>
          <pre className="text-xs text-red-600 whitespace-pre-wrap">
            {error.message}
            {error.stack && (
              <div className="mt-2 text-red-500">{error.stack}</div>
            )}
          </pre>
        </div>
      )}

      <div className="flex gap-3">
        {onReset && (
          <Button onClick={onReset} variant="outline">
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </Button>
        )}
        <Button onClick={() => (window.location.href = "/")}>
          <Home className="h-4 w-4 mr-2" />
          Go Home
        </Button>
      </div>
    </div>
  );
}

// Page Error Fallback (full page)
export interface PageErrorFallbackProps {
  error: Error | null;
  onReset?: () => void;
  title?: string;
  message?: string;
}

export function PageErrorFallback({
  error,
  onReset,
  title = "Page Error",
  message = "This page encountered an error. Please try refreshing or navigate to a different page.",
}: PageErrorFallbackProps) {
  return (
    <div className="min-h-[60vh] flex items-center justify-center p-6">
      <div className="max-w-lg text-center">
        <div className="w-20 h-20 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-6">
          <AlertTriangle className="h-10 w-10 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 mb-2">{title}</h1>
        <p className="text-slate-500 mb-8">{message}</p>
        <div className="flex justify-center gap-4">
          {onReset && (
            <Button onClick={onReset} variant="default" className="bg-[#1e3a5f] hover:bg-[#1e3a5f]/90">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh Page
            </Button>
          )}
          <Button variant="outline" onClick={() => (window.location.href = "/")}>
            <Home className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    </div>
  );
}

// Inline Error (for form fields, cards, etc.)
export interface InlineErrorProps {
  message: string;
  onRetry?: () => void;
  className?: string;
}

export function InlineError({ message, onRetry, className }: InlineErrorProps) {
  return (
    <div
      className={cn(
        "flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-lg",
        className
      )}
    >
      <AlertTriangle className="h-5 w-5 text-red-600 flex-shrink-0" />
      <p className="text-sm text-red-700 flex-1">{message}</p>
      {onRetry && (
        <Button
          size="sm"
          variant="ghost"
          onClick={onRetry}
          className="text-red-600 hover:text-red-700 hover:bg-red-100"
        >
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}

// API Error Display
export interface APIErrorDisplayProps {
  error: {
    message?: string;
    code?: string;
    status?: number;
  };
  onRetry?: () => void;
  className?: string;
}

export function APIErrorDisplay({ error, onRetry, className }: APIErrorDisplayProps) {
  const getMessage = () => {
    switch (error.status) {
      case 401:
        return "You are not authorized to access this resource. Please log in again.";
      case 403:
        return "You don't have permission to perform this action.";
      case 404:
        return "The requested resource was not found.";
      case 500:
        return "A server error occurred. Please try again later.";
      default:
        return error.message || "An unexpected error occurred.";
    }
  };

  return (
    <div className={cn("text-center py-8", className)}>
      <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center mx-auto mb-4">
        <AlertTriangle className="h-6 w-6 text-red-600" />
      </div>
      <h3 className="text-lg font-medium text-slate-900 mb-1">Error</h3>
      <p className="text-sm text-slate-500 mb-4">{getMessage()}</p>
      {error.code && (
        <p className="text-xs text-slate-400 mb-4">Error code: {error.code}</p>
      )}
      {onRetry && (
        <Button variant="outline" size="sm" onClick={onRetry}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      )}
    </div>
  );
}

// Async Error Boundary Wrapper
export interface AsyncBoundaryProps {
  children: React.ReactNode;
  pendingFallback?: React.ReactNode;
  rejectedFallback?: React.ReactNode;
  onRetry?: () => void;
}

export function AsyncBoundary({
  children,
  pendingFallback = <PageSkeleton />,
  rejectedFallback,
  onRetry,
}: AsyncBoundaryProps) {
  return (
    <ErrorBoundary
      fallback={rejectedFallback || <PageErrorFallback error={null} onReset={onRetry} />}
      onReset={onRetry}
    >
      <React.Suspense fallback={pendingFallback}>{children}</React.Suspense>
    </ErrorBoundary>
  );
}

// Feature-specific error boundaries
export function DashboardErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <PageErrorFallback
          error={null}
          title="Dashboard Error"
          message="Unable to load the dashboard. Please try refreshing the page."
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function EvaluationErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <PageErrorFallback
          error={null}
          title="Evaluation Error"
          message="Unable to load your evaluation. Your progress has been auto-saved."
        />
      }
    >
      {children}
    </ErrorBoundary>
  );
}

export function FormErrorBoundary({ children }: { children: React.ReactNode }) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-6 text-center">
          <AlertTriangle className="h-8 w-8 text-red-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-slate-900 mb-2">Form Error</h3>
          <p className="text-sm text-slate-500 mb-4">
            There was a problem with this form. Please refresh and try again.
          </p>
          <Button variant="outline" onClick={() => window.location.reload()}>
            Refresh Form
          </Button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  );
}

// Re-export PageSkeleton for convenience
export { PageSkeleton } from "./loading-states";

"use client";

import { useEffect } from "react";
import { motion } from "framer-motion";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

/**
 * Global error page for unhandled errors
 */
export default function Error({ error, reset }: ErrorProps): React.ReactNode {
  useEffect(() => {
    console.error("Global error:", error);
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="glass-card max-w-md p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-destructive/10">
          <AlertTriangle className="h-10 w-10 text-destructive" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold">Something went wrong</h1>
        <p className="mb-6 text-muted-foreground">
          An unexpected error occurred. Don&apos;t worry, your data is safe.
        </p>

        {error.message && (
          <div className="mb-6 rounded-xl bg-muted/50 p-3 text-left">
            <p className="font-mono text-xs text-muted-foreground">
              {error.message}
            </p>
          </div>
        )}

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={reset}
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent/90"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-5 py-2.5 font-medium transition-colors hover:bg-muted/80"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

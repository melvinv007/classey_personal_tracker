"use client";

import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { Lock, Loader2, AlertCircle, Sparkles } from "lucide-react";
import { DynamicBackground } from "@/components/backgrounds";

/**
 * Login form component (uses useSearchParams).
 */
function LoginForm(): React.ReactNode {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") || "/";

  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [shake, setShake] = useState(false);

  // Check if already authenticated
  useEffect(() => {
    const checkAuth = async (): Promise<void> => {
      try {
        const res = await fetch("/api/auth");
        const data = await res.json();
        if (data.authenticated) {
          router.replace(redirectTo);
        }
      } catch {
        // Not authenticated, stay on login
      }
    };
    checkAuth();
  }, [router, redirectTo]);

  const handleSubmit = async (e: React.FormEvent): Promise<void> => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const res = await fetch("/api/auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });

      const data = await res.json();

      if (data.success) {
        router.replace(redirectTo);
      } else {
        setError(data.error || "Incorrect password");
        setShake(true);
        setTimeout(() => setShake(false), 500);
        setPassword("");
      }
    } catch {
      setError("Something went wrong. Please try again.");
      setShake(true);
      setTimeout(() => setShake(false), 500);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      className="glass-elevated relative z-10 w-full max-w-sm overflow-hidden"
      initial={{ opacity: 0, scale: 0.9, y: 20 }}
      animate={{
        opacity: 1,
        scale: 1,
        y: 0,
        x: shake ? [0, -10, 10, -10, 10, 0] : 0,
      }}
      transition={{
        duration: 0.4,
        ease: [0.34, 1.56, 0.64, 1],
        x: { duration: 0.4 },
      }}
    >
      {/* Glow effect */}
      <div
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          boxShadow: `
            0 0 60px rgba(var(--accent-rgb), 0.15),
            0 0 100px rgba(var(--accent-rgb), 0.1)
          `,
        }}
      />

      <div className="p-8">
        {/* Header */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <motion.div
            className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl"
            style={{
              background: "rgba(var(--accent-rgb), 0.15)",
              border: "1px solid rgba(var(--accent-rgb), 0.3)",
            }}
            animate={{
              boxShadow: [
                "0 0 20px rgba(var(--accent-rgb), 0.2)",
                "0 0 40px rgba(var(--accent-rgb), 0.3)",
                "0 0 20px rgba(var(--accent-rgb), 0.2)",
              ],
            }}
            transition={{ duration: 2, repeat: Infinity }}
          >
            <Sparkles className="h-8 w-8 text-accent" />
          </motion.div>
          <h1 className="text-2xl font-bold tracking-tight">Classey</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Enter password to continue
          </p>
        </motion.div>

        {/* Form */}
        <motion.form
          onSubmit={handleSubmit}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {/* Password Input */}
          <div className="relative">
            <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4">
              <Lock className="h-4 w-4 text-muted-foreground" />
            </div>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              className="w-full rounded-xl border border-border bg-input py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20 transition-all"
              autoFocus
              disabled={isLoading}
              required
            />
          </div>

          {/* Error Message */}
          <AnimatePresence>
            {error && (
              <motion.div
                className="mt-3 flex items-center gap-2 rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
              >
                <AlertCircle className="h-4 w-4 shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>

          {/* Submit Button */}
          <motion.button
            type="submit"
            className="btn-accent mt-4 flex w-full items-center justify-center gap-2 rounded-xl py-3 font-medium"
            disabled={isLoading || !password}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            {isLoading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                Verifying...
              </>
            ) : (
              "Enter"
            )}
          </motion.button>
        </motion.form>

        {/* Footer */}
        <motion.p
          className="mt-6 text-center text-xs text-muted-foreground"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          University Life Tracker
        </motion.p>
      </div>
    </motion.div>
  );
}

/**
 * Loading fallback for Suspense.
 */
function LoginLoading(): React.ReactNode {
  return (
    <div className="glass-elevated relative z-10 flex w-full max-w-sm items-center justify-center p-8">
      <Loader2 className="h-8 w-8 animate-spin text-accent" />
    </div>
  );
}

/**
 * Login page with animated password modal.
 * Full-screen, themed, beautiful - NOT a plain input.
 */
export default function LoginPage(): React.ReactNode {
  return (
    <div className="relative flex min-h-screen items-center justify-center p-4">
      {/* Background */}
      <DynamicBackground />

      {/* Login Modal */}
      <Suspense fallback={<LoginLoading />}>
        <LoginForm />
      </Suspense>
    </div>
  );
}

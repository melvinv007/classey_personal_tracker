"use client";

import { motion } from "framer-motion";
import { FileQuestion, Home, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

/**
 * 404 Not Found page
 */
export default function NotFound(): React.ReactNode {
  const router = useRouter();

  return (
    <div className="flex min-h-screen items-center justify-center p-4">
      <motion.div
        className="glass-card max-w-md p-8 text-center"
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
      >
        <div
          className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl"
          style={{ background: "rgba(var(--accent-rgb), 0.1)" }}
        >
          <FileQuestion className="h-10 w-10 text-accent" />
        </div>
        
        <h1 className="mb-2 text-2xl font-bold">Page not found</h1>
        <p className="mb-6 text-muted-foreground">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>

        <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            onClick={() => router.back()}
            className="flex items-center justify-center gap-2 rounded-xl border border-border bg-muted px-5 py-2.5 font-medium transition-colors hover:bg-muted/80"
          >
            <ArrowLeft className="h-4 w-4" />
            Go Back
          </button>
          <Link
            href="/"
            className="flex items-center justify-center gap-2 rounded-xl bg-accent px-5 py-2.5 font-medium text-white transition-colors hover:bg-accent/90"
          >
            <Home className="h-4 w-4" />
            Go Home
          </Link>
        </div>
      </motion.div>
    </div>
  );
}

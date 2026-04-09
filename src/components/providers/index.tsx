"use client";

import type { ReactNode } from "react";
import { ThemeProvider } from "./ThemeProvider";
import { QueryProvider } from "./QueryProvider";
import { Toaster } from "sonner";

/**
 * Props for Providers component
 */
interface ProvidersProps {
  children: ReactNode;
}

/**
 * Combined providers wrapper for the app.
 * Includes: ThemeProvider, QueryProvider, Sonner Toaster.
 */
export function Providers({ children }: ProvidersProps): ReactNode {
  return (
    <QueryProvider>
      <ThemeProvider>
        {children}
        <Toaster
          position="bottom-right"
          expand={false}
          richColors
          closeButton
          duration={4000}
          toastOptions={{
            className: "glass-card",
            style: {
              background: "var(--glass-bg)",
              backdropFilter: "blur(var(--glass-blur))",
              border: "1px solid var(--glass-border)",
            },
          }}
        />
      </ThemeProvider>
    </QueryProvider>
  );
}

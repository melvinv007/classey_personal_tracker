import type { ReactNode } from "react";

/**
 * Auth layout - minimal wrapper for login page.
 */
export default function AuthLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return <>{children}</>;
}

import type { ReactNode } from "react";
import { Dock, AIBubble } from "@/components/layout";
import { DynamicBackground } from "@/components/backgrounds";
import { GlobalSearch } from "@/components/GlobalSearch";
import { SkipToContent } from "@/components/common";

/**
 * Dashboard layout - wraps all authenticated pages.
 * Includes: dynamic background, dock navigation, AI bubble, global search.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  return (
    <div className="relative min-h-screen">
      {/* Skip to content link for accessibility */}
      <SkipToContent />

      {/* Dynamic Background */}
      <DynamicBackground />

      {/* Main Content */}
        <main 
          id="main-content" 
          className="relative z-10 min-h-screen pb-24 md:pb-4 md:pl-24"
          tabIndex={-1}
        >
        {children}
      </main>

      {/* Dock Navigation */}
      <Dock />

      {/* AI Chat Bubble */}
      <AIBubble />

      {/* Global Search (Cmd+K) */}
      <GlobalSearch />
    </div>
  );
}

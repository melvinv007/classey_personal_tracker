"use client";

import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Dock, AIBubble } from "@/components/layout";
import { DynamicBackground } from "@/components/backgrounds";
import { GlobalSearch } from "@/components/GlobalSearch";
import { SkipToContent } from "@/components/common";
import { useUIScaleStore, type ScalePage, SCALE_PAGES } from "@/stores/ui-scale-store";
import { usePathname } from "next/navigation";

/**
 * Resolve the current pathname to the nearest ScalePage key.
 * e.g. "/minor/abc123" → "/minor", "/analytics/cgpa" → "/analytics/cgpa"
 */
function resolveScalePage(pathname: string): ScalePage {
  // Exact match first
  if ((SCALE_PAGES as readonly string[]).includes(pathname)) {
    return pathname as ScalePage;
  }
  // Prefix match (longest first)
  const sorted = [...SCALE_PAGES].sort((a, b) => b.length - a.length);
  for (const page of sorted) {
    if (page !== "/" && pathname.startsWith(page)) {
      return page;
    }
  }
  return "/";
}

/**
 * Dashboard layout - wraps all authenticated pages.
 * Includes: dynamic background, dock navigation, AI bubble, global search.
 * Applies device-specific desktop UI scale per page via CSS zoom.
 */
export default function DashboardLayout({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const pathname = usePathname();
  const getEffectiveScale = useUIScaleStore((s) => s.getEffectiveScale);
  const globalScale = useUIScaleStore((s) => s.globalScale);
  const pageScales = useUIScaleStore((s) => s.pageScales);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const check = () => setIsDesktop(window.innerWidth >= 768);
    check();
    window.addEventListener("resize", check);
    return () => window.removeEventListener("resize", check);
  }, []);

  const scalePage = resolveScalePage(pathname);
  const scale = getEffectiveScale(scalePage);
  const zoomStyle = isDesktop && scale !== 100 ? { zoom: scale / 100 } : undefined;

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
        style={zoomStyle}
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

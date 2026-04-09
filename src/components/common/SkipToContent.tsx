"use client";

/**
 * Skip to main content link for keyboard/screen reader users
 * Hidden until focused
 */
export function SkipToContent(): React.ReactNode {
  return (
    <a
      href="#main-content"
      className="fixed left-4 top-4 z-[200] -translate-y-16 rounded-xl bg-accent px-4 py-2 text-sm font-medium text-white transition-transform focus:translate-y-0"
    >
      Skip to main content
    </a>
  );
}

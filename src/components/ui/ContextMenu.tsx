"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

interface ContextMenuProps {
  children: React.ReactNode;
  items: ContextMenuItem[];
}

export interface ContextMenuItem {
  label: string;
  icon?: React.ReactNode;
  onClick: () => void;
  variant?: "default" | "danger";
  disabled?: boolean;
}

interface ContextMenuState {
  isOpen: boolean;
  x: number;
  y: number;
}

export function ContextMenu({ children, items }: ContextMenuProps): React.ReactNode {
  const [state, setState] = React.useState<ContextMenuState>({
    isOpen: false,
    x: 0,
    y: 0,
  });
  const menuRef = React.useRef<HTMLDivElement>(null);
  const triggerRef = React.useRef<HTMLDivElement>(null);

  const handleContextMenu = React.useCallback((e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Calculate position to keep menu in viewport
    const x = Math.min(e.clientX, window.innerWidth - 200);
    const y = Math.min(e.clientY, window.innerHeight - items.length * 40 - 20);
    
    setState({ isOpen: true, x, y });
  }, [items.length]);

  const handleLongPress = React.useCallback((e: React.TouchEvent) => {
    e.preventDefault();
    const touch = e.touches[0];
    const x = Math.min(touch.clientX, window.innerWidth - 200);
    const y = Math.min(touch.clientY, window.innerHeight - items.length * 40 - 20);
    
    setState({ isOpen: true, x, y });
  }, [items.length]);

  const close = React.useCallback(() => {
    setState((s) => ({ ...s, isOpen: false }));
  }, []);

  // Close on click outside
  React.useEffect(() => {
    if (!state.isOpen) return;

    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        close();
      }
    };

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };

    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleEscape);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleEscape);
    };
  }, [state.isOpen, close]);

  // Long press detection for mobile
  const longPressTimer = React.useRef<NodeJS.Timeout | null>(null);

  const handleTouchStart = React.useCallback((e: React.TouchEvent) => {
    longPressTimer.current = setTimeout(() => {
      handleLongPress(e);
    }, 500);
  }, [handleLongPress]);

  const handleTouchEnd = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  const handleTouchMove = React.useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  return (
    <>
      <div
        ref={triggerRef}
        onContextMenu={handleContextMenu}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onTouchMove={handleTouchMove}
        className="contents"
      >
        {children}
      </div>

      <AnimatePresence>
        {state.isOpen && (
          <>
            {/* Backdrop for mobile */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 md:hidden"
              onClick={close}
            />
            
            {/* Menu */}
            <motion.div
              ref={menuRef}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 min-w-[180px] glass-elevated rounded-xl shadow-xl overflow-hidden"
              style={{ left: state.x, top: state.y }}
            >
              {items.map((item, index) => (
                <button
                  key={index}
                  onClick={() => {
                    if (!item.disabled) {
                      item.onClick();
                      close();
                    }
                  }}
                  disabled={item.disabled}
                    className={cn(
                     "w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left transition-colors interactive-surface interactive-focus",
                     item.variant === "danger"
                       ? "text-red-400 hover:bg-red-500/10"
                       : "text-foreground hover:bg-white/10",
                    item.disabled && "opacity-50 cursor-not-allowed"
                  )}
                >
                  {item.icon && <span className="w-4 h-4">{item.icon}</span>}
                  {item.label}
                </button>
              ))}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}

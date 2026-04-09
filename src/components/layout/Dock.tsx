"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Home,
  Calendar,
  CheckSquare,
  FolderOpen,
  BarChart3,
  Settings,
  Clock,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Navigation item interface
 */
interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

/**
 * Main navigation items
 */
const navItems: NavItem[] = [
  { href: "/", label: "Home", icon: Home },
  { href: "/timetable", label: "Timetable", icon: Clock },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/tasks", label: "Tasks", icon: CheckSquare },
  { href: "/files", label: "Files", icon: FolderOpen },
  { href: "/analytics/cgpa", label: "Analytics", icon: BarChart3 },
  { href: "/settings", label: "Settings", icon: Settings },
];

/**
 * Dock navigation component.
 * Minimal dock with icons + labels on desktop, icons only on mobile.
 * Fixed to bottom on mobile, left side on desktop.
 */
export function Dock(): React.ReactNode {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Dock - Left side */}
      <motion.nav
        className="group fixed left-3 top-1/2 z-50 hidden -translate-y-1/2 md:block"
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="glass-card flex flex-col gap-1 p-2 w-14 group-hover:w-44 transition-[width] duration-150 overflow-hidden">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "group interactive-surface interactive-focus relative flex items-center gap-3 rounded-xl px-3 py-2.5",
                    isActive
                      ? "bg-accent/20 text-accent"
                      : "text-muted-foreground hover:bg-accent/10 hover:text-foreground"
                  )}
                >
                <item.icon className="h-5 w-5 shrink-0" />
                <span className="text-sm font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150">
                  {item.label}
                </span>

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -left-2 top-1/2 h-6 w-1 -translate-y-1/2 rounded-full bg-accent"
                    layoutId="dock-active-desktop"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.nav>

      {/* Mobile Dock - Bottom */}
      <motion.nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        <div className="glass-card mx-4 mb-4 flex items-center justify-around rounded-2xl p-2">
          {navItems.map((item) => {
            const isActive =
              pathname === item.href ||
              (item.href !== "/" && pathname.startsWith(item.href));

            return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    "interactive-surface interactive-focus relative flex flex-col items-center gap-1 rounded-xl p-2",
                    isActive
                      ? "text-accent"
                      : "text-muted-foreground active:scale-95"
                  )}
                >
                <item.icon className="h-5 w-5" />

                {/* Active indicator */}
                {isActive && (
                  <motion.div
                    className="absolute -bottom-1 h-1 w-6 rounded-full bg-accent"
                    layoutId="dock-active-mobile"
                    transition={{
                      type: "spring",
                      stiffness: 300,
                      damping: 30,
                    }}
                  />
                )}
              </Link>
            );
          })}
        </div>
      </motion.nav>
    </>
  );
}

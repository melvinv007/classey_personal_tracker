"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

export interface BackButtonProps {
  href?: string;
  label?: string;
  className?: string;
}

/**
 * BackButton - Navigation back button with optional custom destination
 */
export function BackButton({
  href,
  label = "Back",
  className,
}: BackButtonProps): React.ReactNode {
  const router = useRouter();

  const handleClick = (): void => {
    if (href) {
      router.push(href);
    } else {
      router.back();
    }
  };

  return (
    <motion.button
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      onClick={handleClick}
      className={cn(
        "flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground",
        "transition-colors duration-200",
        className
      )}
    >
      <ArrowLeft className="w-4 h-4" />
      <span>{label}</span>
    </motion.button>
  );
}

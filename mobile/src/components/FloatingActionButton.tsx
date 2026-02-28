import React from "react";
import { motion } from "motion/react";
import { cn } from "../lib/utils";

interface FABProps {
  onClick: () => void;
  icon: React.ReactNode;
  className?: string;
}

export function FloatingActionButton({ onClick, icon, className }: FABProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={cn(
        "absolute bottom-24 right-6 w-14 h-14 bg-[#FF6B6B] text-white rounded-full flex items-center justify-center shadow-lg shadow-red-500/40 z-40 transition-colors hover:bg-[#FF8E8E]",
        className,
      )}
    >
      {icon}
    </motion.button>
  );
}

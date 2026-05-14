"use client";

import { motion } from "framer-motion";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { AuthButton } from "@/components/ui/AuthButton";
import { Bot } from "lucide-react";

export function Navbar() {
  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md"
    >
      <div className="flex h-16 items-center justify-between px-4 md:px-8 max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-600 dark:bg-indigo-500 rounded-xl text-white shadow-md">
            <Bot size={24} />
          </div>
          <span className="font-semibold text-lg tracking-tight text-zinc-900 dark:text-zinc-100">
            Agent Workspace
          </span>
        </div>
        
        <div className="flex items-center gap-4">
          <ThemeToggle />
          <AuthButton />
        </div>
      </div>
    </motion.header>
  );
}
"use client";

import { useEffect, useState } from "react";
import { useUIStore } from "@/store/useUIStore";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { theme } = useUIStore();
  const [mounted, setMounted] = useState(false);

  // Hydration hatasını önlemek için bileşenin istemcide mount olmasını bekliyoruz
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;

    const root = window.document.documentElement;
    root.classList.remove("light", "dark");

    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches
        ? "dark"
        : "light";
      root.classList.add(systemTheme);
      return;
    }

    root.classList.add(theme);
  }, [theme, mounted]);

  // Server-side render sırasında sadece çocukları döndür (class eklemeden)
  if (!mounted) {
    return <>{children}</>;
  }

  return <>{children}</>;
}
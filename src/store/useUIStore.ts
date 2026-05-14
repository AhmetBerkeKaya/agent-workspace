import { create } from "zustand";

type Theme = "light" | "dark" | "system";

interface UIState {
  theme: Theme;
  setTheme: (theme: Theme) => void;
}

export const useUIStore = create<UIState>((set) => ({
  theme: "system", // Varsayılan olarak işletim sistemi temasını baz alır
  setTheme: (theme) => set({ theme }),
}));
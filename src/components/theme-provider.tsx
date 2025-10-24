import * as React from "react";

// CRITICAL: React Context Guard
if (typeof React.createContext === "undefined") {
  throw new Error(
    "[Theme Provider] React createContext is not available. This indicates a module loading issue.",
  );
}

import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(() => {
    if (typeof window === "undefined" || typeof localStorage === "undefined") {
      return defaultTheme;
    }
    try {
      return (localStorage.getItem(storageKey) as Theme) || defaultTheme;
    } catch (error) {
      console.warn("[ThemeProvider] Failed to access localStorage:", error);
      return defaultTheme;
    }
  });

  useEffect(() => {
    if (typeof window === "undefined") return;

    const root = window.document.documentElement;

    // Remove existing theme classes and attributes
    root.classList.remove("light", "dark");
    
    // Determine the actual theme to apply
    let appliedTheme: string;
    
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";
      appliedTheme = systemTheme;
    } else {
      appliedTheme = theme;
    }

    // Set Tailwind dark mode class
    root.classList.add(appliedTheme);
    
    // Set DaisyUI data-theme attribute
    root.setAttribute("data-theme", appliedTheme);
    
    // Listen for system theme changes when in system mode
    if (theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = (e: MediaQueryListEvent) => {
        const newSystemTheme = e.matches ? "dark" : "light";
        root.classList.remove("light", "dark");
        root.classList.add(newSystemTheme);
        root.setAttribute("data-theme", newSystemTheme);
      };
      
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      if (
        typeof window !== "undefined" &&
        typeof localStorage !== "undefined"
      ) {
        try {
          localStorage.setItem(storageKey, theme);
        } catch (error) {
          console.warn(
            "[ThemeProvider] Failed to save theme to localStorage:",
            error,
          );
        }
      }
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};

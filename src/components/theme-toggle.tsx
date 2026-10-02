"use client"

import { useEffect, useState } from "react";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted) {
    return <div className="h-[52px] w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl animate-pulse" />;
  }

  const isDark = theme === "dark";

  return (
    <div className="flex items-center justify-between bg-zinc-900/50 border border-zinc-800 rounded-2xl p-4">
      <div className="flex items-center gap-3">
        {isDark ? <Moon className="h-4 w-4 text-blue-400" /> : <Sun className="h-4 w-4 text-orange-400" />}
        <div>
          <p className="text-sm font-bold text-white">{isDark ? "Dark Mode" : "Light Mode"}</p>
          <p className="text-[10px] text-zinc-500 font-medium">Choose how MediQueue looks to you</p>
        </div>
      </div>
      <button
        onClick={() => setTheme(isDark ? "light" : "dark")}
        suppressHydrationWarning
        role="switch"
        aria-checked={isDark}
        className={`relative h-7 w-12 rounded-full transition-colors duration-300 shrink-0 ${
          isDark ? "bg-blue-600" : "bg-zinc-700"
        }`}
      >
        <span
          className={`absolute top-1 h-5 w-5 rounded-full bg-white transition-transform duration-300 ${
            isDark ? "translate-x-6" : "translate-x-1"
          }`}
        />
      </button>
    </div>
  );
}
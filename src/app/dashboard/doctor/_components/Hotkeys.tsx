"use client";

import { useEffect } from "react";

// N = next patient bulao, C = current patient complete karo
export default function Hotkeys() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return;

      const target = e.target as HTMLElement | null;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.tagName === "SELECT" ||
          target.isContentEditable)
      ) {
        return;
      }

      const key = e.key.toLowerCase();
      if (key === "n") {
        (document.getElementById("call-next-form") as HTMLFormElement | null)?.requestSubmit();
      } else if (key === "c") {
        (document.getElementById("complete-form") as HTMLFormElement | null)?.requestSubmit();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return null;
}
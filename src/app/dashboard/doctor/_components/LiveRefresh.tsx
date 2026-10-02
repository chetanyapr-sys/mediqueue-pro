"use client";

import { useCallback, useEffect, useRef, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { RefreshCw } from "lucide-react";
import { toast } from "sonner";

const REFRESH_EVERY_MS = 20000;

function ago(seconds: number) {
  if (seconds < 5) return "just now";
  if (seconds < 60) return `${seconds}s ago`;
  return `${Math.floor(seconds / 60)}m ago`;
}

export default function LiveRefresh({ waitingCount }: { waitingCount: number }) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [lastUpdated, setLastUpdated] = useState(() => Date.now());
  const [now, setNow] = useState(() => Date.now());
  const prevWaiting = useRef(waitingCount);

  const refresh = useCallback(() => {
    startTransition(() => {
      router.refresh();
    });
  }, [router]);

  // Data aa jane ke baad "updated" time reset karo
  useEffect(() => {
    if (!isPending) setLastUpdated(Date.now());
  }, [isPending]);

  // Har 20 sec mein refresh (sirf jab tab dikh raha ho) + tab wapas aane pe turant
  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") refresh();
    }, REFRESH_EVERY_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  // "Updated Xs ago" text ko taaza rakhne ke liye
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(id);
  }, []);

  // Naya patient queue mein aaye to notification
  useEffect(() => {
    if (waitingCount > prevWaiting.current) {
      const diff = waitingCount - prevWaiting.current;
      toast.info(diff === 1 ? "A new patient joined your queue" : `${diff} new patients joined your queue`);
    }
    prevWaiting.current = waitingCount;
  }, [waitingCount]);

  const seconds = Math.max(0, Math.round((now - lastUpdated) / 1000));

  return (
    <button
      type="button"
      onClick={refresh}
      title="Refresh now"
      suppressHydrationWarning
      className="group inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1.5 text-xs text-zinc-400 transition-all duration-300 hover:border-zinc-700 hover:text-white"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-500 opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
      </span>
      Live
      <span className="text-zinc-600">updated {ago(seconds)}</span>
      <RefreshCw
        className={`h-3.5 w-3.5 ${isPending ? "animate-spin" : "transition-transform duration-500 group-hover:rotate-180"}`}
      />
    </button>
  );
}
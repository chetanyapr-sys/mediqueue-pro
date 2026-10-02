"use client"

import { useState, useRef } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, CalendarClock, UserCircle, Settings, Stethoscope, PanelLeft } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/doctor", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/doctor/appointments", label: "Appointments", icon: CalendarClock, exact: false },
  { href: "/dashboard/doctor/profile", label: "Profile", icon: UserCircle, exact: false },
  { href: "/dashboard/doctor/settings", label: "Settings", icon: Settings, exact: false },
];

const MIN_WIDTH = 208;
const MAX_WIDTH = 360;
const DEFAULT_WIDTH = 256;

export default function DoctorSidebar() {
  const pathname = usePathname();
  const [isOpen, setIsOpen] = useState(true);
  const [isPeeking, setIsPeeking] = useState(false);
  const [width, setWidth] = useState(DEFAULT_WIDTH);
  const isResizing = useRef(false);

  function handleResizeStart(e: React.MouseEvent) {
    e.preventDefault();
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";

    function onMouseMove(moveEvent: MouseEvent) {
      if (!isResizing.current) return;
      setWidth(Math.min(MAX_WIDTH, Math.max(MIN_WIDTH, moveEvent.clientX)));
    }
    function onMouseUp() {
      isResizing.current = false;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
      window.removeEventListener("mousemove", onMouseMove);
      window.removeEventListener("mouseup", onMouseUp);
    }
    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("mouseup", onMouseUp);
  }

  const NavLinks = (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        return (
          <Link
            key={item.href}
            href={item.href}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all duration-300 ${
              isActive ? "bg-white text-black" : "text-zinc-500 hover:text-white hover:bg-zinc-900"
            }`}
          >
            <item.icon className="h-4 w-4 shrink-0" />
            <span className="truncate">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );

  // ── PINNED OPEN: normal sidebar, part of the page flow, resizable ──
  if (isOpen) {
    return (
      <aside
        style={{ width }}
        className="relative h-screen shrink-0 sticky top-0 bg-zinc-950 border-r border-zinc-900 flex flex-col"
      >
        <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-900 shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
              <Stethoscope className="h-4 w-4 text-white" />
            </div>
            <span className="text-white font-black tracking-tight text-sm truncate">
              MediQueue <span className="text-zinc-600 font-medium italic">Pro</span>
            </span>
          </div>
          <button
            onClick={() => setIsOpen(false)}
            title="Hide sidebar"
            suppressHydrationWarning
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors shrink-0"
          >
            <PanelLeft className="h-4 w-4" />
          </button>
        </div>

        {NavLinks}

        <div className="flex items-center gap-2.5 px-4 py-4 border-t border-zinc-900 shrink-0">
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account</span>
        </div>

        {/* Drag handle — width ko mouse se resize karne ke liye */}
        <div
          onMouseDown={handleResizeStart}
          className="absolute top-0 right-0 h-full w-1 cursor-col-resize hover:bg-blue-600/50 active:bg-blue-600 transition-colors"
        />
      </aside>
    );
  }

  // ── HIDDEN: sirf ek chhota toggle button, hover pe poora nav flyout ki tarah khulta hai ──
  return (
    <>
      {/* Layout mein 0-width jagah reserve karta hai, taaki content shift na ho */}
      <div className="w-0 h-screen shrink-0" />

      <div
        onMouseEnter={() => setIsPeeking(true)}
        onMouseLeave={() => setIsPeeking(false)}
        style={{ width: isPeeking ? width : 48 }}
        className="fixed top-0 left-0 h-screen z-40 transition-[width] duration-200"
      >
        {isPeeking ? (
          <aside className="h-full bg-zinc-950 border-r border-zinc-900 flex flex-col shadow-2xl shadow-black/60">
            <div className="flex items-center justify-between px-4 h-16 border-b border-zinc-900 shrink-0">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="h-8 w-8 rounded-xl bg-blue-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-black tracking-tight text-sm truncate">
                  MediQueue <span className="text-zinc-600 font-medium italic">Pro</span>
                </span>
              </div>
              <button
                onClick={() => setIsOpen(true)}
                title="Pin sidebar open"
                suppressHydrationWarning
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors shrink-0"
              >
                <PanelLeft className="h-4 w-4" />
              </button>
            </div>
            {NavLinks}
            <div className="flex items-center gap-2.5 px-4 py-4 border-t border-zinc-900 shrink-0">
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
              <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Account</span>
            </div>
          </aside>
        ) : (
          <div className="h-full flex items-start justify-center pt-4">
            <button
              onClick={() => setIsOpen(true)}
              title="Show sidebar"
              suppressHydrationWarning
              className="p-2.5 rounded-xl bg-zinc-900 border border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700 transition-colors shadow-lg"
            >
              <PanelLeft className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </>
  );
}
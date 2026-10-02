"use client"

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { UserButton } from "@clerk/nextjs";
import { LayoutDashboard, Search, History, UserCircle, Settings, Stethoscope, PanelLeft, Menu, X } from "lucide-react";

const NAV_ITEMS = [
  { href: "/dashboard/patient", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { href: "/dashboard/patient/find-doctors", label: "Find Doctors", icon: Search, exact: false },
  { href: "/dashboard/patient/history", label: "History", icon: History, exact: false },
  { href: "/dashboard/patient/profile", label: "Profile", icon: UserCircle, exact: false },
  { href: "/dashboard/patient/settings", label: "Settings", icon: Settings, exact: false },
];

export default function PatientSidebar() {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navLinks = (onNavigate?: () => void, forceExpanded = false) => (
    <nav className="flex-1 px-3 py-5 space-y-1 overflow-y-auto">
      {NAV_ITEMS.map((item) => {
        const isActive = item.exact ? pathname === item.href : pathname.startsWith(item.href);
        const showLabel = forceExpanded || !collapsed;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            title={!showLabel ? item.label : undefined}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              isActive
                ? "bg-blue-500/15 text-blue-400"
                : "text-zinc-400 hover:text-white hover:bg-zinc-900"
            } ${!showLabel ? "justify-center" : ""}`}
          >
            <item.icon className="h-[18px] w-[18px] shrink-0" />
            {showLabel && <span className="truncate">{item.label}</span>}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <>
      {/* Mobile top bar — sirf chhoti screens (< md) pe dikhta hai */}
      <div className="md:hidden fixed top-0 left-0 right-0 h-14 z-40 bg-black border-b border-zinc-900 flex items-center justify-between px-4">
        <div className="flex items-center gap-2.5">
          <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
            <Stethoscope className="h-4 w-4 text-white" />
          </div>
          <span className="text-white font-bold text-sm">MediQueue Pro</span>
        </div>
        <button
          onClick={() => setMobileOpen(true)}
          suppressHydrationWarning
          className="p-2 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
        >
          <Menu className="h-5 w-5" />
        </button>
      </div>

      {/* Desktop sidebar — sirf md aur usse badi screens pe */}
      <aside
        className={`hidden md:flex sticky top-0 h-screen shrink-0 bg-black border-r border-zinc-900 flex-col transition-all duration-300 ${
          collapsed ? "w-[76px]" : "w-64"
        }`}
      >
        <div className={`flex items-center h-16 px-4 border-b border-zinc-900 ${collapsed ? "justify-center px-0" : "justify-between"}`}>
          {!collapsed && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                <Stethoscope className="h-4 w-4 text-white" />
              </div>
              <span className="text-white font-bold text-sm truncate">MediQueue Pro</span>
            </div>
          )}
          <button
            onClick={() => setCollapsed((c) => !c)}
            suppressHydrationWarning
            title={collapsed ? "Expand sidebar" : "Collapse sidebar"}
            className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors shrink-0"
          >
            <PanelLeft className="h-[18px] w-[18px]" />
          </button>
        </div>

        {navLinks()}

        <div className={`flex items-center gap-2.5 px-4 py-4 border-t border-zinc-900 ${collapsed ? "justify-center px-0" : ""}`}>
          <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
          {!collapsed && <span className="text-sm text-zinc-400">Logout</span>}
        </div>
      </aside>

      {/* Mobile drawer — sirf jab hamburger click ho */}
      {mobileOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="relative h-full w-72 max-w-[80vw] bg-black border-r border-zinc-900 flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-4 h-14 border-b border-zinc-900">
              <div className="flex items-center gap-2.5">
                <div className="h-7 w-7 rounded-md bg-blue-600 flex items-center justify-center shrink-0">
                  <Stethoscope className="h-4 w-4 text-white" />
                </div>
                <span className="text-white font-bold text-sm">MediQueue Pro</span>
              </div>
              <button
                onClick={() => setMobileOpen(false)}
                suppressHydrationWarning
                className="p-1.5 rounded-lg text-zinc-500 hover:text-white hover:bg-zinc-900 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {navLinks(() => setMobileOpen(false), true)}

            <div className="flex items-center gap-2.5 px-4 py-4 border-t border-zinc-900">
              <UserButton appearance={{ elements: { avatarBox: "h-8 w-8" } }} />
              <span className="text-sm text-zinc-400">Logout</span>
            </div>
          </aside>
        </div>
      )}
    </>
  );
}
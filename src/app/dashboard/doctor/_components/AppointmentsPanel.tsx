"use client"

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import {
  Search,
  X,
  XCircle,
  CheckCircle2,
  PlayCircle,
  ChevronRight,
  Pill,
  Inbox,
  ArrowUpDown,
  Clock,
  ArrowRight,
} from "lucide-react";
import { cancelAppointment, completeAppointment, markInProgress } from "@/actions/appointment";

interface Patient {
  name: string | null;
}

interface Prescription {
  diagnosis: string | null;
  medicines: string;
  notes: string | null;
}

interface Appointment {
  id: string;
  tokenNumber: number;
  status: string;
  symptoms: string | null;
  appointmentDate: Date | string;
  createdAt?: Date | string;
  patient: Patient | null;
  prescription: Prescription | null;
}

export type ViewType = "today" | "upcoming" | "past";

type StatusCounts = {
  WAITING: number;
  IN_PROGRESS: number;
  COMPLETED: number;
  CANCELLED: number;
};

const STATUS_FILTERS = ["All", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

const PAGE_SIZE = 15;

const SORTS = [
  { key: "default", label: "Default order" },
  { key: "token", label: "Token number" },
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
];

const STATUS_META: Record<
  string,
  { label: string; text: string; bg: string; border: string; dot: string; glow: string }
> = {
  All: {
    label: "All",
    text: "text-white",
    bg: "bg-white/5",
    border: "border-zinc-700",
    dot: "bg-white",
    glow: "rgba(255,255,255,0.08)",
  },
  WAITING: {
    label: "Waiting",
    text: "text-amber-400",
    bg: "bg-amber-500/10",
    border: "border-amber-500/30",
    dot: "bg-amber-400",
    glow: "rgba(245,158,11,0.16)",
  },
  IN_PROGRESS: {
    label: "In progress",
    text: "text-blue-400",
    bg: "bg-blue-500/10",
    border: "border-blue-500/30",
    dot: "bg-blue-400",
    glow: "rgba(59,130,246,0.18)",
  },
  COMPLETED: {
    label: "Completed",
    text: "text-emerald-400",
    bg: "bg-emerald-500/10",
    border: "border-emerald-500/30",
    dot: "bg-emerald-400",
    glow: "rgba(16,185,129,0.16)",
  },
  CANCELLED: {
    label: "Cancelled",
    text: "text-red-400",
    bg: "bg-red-500/10",
    border: "border-red-500/30",
    dot: "bg-red-400",
    glow: "rgba(239,68,68,0.14)",
  },
};

function getMeta(status: string) {
  return STATUS_META[status] ?? STATUS_META.All;
}

function initials(name: string | null | undefined) {
  if (!name) return "P";
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "P";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

function timeAgo(from: Date | string, now: number) {
  const diff = Math.max(0, now - new Date(from).getTime());
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// Card ke upar hover pe aane wala radial colour glow (doctor dashboard wala pattern)
function Glow({ color }: { color: string }) {
  return (
    <div
      aria-hidden
      className="pointer-events-none absolute inset-0 rounded-3xl opacity-0 transition-opacity duration-500 group-hover:opacity-100"
      style={{ background: `radial-gradient(420px circle at 50% 0%, ${color}, transparent 70%)` }}
    />
  );
}

/* ------------------------------------------------------------------ */
/* Live badge: har 20s mein page data refresh (tab visible ho tabhi)   */
/* ------------------------------------------------------------------ */
export function LiveBadge({ seconds = 20 }: { seconds?: number }) {
  const router = useRouter();

  useEffect(() => {
    const id = setInterval(() => {
      if (document.visibilityState === "visible") router.refresh();
    }, seconds * 1000);
    return () => clearInterval(id);
  }, [router, seconds]);

  return (
    <span
      title={`Auto-refreshes every ${seconds}s`}
      className="inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400"
    >
      <span className="relative flex h-2 w-2">
        <span className="absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
      </span>
      Live
    </span>
  );
}

/* ------------------------------------------------------------------ */
/* Today / Upcoming / Past tabs: count badge + sliding indicator       */
/* ------------------------------------------------------------------ */
export function ViewTabs({
  view,
  counts,
}: {
  view: ViewType;
  counts: Record<ViewType, number>;
}) {
  const tabs: { key: ViewType; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="flex gap-1 bg-zinc-950/50 p-1.5 rounded-2xl border border-zinc-800/50 w-fit max-w-full">
      {tabs.map((tab) => {
        const active = view === tab.key;
        return (
          <Link
            key={tab.key}
            href={`/dashboard/doctor/appointments?view=${tab.key}`}
            scroll={false}
            className="relative flex items-center gap-2 px-4 sm:px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest"
          >
            {active && (
              <motion.span
                layoutId="appointments-tab-pill"
                className="absolute inset-0 rounded-xl bg-white"
                transition={{ type: "spring", bounce: 0.2, duration: 0.5 }}
              />
            )}
            <span
              className={`relative z-10 transition-colors duration-300 ${
                active ? "text-black" : "text-zinc-500 hover:text-white"
              }`}
            >
              {tab.label}
            </span>
            <span
              className={`relative z-10 min-w-5 rounded-full px-1.5 py-0.5 text-center text-[10px] font-black transition-colors duration-300 ${
                active ? "bg-black/10 text-black" : "bg-zinc-900 text-zinc-500"
              }`}
            >
              {counts[tab.key]}
            </span>
          </Link>
        );
      })}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Main panel                                                          */
/* ------------------------------------------------------------------ */
export default function AppointmentsPanel({
  appointments,
  emptyLabel,
  view = "today",
  statusCounts,
  tabCounts,
}: {
  appointments: Appointment[];
  emptyLabel: string;
  view?: ViewType;
  statusCounts?: StatusCounts;
  tabCounts?: Record<ViewType, number>;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [sort, setSort] = useState("default");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [now, setNow] = useState<number | null>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const reduceMotion = useReducedMotion();

  // "Booked 5 min ago" hydration-safe rahe, isliye mount ke baad hi time set karte hain
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(id);
  }, []);

  // Filters badle to list wapas pehle page se shuru
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, statusFilter, sort, view]);

  // "/" dabao to search focus ho jaye
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const t = e.target as HTMLElement | null;
      const typing =
        t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable);
      if (e.key === "/" && !typing && !e.metaKey && !e.ctrlKey && !e.altKey) {
        e.preventDefault();
        searchRef.current?.focus();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const filtered = useMemo(() => {
    const list = appointments.filter((appt) => {
      const name = appt.patient?.name || "";
      const matchesSearch =
        search.trim() === "" ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        String(appt.tokenNumber).includes(search.trim());
      const matchesStatus = statusFilter === "All" || appt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });

    if (sort === "token") return [...list].sort((a, b) => a.tokenNumber - b.tokenNumber);
    if (sort === "newest")
      return [...list].sort(
        (a, b) => new Date(b.appointmentDate).getTime() - new Date(a.appointmentDate).getTime()
      );
    if (sort === "oldest")
      return [...list].sort(
        (a, b) => new Date(a.appointmentDate).getTime() - new Date(b.appointmentDate).getTime()
      );
    return list;
  }, [appointments, search, statusFilter, sort]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Aaj ke view mein sabse pehla WAITING patient = "Up next"
  const upNextId = useMemo(() => {
    if (view !== "today") return null;
    return appointments.find((a) => a.status === "WAITING")?.id ?? null;
  }, [appointments, view]);

  const counts: StatusCounts = statusCounts ?? {
    WAITING: appointments.filter((a) => a.status === "WAITING").length,
    IN_PROGRESS: appointments.filter((a) => a.status === "IN_PROGRESS").length,
    COMPLETED: appointments.filter((a) => a.status === "COMPLETED").length,
    CANCELLED: appointments.filter((a) => a.status === "CANCELLED").length,
  };
  const totalCount = counts.WAITING + counts.IN_PROGRESS + counts.COMPLETED + counts.CANCELLED;

  const shown = filtered.slice(0, visible);
  const remaining = filtered.length - shown.length;
  const hasFilters = search.trim() !== "" || statusFilter !== "All";

  function clearFilters() {
    setSearch("");
    setStatusFilter("All");
  }

  const emptyHint =
    view === "today"
      ? { text: "Nothing booked for today. Check what's coming up next.", href: "upcoming", cta: "View upcoming", count: tabCounts?.upcoming }
      : view === "upcoming"
      ? { text: "New bookings from patients will show up here.", href: "today", cta: "Go to today", count: tabCounts?.today }
      : { text: "Finished visits will be listed here.", href: "today", cta: "Go to today", count: tabCounts?.today };

  return (
    <div className="space-y-5">
      {/* Stat strip (clickable, status filter ka kaam bhi karti hai) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {STATUS_FILTERS.map((status) => {
          const meta = getMeta(status);
          const value = status === "All" ? totalCount : counts[status as keyof StatusCounts];
          const active = statusFilter === status;
          return (
            <button
              key={status}
              type="button"
              onClick={() => setStatusFilter(status)}
              suppressHydrationWarning
              aria-pressed={active}
              className={`group relative overflow-hidden rounded-3xl border bg-zinc-950/80 p-4 text-left transition-all duration-300 motion-safe:hover:-translate-y-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 ${
                active ? `${meta.border} ring-1 ring-white/10` : "border-zinc-800/60 hover:border-zinc-700"
              }`}
            >
              <Glow color={meta.glow} />
              <div className="relative">
                <div className="flex items-center gap-2">
                  <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
                  <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
                    {meta.label}
                  </span>
                </div>
                <p className={`mt-2 text-3xl font-black tabular-nums ${active ? meta.text : "text-white"}`}>
                  {value}
                </p>
              </div>
            </button>
          );
        })}
      </div>

      {/* Search + sort */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <input
            ref={searchRef}
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Escape") {
                setSearch("");
                e.currentTarget.blur();
              }
            }}
            placeholder="Search by patient name or token #..."
            suppressHydrationWarning
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3 pl-10 pr-12 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
          />
          {search ? (
            <button
              type="button"
              onClick={() => {
                setSearch("");
                searchRef.current?.focus();
              }}
              aria-label="Clear search"
              suppressHydrationWarning
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1 text-zinc-500 hover:bg-zinc-800 hover:text-white transition-colors"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          ) : (
            <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded-md border border-zinc-800 bg-zinc-900 px-1.5 py-0.5 text-[10px] font-bold text-zinc-500 sm:block">
              /
            </kbd>
          )}
        </div>

        <div className="relative">
          <ArrowUpDown className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value)}
            aria-label="Sort appointments"
            suppressHydrationWarning
            className="w-full sm:w-auto appearance-none bg-zinc-950/50 border border-zinc-800 rounded-2xl py-3 pl-10 pr-8 text-xs font-bold uppercase tracking-widest text-zinc-300 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all cursor-pointer"
          >
            {SORTS.map((s) => (
              <option key={s.key} value={s.key} className="bg-zinc-950 text-white normal-case tracking-normal">
                {s.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Result line */}
      {appointments.length > 0 && (
        <p className="text-[11px] font-bold uppercase tracking-widest text-zinc-600">
          Showing {shown.length} of {filtered.length}
          {hasFilters ? " (filtered)" : ""}
        </p>
      )}

      {/* List */}
      <div className="space-y-3">
        {shown.map((appt, i) => {
          const isPastDated = new Date(appt.appointmentDate) < todayStart;
          const meta = getMeta(appt.status);
          const isUpNext = appt.id === upNextId;
          const showBooked = now !== null && appt.createdAt && appt.status === "WAITING";

          return (
            <motion.div
              key={appt.id}
              initial={reduceMotion ? false : { opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, delay: Math.min(i, 8) * 0.035 }}
              className={`group relative overflow-hidden rounded-3xl border bg-zinc-950/80 transition-all duration-300 motion-safe:hover:-translate-y-0.5 ${
                isUpNext
                  ? "border-blue-500/40 shadow-[0_0_32px_-12px_rgba(59,130,246,0.6)]"
                  : "border-zinc-800/60 hover:border-zinc-700"
              }`}
            >
              <Glow color={meta.glow} />

              <div className="relative flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
                <Link
                  href={`/dashboard/doctor/appointments/${appt.id}`}
                  className="flex min-w-0 flex-1 items-center gap-4"
                >
                  <div className="h-12 w-12 shrink-0 rounded-2xl border border-zinc-800 bg-zinc-900 flex items-center justify-center font-bold text-blue-500">
                    #{appt.tokenNumber}
                  </div>
                  <div
                    aria-hidden
                    className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-zinc-700 to-zinc-900 text-xs font-black text-zinc-200 sm:flex"
                  >
                    {initials(appt.patient?.name)}
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="font-black uppercase text-sm truncate">{appt.patient?.name || "Patient"}</p>
                      {isUpNext && (
                        <span className="rounded-full border border-blue-500/30 bg-blue-500/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-blue-400">
                          Up next
                        </span>
                      )}
                      {appt.prescription && (
                        <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                          <Pill className="h-2.5 w-2.5" /> Rx
                        </span>
                      )}
                    </div>
                    <p className="truncate text-xs text-zinc-500">
                      {appt.symptoms?.trim() ? appt.symptoms : <span className="italic text-zinc-600">No symptoms noted</span>}
                    </p>
                    {showBooked && (
                      <p className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-zinc-600">
                        <Clock className="h-2.5 w-2.5" /> Booked {timeAgo(appt.createdAt as Date | string, now as number)}
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex shrink-0 items-center justify-between gap-3 sm:justify-end">
                  <div className="text-[11px] font-black text-zinc-500 sm:text-right">
                    {new Date(appt.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                    {" · "}
                    {new Date(appt.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest ${meta.text} ${meta.bg} ${meta.border}`}
                  >
                    <span
                      className={`h-1.5 w-1.5 rounded-full ${meta.dot} ${
                        appt.status === "IN_PROGRESS" ? "motion-safe:animate-pulse" : ""
                      }`}
                    />
                    {meta.label}
                  </span>

                  <div className="flex items-center transition-opacity duration-300 sm:opacity-0 sm:group-hover:opacity-100 sm:focus-within:opacity-100">
                    {isPastDated && appt.status === "WAITING" && (
                      <form action={markInProgress.bind(null, appt.id)}>
                        <button
                          type="submit"
                          title="Move to In Progress"
                          suppressHydrationWarning
                          className="p-2 rounded-xl text-zinc-500 hover:text-blue-500 hover:bg-blue-500/10 transition-colors"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                    {isPastDated && appt.status === "IN_PROGRESS" && (
                      <form action={completeAppointment.bind(null, appt.id)}>
                        <button
                          type="submit"
                          title="Mark as completed"
                          suppressHydrationWarning
                          className="p-2 rounded-xl text-zinc-500 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors"
                        >
                          <CheckCircle2 className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                    {(appt.status === "WAITING" || appt.status === "IN_PROGRESS") && (
                      <form
                        action={cancelAppointment.bind(null, appt.id)}
                        onSubmit={(e) => {
                          if (!window.confirm("Cancel this appointment?")) e.preventDefault();
                        }}
                      >
                        <button
                          type="submit"
                          title="Cancel this appointment"
                          suppressHydrationWarning
                          className="p-2 rounded-xl text-zinc-500 hover:text-red-500 hover:bg-red-500/10 transition-colors"
                        >
                          <XCircle className="h-4 w-4" />
                        </button>
                      </form>
                    )}
                  </div>

                  <Link
                    href={`/dashboard/doctor/appointments/${appt.id}`}
                    className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                    title="View full details"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              </div>
            </motion.div>
          );
        })}

        {remaining > 0 && (
          <div className="flex justify-center pt-2">
            <button
              type="button"
              onClick={() => setVisible((v) => v + PAGE_SIZE)}
              suppressHydrationWarning
              className="rounded-full border border-zinc-800 bg-zinc-900/50 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-400 transition-all duration-300 hover:border-zinc-600 hover:text-white"
            >
              Show more ({remaining} left)
            </button>
          </div>
        )}

        {/* Empty states */}
        {filtered.length === 0 && appointments.length === 0 && (
          <div className="relative overflow-hidden rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-14 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Inbox className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-lg font-bold text-white">{emptyLabel}</p>
            <p className="mx-auto mt-1 max-w-sm text-sm text-zinc-500">{emptyHint.text}</p>
            <Link
              href={`/dashboard/doctor/appointments?view=${emptyHint.href}`}
              scroll={false}
              className="mt-6 inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-[11px] font-black uppercase tracking-widest text-black transition-transform duration-300 motion-safe:hover:scale-105"
            >
              {emptyHint.cta}
              {typeof emptyHint.count === "number" && emptyHint.count > 0 ? ` (${emptyHint.count})` : ""}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </div>
        )}

        {filtered.length === 0 && appointments.length > 0 && (
          <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-12 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Search className="h-5 w-5 text-zinc-500" />
            </div>
            <p className="font-bold text-white">No appointments match your search.</p>
            <p className="mt-1 text-sm text-zinc-500">Try a different name, token number or status.</p>
            <button
              type="button"
              onClick={clearFilters}
              suppressHydrationWarning
              className="mt-5 rounded-full border border-zinc-700 px-5 py-2 text-[11px] font-black uppercase tracking-widest text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
            >
              Clear filters
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
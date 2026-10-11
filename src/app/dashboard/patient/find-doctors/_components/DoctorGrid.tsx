"use client"

import { useState, useMemo, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Search, X, ArrowRight, Clock, Stethoscope, ChevronDown, Check, CalendarDays } from "lucide-react";
import Link from "next/link";

interface DoctorUser {
  name: string | null;
}

interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  fees: number;
  isAvailable: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  updatedAt: Date | string;
  user: DoctorUser;
}

interface SpecOption {
  name: string;
  count: number;
}

// open   = switch on + abhi working hours ke andar
// later  = switch on + aaj ke hours abhi shuru nahi hue
// closed = switch on + aaj ke hours khatam ho gaye
// off    = doctor ne switch band kiya hua hai
type DoctorState = "open" | "later" | "closed" | "off";

interface Entry {
  doctor: Doctor;
  state: DoctorState;
}

const PAGE_SIZE = 12;

const STATE_ORDER: Record<DoctorState, number> = { open: 0, later: 1, closed: 2, off: 3 };

// Gradient palette — har doctor ko naam ke hisaab se ek consistent color milega
const GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-purple-500 to-pink-400",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-amber-400",
  "from-rose-500 to-red-400",
  "from-indigo-500 to-blue-400",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

// "10:00" -> minutes from midnight (600). Galat format ho to null.
function toMinutes(value: string) {
  const match = /^(\d{1,2}):(\d{2})$/.exec(value?.trim() ?? "");
  if (!match) return null;
  const h = Number(match[1]);
  const m = Number(match[2]);
  if (h > 23 || m > 59) return null;
  return h * 60 + m;
}

// Switch + working hours + abhi ka time = ek final status
function getDoctorState(doctor: Doctor, now: Date | null): DoctorState {
  if (!doctor.isAvailable) return "off";
  if (!now) return "open"; // mount se pehle sirf switch dekhte hain

  const s = toMinutes(doctor.workingHoursStart);
  const e = toMinutes(doctor.workingHoursEnd);
  if (s === null || e === null || s === e) return "open"; // hours galat hon to switch pe bharosa

  const current = now.getHours() * 60 + now.getMinutes();
  const crossesMidnight = e < s; // jaise 20:00 se 02:00
  const isOpen = crossesMidnight ? current >= s || current < e : current >= s && current < e;

  if (isOpen) return "open";
  if (crossesMidnight || current < s) return "later";
  return "closed";
}

function getBadge(state: DoctorState, doctor: Doctor) {
  switch (state) {
    case "open":
      return {
        text: "Available now",
        box: "border-emerald-500/30 bg-emerald-500/10 text-emerald-400",
        dot: "bg-emerald-400 motion-safe:animate-pulse",
      };
    case "later":
      return {
        text: `Opens at ${doctor.workingHoursStart}`,
        box: "border-amber-500/30 bg-amber-500/10 text-amber-400",
        dot: "bg-amber-400",
      };
    case "closed":
      return {
        text: "Closed for today",
        box: "border-zinc-700 bg-zinc-800/60 text-zinc-400",
        dot: "bg-zinc-500",
      };
    default:
      return {
        text: "Not available",
        box: "border-red-500/30 bg-red-500/10 text-red-400",
        dot: "bg-red-400",
      };
  }
}

/* ------------------------------------------------------------------ */
/* Specialization popup: search + A-Z list (1000 hone pe bhi chalega)  */
/* ------------------------------------------------------------------ */
function SpecializationModal({
  options,
  totalDoctors,
  active,
  onSelect,
  onClose,
}: {
  options: SpecOption[];
  totalDoctors: number;
  active: string;
  onSelect: (name: string) => void;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");

  // Esc se band + popup khula ho to peeche ka page scroll na ho
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [onClose]);

  const visibleOptions = options.filter((o) => o.name.toLowerCase().includes(query.trim().toLowerCase()));
  const showAllRow = query.trim() === "";

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Choose specialization"
        onClick={(e) => e.stopPropagation()}
        className="flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-3xl border border-zinc-800 bg-zinc-950 sm:max-w-md sm:rounded-3xl"
      >
        <div className="flex items-center justify-between border-b border-zinc-800/60 px-5 py-4">
          <h2 className="text-lg font-black tracking-tight text-white">Choose specialization</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="rounded-xl p-2 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 pt-4">
          <div className="relative">
            <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
            <input
              type="text"
              autoFocus
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search specialization"
              className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 pl-11 pr-4 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5"
            />
          </div>
        </div>

        <div className="flex-1 space-y-1 overflow-y-auto px-3 py-3">
          {showAllRow && (
            <button
              type="button"
              onClick={() => onSelect("All")}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors ${
                active === "All" ? "bg-blue-500/10 text-white" : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <span>All specializations</span>
              <span className="flex items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{totalDoctors}</span>
                {active === "All" && <Check className="h-4 w-4 text-blue-400" />}
              </span>
            </button>
          )}

          {visibleOptions.map((opt) => (
            <button
              key={opt.name}
              type="button"
              onClick={() => onSelect(opt.name)}
              className={`flex w-full items-center justify-between rounded-2xl px-4 py-3 text-left text-sm font-bold transition-colors ${
                active === opt.name ? "bg-blue-500/10 text-white" : "text-zinc-300 hover:bg-zinc-900"
              }`}
            >
              <span className="truncate">{opt.name}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="text-xs font-bold text-zinc-500">{opt.count}</span>
                {active === opt.name && <Check className="h-4 w-4 text-blue-400" />}
              </span>
            </button>
          ))}

          {visibleOptions.length === 0 && (
            <p className="px-4 py-8 text-center text-sm text-zinc-500">No specialization found.</p>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DoctorGrid({ doctors }: { doctors: Doctor[] }) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [activeSpecialization, setActiveSpecialization] = useState("All");
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [visible, setVisible] = useState(PAGE_SIZE);
  // Hydration mismatch se bachne ke liye time mount ke baad hi set hota hai
  const [now, setNow] = useState<Date | null>(null);

  // Live: har 30 sec mein fresh doctors data + abhi ka time. Tab dikh raha ho tabhi.
  useEffect(() => {
    setNow(new Date());

    function refreshNow() {
      if (document.visibilityState === "visible") {
        setNow(new Date());
        router.refresh();
      }
    }

    const id = setInterval(refreshNow, 30000);
    document.addEventListener("visibilitychange", refreshNow);
    return () => {
      clearInterval(id);
      document.removeEventListener("visibilitychange", refreshNow);
    };
  }, [router]);

  // Filter badle to list wapas pehle 12 doctors se shuru
  useEffect(() => {
    setVisible(PAGE_SIZE);
  }, [search, activeSpecialization, onlyAvailable]);

  // Specialization ka naam + us mein kitne doctors hain (A-Z order)
  const specOptions = useMemo<SpecOption[]>(() => {
    const counts = new Map<string, number>();
    doctors.forEach((d) => counts.set(d.specialization, (counts.get(d.specialization) ?? 0) + 1));
    return Array.from(counts.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => a.name.localeCompare(b.name));
  }, [doctors]);

  // Har doctor ka final status (switch + hours + abhi ka time)
  const entries = useMemo<Entry[]>(
    () => doctors.map((doctor) => ({ doctor, state: getDoctorState(doctor, now) })),
    [doctors, now]
  );

  const availableCount = useMemo(() => entries.filter((e) => e.state === "open").length, [entries]);

  const filteredEntries = useMemo(() => {
    const list = entries.filter(({ doctor, state }) => {
      const name = doctor.user?.name || "";
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialization = activeSpecialization === "All" || doctor.specialization === activeSpecialization;
      const matchesAvailability = !onlyAvailable || state === "open";
      return matchesSearch && matchesSpecialization && matchesAvailability;
    });
    // Open pehle, phir "opens later", phir closed, sabse neeche switch-off wale
    return [...list].sort((a, b) => STATE_ORDER[a.state] - STATE_ORDER[b.state]);
  }, [entries, search, activeSpecialization, onlyAvailable]);

  const shownEntries = filteredEntries.slice(0, visible);
  const remaining = filteredEntries.length - shownEntries.length;

  const hasFilters = search.trim() !== "" || activeSpecialization !== "All" || onlyAvailable;
  const specChosen = activeSpecialization !== "All";

  function clearFilters() {
    setSearch("");
    setActiveSpecialization("All");
    setOnlyAvailable(false);
  }

  return (
    <div className="space-y-5">
      {/* Summary line (left) + Available now switch (right) */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="flex items-center gap-2 text-sm text-zinc-500">
          <span className={`h-2 w-2 rounded-full ${availableCount > 0 ? "bg-emerald-500" : "bg-zinc-600"}`} />
          <span>
            <span className={`font-bold ${availableCount > 0 ? "text-emerald-400" : "text-zinc-400"}`}>
              {availableCount}
            </span>{" "}
            of {doctors.length} {doctors.length === 1 ? "doctor" : "doctors"} available now
          </span>
        </p>

        <button
          type="button"
          role="switch"
          aria-checked={onlyAvailable}
          onClick={() => setOnlyAvailable((v) => !v)}
          className="flex items-center gap-2.5 py-1 text-sm font-bold text-zinc-400 transition-colors hover:text-white"
        >
          Available now only
          <span
            className={`relative h-5 w-9 rounded-full transition-colors duration-300 ${
              onlyAvailable ? "bg-emerald-500" : "bg-zinc-700"
            }`}
          >
            <span
              className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all duration-300 ${
                onlyAvailable ? "left-[1.1rem]" : "left-0.5"
              }`}
            />
          </span>
        </button>
      </div>

      {/* Search bar + Specialization button (ek hi row mein) */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name or specialization"
            className="w-full rounded-2xl border border-zinc-800 bg-zinc-900/50 py-3 pl-11 pr-11 text-sm text-white outline-none transition-all placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5"
          />
          {search && (
            <button
              type="button"
              onClick={() => setSearch("")}
              aria-label="Clear search"
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-white"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <button
          type="button"
          onClick={() => setModalOpen(true)}
          aria-haspopup="dialog"
          className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-3 text-sm font-bold transition-all duration-300 sm:min-w-56 sm:max-w-64 ${
            specChosen
              ? "border-blue-500/40 bg-blue-500/10 text-white"
              : "border-zinc-800 bg-zinc-900/50 text-zinc-300 hover:border-zinc-600"
          }`}
        >
          <span className="flex min-w-0 items-center gap-2">
            <Stethoscope className="h-4 w-4 shrink-0 text-blue-400" />
            <span className="truncate">{specChosen ? activeSpecialization : "All specializations"}</span>
          </span>
          <ChevronDown className="h-4 w-4 shrink-0 text-zinc-500" />
        </button>
      </div>

      {modalOpen && (
        <SpecializationModal
          options={specOptions}
          totalDoctors={doctors.length}
          active={activeSpecialization}
          onSelect={(name) => {
            setActiveSpecialization(name);
            setModalOpen(false);
          }}
          onClose={() => setModalOpen(false)}
        />
      )}

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {shownEntries.length > 0 ? (
          shownEntries.map(({ doctor, state }) => {
            const name = doctor.user?.name || "Specialist";
            const initials = getInitials(name);
            const gradient = getGradient(name);
            const badge = getBadge(state, doctor);
            const bookable = state !== "off";

            return (
              <div
                key={doctor.id}
                className={`group flex flex-col gap-5 rounded-3xl border bg-zinc-950/80 p-6 transition-all duration-300 ${
                  bookable
                    ? `border-zinc-800/60 hover:border-blue-500/40 motion-safe:hover:-translate-y-1 ${
                        state === "closed" ? "opacity-80" : ""
                      }`
                    : "border-zinc-800/40 opacity-70"
                }`}
              >
                {/* Avatar + status */}
                <div className="flex items-start justify-between gap-3">
                  <div
                    className={`relative flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br ${gradient}`}
                  >
                    <span className="text-lg font-black tracking-tight text-white">{initials}</span>
                    {state === "open" && (
                      <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 rounded-full border-2 border-zinc-950 bg-emerald-400" />
                    )}
                  </div>

                  <span
                    className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold ${badge.box}`}
                  >
                    <span className={`h-1.5 w-1.5 rounded-full ${badge.dot}`} />
                    {badge.text}
                  </span>
                </div>

                {/* Name + specialization */}
                <div className="space-y-1">
                  <h3 className="text-xl font-black tracking-tight text-white">Dr. {name}</h3>
                  <p className="text-sm font-bold text-zinc-500">{doctor.specialization}</p>
                </div>

                {/* Fee + timings */}
                <div className="grid grid-cols-2 gap-4 border-y border-zinc-800/50 py-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600">Fee</p>
                    <p className="text-base font-bold text-zinc-100">₹{doctor.fees.toLocaleString("en-IN")}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-zinc-600">Timings</p>
                    <p className="flex items-center gap-1.5 text-base font-bold text-zinc-100">
                      <Clock className="h-4 w-4 shrink-0 text-orange-500" />
                      <span suppressHydrationWarning>
                        {state !== "off"
                          ? `${doctor.workingHoursStart} - ${doctor.workingHoursEnd}`
                          : `Offline since ${new Date(doctor.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                      </span>
                    </p>
                  </div>
                </div>

                {/* Action Button */}
                {state === "open" || state === "later" ? (
                  <Link
                    href={`/dashboard/patient/book/${doctor.id}`}
                    className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-2xl bg-white text-base font-bold text-black transition-all duration-300 hover:bg-blue-600 hover:text-white active:scale-95"
                  >
                    Book appointment
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
                  </Link>
                ) : state === "closed" ? (
                  <Link
                    href={`/dashboard/patient/book/${doctor.id}`}
                    className="mt-auto flex h-12 w-full items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 text-base font-bold text-zinc-200 transition-all duration-300 hover:border-blue-500/50 hover:text-white active:scale-95"
                  >
                    <CalendarDays className="h-4 w-4" />
                    Book for another day
                  </Link>
                ) : (
                  <div className="mt-auto flex h-12 w-full cursor-not-allowed items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900 text-base font-bold text-zinc-600">
                    Not available right now
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="col-span-full rounded-3xl border border-dashed border-zinc-800 bg-zinc-950/60 px-6 py-16 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-zinc-800 bg-zinc-900">
              <Stethoscope className="h-6 w-6 text-zinc-500" />
            </div>
            <p className="text-lg font-bold text-white">
              {doctors.length === 0 ? "No doctors are available yet." : "No doctors match your search."}
            </p>
            <p className="mt-1 text-sm text-zinc-500">
              {doctors.length === 0
                ? "Please check again in a little while."
                : "Try a different name or specialization."}
            </p>
            {hasFilters && doctors.length > 0 && (
              <button
                type="button"
                onClick={clearFilters}
                className="mt-5 rounded-full border border-zinc-700 px-5 py-2 text-sm font-bold text-zinc-300 transition-colors hover:border-zinc-500 hover:text-white"
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      {/* Show more */}
      {remaining > 0 && (
        <div className="flex justify-center pt-2">
          <button
            type="button"
            onClick={() => setVisible((v) => v + PAGE_SIZE)}
            className="rounded-full border border-zinc-800 bg-zinc-900/50 px-6 py-2.5 text-sm font-bold text-zinc-300 transition-all duration-300 hover:border-zinc-600 hover:text-white"
          >
            Show more doctors ({remaining} left)
          </button>
        </div>
      )}
    </div>
  );
}
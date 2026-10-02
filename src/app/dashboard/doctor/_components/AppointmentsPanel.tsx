"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { Search, XCircle, CheckCircle2, PlayCircle, ChevronRight, Pill } from "lucide-react";
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
  patient: Patient | null;
  prescription: Prescription | null;
}

const STATUS_FILTERS = ["All", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function statusLabel(status: string) {
  if (status === "All") return "All";
  return status.replace("_", " ");
}

export default function AppointmentsPanel({
  appointments,
  emptyLabel,
}: {
  appointments: Appointment[];
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");

  const filtered = useMemo(() => {
    return appointments.filter((appt) => {
      const name = appt.patient?.name || "";
      const matchesSearch =
        search.trim() === "" ||
        name.toLowerCase().includes(search.toLowerCase()) ||
        String(appt.tokenNumber).includes(search.trim());
      const matchesStatus = statusFilter === "All" || appt.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [appointments, search, statusFilter]);

  const todayStart = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by patient name or token #..."
            suppressHydrationWarning
            className="w-full bg-zinc-950/50 border border-zinc-800 rounded-xl py-2.5 pl-10 pr-4 text-xs text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((status) => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              suppressHydrationWarning
              className={`px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest transition-all duration-300 ${
                statusFilter === status
                  ? "bg-white text-black"
                  : "bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:border-zinc-600"
              }`}
            >
              {statusLabel(status)}
            </button>
          ))}
        </div>
      </div>

      <div className="space-y-3">
        {filtered.map((appt) => {
          const isPastDated = new Date(appt.appointmentDate) < todayStart;
          return (
            <div
              key={appt.id}
              className="flex items-center justify-between p-4 bg-zinc-900/50 rounded-3xl border border-zinc-800/50 transition-all duration-300 hover:bg-zinc-800/60 hover:border-zinc-700"
            >
              <Link
                href={`/dashboard/doctor/appointments/${appt.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className="h-12 w-12 bg-zinc-800 rounded-2xl flex items-center justify-center font-bold text-blue-500 shrink-0">
                  #{appt.tokenNumber}
                </div>
                <div className="min-w-0">
                  <p className="font-black uppercase text-sm truncate">{appt.patient?.name || "Patient"}</p>
                  <div className="flex items-center gap-2">
                    <p className="text-[10px] text-zinc-500 font-bold uppercase">{appt.status}</p>
                    {appt.prescription && (
                      <span className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                        <Pill className="h-2.5 w-2.5" /> Rx
                      </span>
                    )}
                  </div>
                </div>
              </Link>

              <div className="flex items-center gap-3 text-right shrink-0">
                <div className="text-[10px] font-black text-zinc-700 hidden sm:block">
                  {new Date(appt.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                  {" · "}
                  {new Date(appt.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                {isPastDated && appt.status === "WAITING" && (
                  <form action={markInProgress.bind(null, appt.id)}>
                    <button type="submit" title="Move to In Progress" suppressHydrationWarning
                      className="p-2 rounded-xl text-zinc-600 hover:text-blue-500 hover:bg-blue-500/10 transition-colors">
                      <PlayCircle className="h-4 w-4" />
                    </button>
                  </form>
                )}
                {isPastDated && appt.status === "IN_PROGRESS" && (
                  <form action={completeAppointment.bind(null, appt.id)}>
                    <button type="submit" title="Mark as completed" suppressHydrationWarning
                      className="p-2 rounded-xl text-zinc-600 hover:text-emerald-500 hover:bg-emerald-500/10 transition-colors">
                      <CheckCircle2 className="h-4 w-4" />
                    </button>
                  </form>
                )}
                {(appt.status === "WAITING" || appt.status === "IN_PROGRESS") && (
                  <form action={cancelAppointment.bind(null, appt.id)}>
                    <button type="submit" title="Cancel this appointment" suppressHydrationWarning
                      className="p-2 rounded-xl text-zinc-600 hover:text-red-500 hover:bg-red-500/10 transition-colors">
                      <XCircle className="h-4 w-4" />
                    </button>
                  </form>
                )}
                <Link
                  href={`/dashboard/doctor/appointments/${appt.id}`}
                  className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="View full details"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </div>
          );
        })}
        {filtered.length === 0 && (
          <p className="text-zinc-600 italic text-center py-10">
            {appointments.length === 0 ? emptyLabel : "No appointments match your search."}
          </p>
        )}
      </div>
    </div>
  );
}
"use client"

import { useState, useMemo } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Calendar, Stethoscope, Search, CalendarDays, X, Pill, ChevronRight } from "lucide-react";
import CancelBookingButton from "./CancelBookingButton";

interface Doctor {
  specialization: string;
  user: { name: string | null } | null;
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
  doctor: Doctor | null;
  prescription: Prescription | null;
}

const STATUS_FILTERS = ["All", "WAITING", "IN_PROGRESS", "COMPLETED", "CANCELLED"];

function statusLabel(status: string) {
  if (status === "All") return "All";
  return status.replace("_", " ");
}

function statusStyle(status: string) {
  switch (status) {
    case "WAITING":
      return "bg-orange-500/10 text-orange-400 border-orange-500/20";
    case "IN_PROGRESS":
      return "bg-blue-500/10 text-blue-400 border-blue-500/20";
    case "COMPLETED":
      return "bg-emerald-500/10 text-emerald-400 border-emerald-500/20";
    case "CANCELLED":
      return "bg-red-500/10 text-red-400 border-red-500/20";
    default:
      return "bg-zinc-500/10 text-zinc-400 border-zinc-500/20";
  }
}

export default function HistoryList({
  appointments,
  emptyLabel,
}: {
  appointments: Appointment[];
  emptyLabel: string;
}) {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [exactDate, setExactDate] = useState("");

  const filtered = useMemo(() => {
    return appointments.filter((appt) => {
      const doctorName = appt.doctor?.user?.name || "";
      const specialization = appt.doctor?.specialization || "";
      const matchesSearch =
        search.trim() === "" ||
        doctorName.toLowerCase().includes(search.toLowerCase()) ||
        specialization.toLowerCase().includes(search.toLowerCase()) ||
        String(appt.tokenNumber).includes(search.trim());

      const matchesStatus = statusFilter === "All" || appt.status === statusFilter;

      const matchesDate =
        !exactDate ||
        (() => {
          const d = new Date(appt.appointmentDate);
          const y = d.getFullYear();
          const m = String(d.getMonth() + 1).padStart(2, "0");
          const day = String(d.getDate()).padStart(2, "0");
          return `${y}-${m}-${day}` === exactDate;
        })();

      return matchesSearch && matchesStatus && matchesDate;
    });
  }, [appointments, search, statusFilter, exactDate]);

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        <div className="relative md:col-span-2">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by doctor name, specialization or token #..."
            suppressHydrationWarning
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
          />
        </div>
        <div className="relative">
          <CalendarDays className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600 pointer-events-none" />
          <input
            type="date"
            value={exactDate}
            onChange={(e) => setExactDate(e.target.value)}
            suppressHydrationWarning
            className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-3.5 pl-11 pr-10 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all [color-scheme:dark]"
          />
          {exactDate && (
            <button
              type="button"
              onClick={() => setExactDate("")}
              title="Clear date filter"
              suppressHydrationWarning
              className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-600 hover:text-white transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {STATUS_FILTERS.map((status) => (
          <button
            key={status}
            onClick={() => setStatusFilter(status)}
            suppressHydrationWarning
            className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              statusFilter === status
                ? "bg-white text-black"
                : "bg-zinc-900/50 border border-zinc-800 text-zinc-500 hover:border-zinc-600"
            }`}
          >
            {statusLabel(status)}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filtered.length === 0 && (
          <div className="h-40 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50">
            <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest italic px-4 text-center">
              {appointments.length === 0 ? emptyLabel : "No appointments match your filters."}
            </p>
          </div>
        )}

        {filtered.map((appt) => (
          <Card key={appt.id} className="bg-zinc-900/40 border-zinc-800 rounded-3xl overflow-hidden">
            <CardContent className="p-6 flex flex-col md:flex-row md:items-center gap-4 justify-between">
              <Link
                href={`/dashboard/patient/history/${appt.id}`}
                className="flex items-center gap-4 flex-1 min-w-0"
              >
                <div className="h-11 w-11 bg-zinc-800 rounded-xl flex items-center justify-center font-black text-blue-500 text-sm shrink-0">
                  #{appt.tokenNumber}
                </div>
                <div className="space-y-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Stethoscope className="h-4 w-4 text-zinc-500 shrink-0" />
                    <p className="font-black uppercase text-sm text-white truncate">
                      Dr. {appt.doctor?.user?.name || "Unknown"}
                    </p>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase shrink-0">
                      {appt.doctor?.specialization}
                    </span>
                  </div>
                  {appt.prescription && (
                    <p className="flex items-center gap-1 text-[10px] text-emerald-500 font-bold uppercase">
                      <Pill className="h-2.5 w-2.5" /> Prescription available
                    </p>
                  )}
                </div>
              </Link>

              <div className="flex items-center gap-3 shrink-0" onClick={(e) => e.stopPropagation()}>
                <div className="flex items-center gap-2 text-[10px] text-zinc-600 font-bold uppercase">
                  <Calendar className="h-3.5 w-3.5" />
                  {new Date(appt.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })} · {new Date(appt.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                </div>
                <span
                  className={`text-[10px] font-black uppercase tracking-widest px-3 py-1.5 rounded-full border ${statusStyle(appt.status)}`}
                >
                  {appt.status.replace("_", " ")}
                </span>
                {appt.status === "WAITING" && <CancelBookingButton appointmentId={appt.id} />}
                <Link
                  href={`/dashboard/patient/history/${appt.id}`}
                  className="p-2 rounded-xl text-zinc-600 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="View full details"
                >
                  <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
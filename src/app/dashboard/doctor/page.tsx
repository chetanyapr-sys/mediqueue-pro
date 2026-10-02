import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import {
  User,
  Calendar,
  Clock,
  CheckCircle,
  ChevronRight,
  ArrowUpRight,
  Activity,
  PlayCircle,
  XCircle,
} from "lucide-react";
import { callNextPatient, completeAppointment, cancelAppointment, markInProgress } from "@/actions/appointment";
import { toggleAvailability } from "@/actions/doctor";
import Link from "next/link";
import SubmitButton from "./_components/SubmitButton";
import LiveRefresh from "./_components/LiveRefresh";
import Hotkeys from "./_components/Hotkeys";

export const dynamic = "force-dynamic";

const STATUS_STYLES: Record<string, string> = {
  WAITING: "bg-amber-500/10 text-amber-400 border-amber-500/20",
  IN_PROGRESS: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  COMPLETED: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  CANCELLED: "bg-zinc-500/10 text-zinc-400 border-zinc-500/20",
};

const CIRCUMFERENCE = 2 * Math.PI * 42;

// Card ke upar hover pe halka rang-birangi glow aata hai
function Glow({ rgb }: { rgb: string }) {
  return (
    <>
      <div
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `radial-gradient(420px circle at 50% -10%, rgba(${rgb},0.14), transparent 70%)` }}
      />
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-px opacity-0 transition-opacity duration-500 group-hover:opacity-100"
        style={{ background: `linear-gradient(90deg, transparent, rgba(${rgb},0.8), transparent)` }}
      />
    </>
  );
}

export default async function DoctorDashboard() {
  const user = await currentUser();
  if (!user) redirect("/");

  const doctor = await db.doctor.findUnique({
    where: { userId: user.id },
    include: { user: true }
  });

  if (!doctor) redirect("/dashboard/doctor/onboarding");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);
  const weekStart = new Date(todayStart);
  weekStart.setDate(weekStart.getDate() - 6);

  const [totalPatients, completed, todayAppointments, weekAppointments] = await Promise.all([
    db.appointment.count({ where: { doctorId: user.id } }),
    db.appointment.count({ where: { doctorId: user.id, status: "COMPLETED" } }),
    db.appointment.findMany({
      where: { doctorId: user.id, appointmentDate: { gte: todayStart, lt: todayEnd } },
      orderBy: [{ appointmentDate: "asc" }, { tokenNumber: "asc" }],
      include: { patient: true }
    }),
    db.appointment.findMany({
      where: {
        doctorId: user.id,
        status: { not: "CANCELLED" },
        appointmentDate: { gte: weekStart, lt: todayEnd }
      },
      select: { appointmentDate: true }
    }),
  ]);

  // Aaj ka breakdown
  const active = todayAppointments.filter((a) => a.status !== "CANCELLED");
  const waiting = active
    .filter((a) => a.status === "WAITING")
    .sort((a, b) => a.tokenNumber - b.tokenNumber);
  const nowServing = active.find((a) => a.status === "IN_PROGRESS") ?? null;
  const completedToday = active.filter((a) => a.status === "COMPLETED").length;
  const cancelledToday = todayAppointments.length - active.length;
  const inQueue = waiting.length;
  const upNext = waiting.slice(0, 3);

  const progressPct = active.length ? Math.round((completedToday / active.length) * 100) : 0;
  const capacityPct =
    doctor.maxPatientsPerDay > 0
      ? Math.min(100, Math.round((active.length / doctor.maxPatientsPerDay) * 100))
      : 0;

  // Pichhle 7 din ka chart
  const keyOf = (d: Date) => `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  const dayCounts: Record<string, number> = {};
  weekAppointments.forEach((a) => {
    const k = keyOf(new Date(a.appointmentDate));
    dayCounts[k] = (dayCounts[k] || 0) + 1;
  });
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(weekStart);
    d.setDate(weekStart.getDate() + i);
    return {
      label: d.toLocaleDateString("en-US", { weekday: "short" }),
      count: dayCounts[keyOf(d)] ?? 0,
      isToday: i === 6,
    };
  });
  const weekMax = Math.max(1, ...week.map((w) => w.count));
  const weekTotal = week.reduce((sum, w) => sum + w.count, 0);

  const todayLabel = new Date().toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const stats = [
    {
      title: "Total patients",
      value: totalPatients,
      icon: User,
      tint: "bg-blue-500/10 text-blue-400",
      rgb: "59,130,246",
      note: "All-time bookings",
    },
    {
      title: "Today's appointments",
      value: active.length,
      icon: Calendar,
      tint: "bg-purple-500/10 text-purple-400",
      rgb: "168,85,247",
      note: `${capacityPct}% of daily limit`,
      bar: capacityPct,
      barClass: "bg-purple-500",
    },
    {
      title: "In queue",
      value: inQueue,
      icon: Clock,
      tint: "bg-orange-500/10 text-orange-400",
      rgb: "249,115,22",
      note: inQueue === 0 ? "No one is waiting" : "Waiting to be called",
    },
    {
      title: "Completed",
      value: completed,
      icon: CheckCircle,
      tint: "bg-emerald-500/10 text-emerald-400",
      rgb: "16,185,129",
      note: `${completedToday} finished today`,
    },
  ];

  return (
    <div className="mx-auto w-full max-w-7xl space-y-6 px-4 py-6 text-white sm:px-6 md:py-10 lg:px-10">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-sm text-zinc-500">{todayLabel}</p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight">Dashboard</h1>
          <p className="mt-1 text-base text-zinc-400">Welcome back, Dr. {doctor.user.name}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {doctor.specialization && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
                {doctor.specialization}
              </span>
            )}
            {doctor.workingHoursStart && doctor.workingHoursEnd && (
              <span className="rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs text-zinc-300">
                {doctor.workingHoursStart} to {doctor.workingHoursEnd}
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <LiveRefresh waitingCount={inQueue} />
          <form action={toggleAvailability.bind(null, user.id, doctor.isAvailable)}>
            <button
              type="submit"
              title="Click to toggle your availability"
              suppressHydrationWarning
              className={`group flex items-center gap-3 rounded-full border px-4 py-2 text-sm font-medium transition-all duration-300 motion-safe:hover:-translate-y-0.5 ${
                doctor.isAvailable
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 hover:border-emerald-500/40 hover:bg-emerald-500/20 hover:shadow-[0_8px_30px_-10px_rgba(16,185,129,0.5)]"
                  : "border-red-500/20 bg-red-500/10 text-red-400 hover:border-red-500/40 hover:bg-red-500/20 hover:shadow-[0_8px_30px_-10px_rgba(239,68,68,0.5)]"
              }`}
            >
              <span className="relative flex h-2.5 w-2.5">
                <span
                  className={`absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping ${
                    doctor.isAvailable ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
                <span
                  className={`relative inline-flex h-2.5 w-2.5 rounded-full ${
                    doctor.isAvailable ? "bg-emerald-500" : "bg-red-500"
                  }`}
                />
              </span>
              {doctor.isAvailable ? "Available for patients" : "Offline"}
              <span className="text-xs font-normal text-zinc-400 transition-colors group-hover:text-zinc-200">
                {doctor.isAvailable ? "Click to go offline" : "Click to go online"}
              </span>
            </button>
          </form>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {stats.map((s) => (
          <div
            key={s.title}
            className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-5 transition-all duration-300 hover:border-zinc-700 motion-safe:hover:-translate-y-1"
          >
            <Glow rgb={s.rgb} />
            <div className="relative flex items-center justify-between gap-2">
              <span className="text-sm text-zinc-400">{s.title}</span>
              <span
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 motion-safe:group-hover:scale-110 motion-safe:group-hover:-rotate-6 ${s.tint}`}
              >
                <s.icon className="h-5 w-5" />
              </span>
            </div>
            <div className="relative mt-4 text-4xl font-semibold tabular-nums">{s.value}</div>
            <p className="relative mt-1 text-xs text-zinc-500">{s.note}</p>
            {s.bar !== undefined && (
              <div className="relative mt-3 h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div
                  className={`h-full rounded-full transition-all duration-700 ${s.barClass}`}
                  style={{ width: `${s.bar}%` }}
                />
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Live queue + Schedule */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="group relative flex flex-col overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition-all duration-300 hover:border-zinc-700">
          <Glow rgb={nowServing ? "16,185,129" : "59,130,246"} />

          <div className="relative flex items-center justify-between">
            <h2 className="text-lg font-semibold">Live queue</h2>
            <span
              className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${
                nowServing
                  ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400"
                  : "border-zinc-700 bg-zinc-900 text-zinc-400"
              }`}
            >
              {nowServing ? "Now serving" : "Waiting for next"}
            </span>
          </div>

          <div className="relative flex flex-col items-center gap-3 py-6 text-center">
            <div className="relative flex h-36 w-36 items-center justify-center">
              <span
                className={`absolute inset-0 rounded-full border ${
                  nowServing ? "border-emerald-500/30 motion-safe:animate-ping" : "border-zinc-800"
                }`}
              />
              <span
                className={`absolute inset-2 rounded-full border ${
                  nowServing ? "border-emerald-500/40" : "border-zinc-800"
                }`}
              />
              <span className="text-5xl font-semibold tabular-nums">
                {nowServing ? `#${nowServing.tokenNumber}` : inQueue}
              </span>
            </div>

            {nowServing ? (
              <>
                <p className="text-base font-medium text-zinc-200">{nowServing.patient?.name || "Patient"}</p>
                {nowServing.symptoms && (
                  <p className="line-clamp-2 max-w-xs text-sm text-zinc-500">{nowServing.symptoms}</p>
                )}
                <div className="flex w-full gap-3 pt-2">
                  <form id="complete-form" action={completeAppointment.bind(null, nowServing.id)} className="flex-1">
                    <SubmitButton
                      pendingLabel="Saving"
                      className="flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-emerald-400 hover:shadow-[0_10px_30px_-10px_rgba(16,185,129,0.8)] motion-safe:hover:-translate-y-0.5 disabled:opacity-70"
                    >
                      Mark as completed
                      <kbd className="hidden rounded border border-black/20 px-1.5 text-[11px] font-medium md:inline-block">C</kbd>
                    </SubmitButton>
                  </form>
                  <form action={cancelAppointment.bind(null, nowServing.id)} className="flex-1">
                    <SubmitButton
                      title="Cancel this appointment"
                      confirm="Cancel this appointment? It will be marked as cancelled."
                      pendingLabel="Cancelling"
                      className="w-full rounded-xl border border-zinc-800 bg-zinc-900 px-4 py-3 text-sm font-medium text-zinc-300 transition-all duration-300 hover:border-red-500/40 hover:bg-red-500/10 hover:text-red-400 disabled:opacity-70"
                    >
                      Cancel
                    </SubmitButton>
                  </form>
                </div>
              </>
            ) : (
              <>
                <p className="text-sm text-zinc-400">{inQueue === 1 ? "patient waiting" : "patients waiting"}</p>
                <form id={inQueue > 0 ? "call-next-form" : undefined} action={callNextPatient.bind(null, user.id)}>
                  <SubmitButton
                    disabled={inQueue === 0}
                    pendingLabel="Calling"
                    className="group/btn relative overflow-hidden rounded-xl bg-white px-6 py-3 text-sm font-semibold text-black transition-all duration-300 hover:bg-blue-500 hover:text-white hover:shadow-[0_10px_30px_-10px_rgba(59,130,246,0.8)] motion-safe:hover:-translate-y-0.5 disabled:pointer-events-none disabled:opacity-40"
                  >
                    <span className="pointer-events-none absolute inset-y-0 -left-full w-1/2 skew-x-[-20deg] bg-white/40 transition-all duration-700 group-hover/btn:left-[150%]" />
                    <span className="relative flex items-center gap-2">
                      Call next patient
                      <kbd className="hidden rounded border border-current/30 px-1.5 text-[11px] font-medium opacity-60 md:inline-block">N</kbd>
                    </span>
                  </SubmitButton>
                </form>
              </>
            )}
          </div>

          <div className="relative mt-auto border-t border-zinc-800 pt-4">
            <p className="text-xs font-medium text-zinc-500">Up next</p>
            <div className="mt-3 space-y-2">
              {upNext.map((a) => (
                <div
                  key={a.id}
                  className="group/up flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/40 px-3 py-2 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-zinc-800 text-xs font-semibold text-amber-400">
                    #{a.tokenNumber}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-zinc-200">{a.patient?.name || "Patient"}</p>
                    {a.symptoms && <p className="truncate text-xs text-zinc-500">{a.symptoms}</p>}
                  </div>
                  <div className="flex shrink-0 items-center gap-1 transition-all duration-300 [@media(hover:hover)]:translate-x-1 [@media(hover:hover)]:opacity-0 [@media(hover:hover)]:group-hover/up:translate-x-0 [@media(hover:hover)]:group-hover/up:opacity-100 [@media(hover:hover)]:group-focus-within/up:translate-x-0 [@media(hover:hover)]:group-focus-within/up:opacity-100">
                    {!nowServing && (
                      <form action={markInProgress.bind(null, a.id)}>
                        <SubmitButton
                          title="Call this patient now"
                          className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-emerald-500/10 hover:text-emerald-400 disabled:opacity-60"
                        >
                          <PlayCircle className="h-4 w-4" />
                        </SubmitButton>
                      </form>
                    )}
                    <form action={cancelAppointment.bind(null, a.id)}>
                      <SubmitButton
                        title="Remove from queue"
                        confirm="Remove this patient from the queue? Their booking will be marked as cancelled."
                        className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-red-500/10 hover:text-red-400 disabled:opacity-60"
                      >
                        <XCircle className="h-4 w-4" />
                      </SubmitButton>
                    </form>
                  </div>
                </div>
              ))}
              {upNext.length === 0 && <p className="text-sm text-zinc-600">The queue is clear.</p>}
              {inQueue > upNext.length && (
                <Link
                  href="/dashboard/doctor/appointments"
                  className="block pt-1 text-sm text-blue-400 transition-colors hover:text-blue-300"
                >
                  +{inQueue - upNext.length} more waiting
                </Link>
              )}
            </div>
          </div>
        </section>

        <section className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition-all duration-300 hover:border-zinc-700 lg:col-span-2">
          <Glow rgb="59,130,246" />

          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Today&apos;s appointments</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {active.length} booked{cancelledToday > 0 ? `, ${cancelledToday} cancelled` : ""}
              </p>
            </div>
            <Link
              href="/dashboard/doctor/appointments"
              className="group/link inline-flex items-center gap-1 text-sm font-medium text-blue-400 transition-colors hover:text-blue-300"
            >
              View all
              <ArrowUpRight className="h-4 w-4 transition-transform duration-300 group-hover/link:-translate-y-0.5 group-hover/link:translate-x-0.5" />
            </Link>
          </div>

          <div className="relative mt-5 space-y-3">
            {todayAppointments.slice(0, 6).map((appt) => (
              <Link
                key={appt.id}
                href={`/dashboard/doctor/appointments/${appt.id}`}
                className="group/row relative flex items-center justify-between gap-3 overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-900/40 p-4 pl-5 transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900 motion-safe:hover:translate-x-1"
              >
                <span className="absolute bottom-3 left-0 top-3 w-1 origin-center scale-y-0 rounded-full bg-blue-500 transition-transform duration-300 group-hover/row:scale-y-100" />
                <div className="flex min-w-0 items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-zinc-800 text-sm font-semibold text-blue-400 transition-colors group-hover/row:bg-blue-500/15">
                    #{appt.tokenNumber}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-base font-medium">{appt.patient?.name || "Patient"}</p>
                    {appt.symptoms && <p className="truncate text-xs text-zinc-500">{appt.symptoms}</p>}
                  </div>
                </div>
                <div className="flex shrink-0 items-center gap-3">
                  <span
                    className={`hidden rounded-full border px-2.5 py-0.5 text-xs font-medium capitalize sm:inline-block ${
                      STATUS_STYLES[appt.status] ?? "bg-zinc-500/10 text-zinc-400 border-zinc-500/20"
                    }`}
                  >
                    {appt.status.replace("_", " ").toLowerCase()}
                  </span>
                  <span className="text-sm tabular-nums text-zinc-400">
                    {new Date(appt.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
                  </span>
                  <ChevronRight className="h-4 w-4 -translate-x-1 text-zinc-600 opacity-0 transition-all duration-300 group-hover/row:translate-x-0 group-hover/row:opacity-100" />
                </div>
              </Link>
            ))}

            {todayAppointments.length > 6 && (
              <p className="pt-1 text-center text-sm text-zinc-500">
                +{todayAppointments.length - 6} more today
              </p>
            )}

            {todayAppointments.length === 0 && (
              <div className="flex flex-col items-center py-12 text-center">
                <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
                  <Calendar className="h-6 w-6" />
                </span>
                <p className="mt-4 text-base font-medium text-zinc-300">No appointments today</p>
                <p className="mt-1 text-sm text-zinc-500">New bookings for today will show up here.</p>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* Weekly chart + Progress */}
      <div className="grid gap-6 lg:grid-cols-3">
        <section className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition-all duration-300 hover:border-zinc-700 lg:col-span-2">
          <Glow rgb="99,102,241" />
          <div className="relative flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">Last 7 days</h2>
              <p className="mt-0.5 text-sm text-zinc-500">
                {weekTotal} {weekTotal === 1 ? "appointment" : "appointments"} this week
              </p>
            </div>
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
              <Activity className="h-5 w-5" />
            </span>
          </div>

          {weekTotal === 0 ? (
            <div className="relative flex h-40 flex-col items-center justify-center text-center">
              <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-zinc-900 text-zinc-500">
                <Activity className="h-6 w-6" />
              </span>
              <p className="mt-3 text-base font-medium text-zinc-300">No bookings this week yet</p>
              <p className="mt-1 text-sm text-zinc-500">Your daily trend will appear here once patients start booking.</p>
            </div>
          ) : (
            <div className="relative mt-6 flex h-48 items-end gap-3">
              {week.map((w, i) => (
                <div key={i} className="group/bar flex flex-1 flex-col items-center justify-end gap-2">
                  <span
                    className={`text-xs tabular-nums transition-colors ${
                      w.isToday ? "text-blue-400" : "text-zinc-500 group-hover/bar:text-zinc-200"
                    }`}
                  >
                    {w.count}
                  </span>
                  <div
                    className={`w-full rounded-t-xl transition-all duration-300 ${
                      w.isToday
                        ? "bg-gradient-to-t from-blue-600 to-cyan-400 group-hover/bar:brightness-125"
                        : "bg-zinc-800 group-hover/bar:bg-indigo-500/70"
                    }`}
                    style={{ height: `${Math.max(6, Math.round((w.count / weekMax) * 140))}px` }}
                  />
                  <span className={`text-xs ${w.isToday ? "font-medium text-white" : "text-zinc-500"}`}>
                    {w.isToday ? "Today" : w.label}
                  </span>
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="group relative overflow-hidden rounded-3xl border border-zinc-800 bg-zinc-950/80 p-6 transition-all duration-300 hover:border-zinc-700">
          <Glow rgb="16,185,129" />
          <h2 className="relative text-lg font-semibold">Today&apos;s progress</h2>

          <div className="relative mt-5 flex items-center gap-5">
            <div className="relative h-32 w-32 shrink-0">
              <svg viewBox="0 0 100 100" className="h-full w-full -rotate-90">
                <circle cx="50" cy="50" r="42" fill="none" strokeWidth="10" className="stroke-zinc-800" />
                {progressPct > 0 && (
                  <circle
                    cx="50"
                    cy="50"
                    r="42"
                    fill="none"
                    strokeWidth="10"
                    strokeLinecap="round"
                    className="stroke-emerald-500 transition-all duration-700"
                    strokeDasharray={`${(progressPct / 100) * CIRCUMFERENCE} ${CIRCUMFERENCE}`}
                  />
                )}
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-2xl font-semibold tabular-nums">{progressPct}%</span>
                <span className="text-xs text-zinc-500">done</span>
              </div>
            </div>

            <ul className="min-w-0 flex-1 space-y-2.5 text-sm">
              {[
                { label: "Completed", value: completedToday, dot: "bg-emerald-500" },
                { label: "In progress", value: nowServing ? 1 : 0, dot: "bg-blue-500" },
                { label: "Waiting", value: inQueue, dot: "bg-amber-500" },
                { label: "Cancelled", value: cancelledToday, dot: "bg-zinc-600" },
              ].map((row) => (
                <li key={row.label} className="flex items-center justify-between gap-2">
                  <span className="flex items-center gap-2 text-zinc-400">
                    <span className={`h-2 w-2 rounded-full ${row.dot}`} />
                    {row.label}
                  </span>
                  <span className="tabular-nums text-zinc-200">{row.value}</span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      <Hotkeys />
    </div>
  );
}
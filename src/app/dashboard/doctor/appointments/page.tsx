import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { CalendarDays } from "lucide-react";
import AppointmentsPanel, { LiveBadge, ViewTabs } from "../_components/AppointmentsPanel";

export const dynamic = "force-dynamic";

type ViewType = "today" | "upcoming" | "past";

export default async function DoctorAppointmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const doctor = await db.doctor.findUnique({ where: { userId: user.id } });
  if (!doctor) redirect("/dashboard/doctor/onboarding");

  const { view: rawView } = await searchParams;
  const view: ViewType = rawView === "upcoming" || rawView === "past" ? rawView : "today";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const dateFilter =
    view === "today"
      ? { gte: todayStart, lt: todayEnd }
      : view === "upcoming"
      ? { gte: todayEnd }
      : { lt: todayStart };

  const [
    listedAppointments,
    todayCount,
    upcomingCount,
    pastCount,
    waitingCount,
    inProgressCount,
    completedCount,
    cancelledCount,
  ] = await Promise.all([
    db.appointment.findMany({
      where: { doctorId: user.id, appointmentDate: dateFilter },
      orderBy: { appointmentDate: view === "past" ? "desc" : "asc" },
      take: 50,
      include: { patient: true, prescription: true },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: { gte: todayStart, lt: todayEnd } },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: { gte: todayEnd } },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: { lt: todayStart } },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: dateFilter, status: "WAITING" },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: dateFilter, status: "IN_PROGRESS" },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: dateFilter, status: "COMPLETED" },
    }),
    db.appointment.count({
      where: { doctorId: user.id, appointmentDate: dateFilter, status: "CANCELLED" },
    }),
  ]);

  const tabCounts: Record<ViewType, number> = {
    today: todayCount,
    upcoming: upcomingCount,
    past: pastCount,
  };

  const statusCounts = {
    WAITING: waitingCount,
    IN_PROGRESS: inProgressCount,
    COMPLETED: completedCount,
    CANCELLED: cancelledCount,
  };

  const todayLabel = new Date().toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });

  return (
    <div className="p-6 md:p-8 bg-black min-h-screen text-white space-y-6 max-w-5xl mx-auto">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <h1 className="text-3xl font-black tracking-tight">
            All <span className="text-blue-500">Appointments</span>
          </h1>
          <p className="text-zinc-500 text-lg">Manage and review every patient visit.</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-950/80 px-3 py-1.5 text-[11px] font-bold uppercase tracking-widest text-zinc-400">
            <CalendarDays className="h-3.5 w-3.5 text-blue-500" />
            {todayLabel}
          </span>
          <LiveBadge />
        </div>
      </div>

      <ViewTabs view={view} counts={tabCounts} />

      <AppointmentsPanel
        appointments={listedAppointments}
        emptyLabel={view === "today" ? "No appointments today." : `No ${view} appointments.`}
        view={view}
        statusCounts={statusCounts}
        tabCounts={tabCounts}
      />
    </div>
  );
}
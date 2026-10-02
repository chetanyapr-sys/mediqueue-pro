import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import AppointmentsPanel from "../_components/AppointmentsPanel";

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

  const listedAppointments = await db.appointment.findMany({
    where: { doctorId: user.id, appointmentDate: dateFilter },
    orderBy: { appointmentDate: view === "past" ? "desc" : "asc" },
    take: 50,
    include: { patient: true, prescription: true },
  });

  const tabs: { key: ViewType; label: string }[] = [
    { key: "today", label: "Today" },
    { key: "upcoming", label: "Upcoming" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="p-6 md:p-8 bg-black min-h-screen text-white space-y-6 max-w-4xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight">
          All <span className="text-blue-500">Appointments</span>
        </h1>
        <p className="text-zinc-500 text-lg">Manage and review every patient visit.</p>
      </div>

      <div className="flex gap-2 bg-zinc-950/50 p-1.5 rounded-2xl border border-zinc-800/50 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/doctor/appointments?view=${tab.key}`}
            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              view === tab.key ? "bg-white text-black" : "text-zinc-500 hover:text-white"
            }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      <AppointmentsPanel
        appointments={listedAppointments}
        emptyLabel={view === "today" ? "No appointments today." : `No ${view} appointments.`}
      />
    </div>
  );
}
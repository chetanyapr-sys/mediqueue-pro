import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import HistoryList from "./_components/HistoryList";

export const dynamic = "force-dynamic";
export const revalidate = 0;

type ViewType = "all" | "upcoming" | "today" | "past";

export default async function AppointmentHistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const { view: rawView } = await searchParams;
  const view: ViewType =
    rawView === "upcoming" || rawView === "today" || rawView === "past" ? rawView : "all";

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  const dateFilter =
    view === "today"
      ? { gte: todayStart, lt: todayEnd }
      : view === "upcoming"
        ? { gte: todayEnd }
        : view === "past"
          ? { lt: todayStart }
          : undefined;

  const appointments = await db.appointment.findMany({
    where: {
      patientId: user.id,
      ...(dateFilter ? { appointmentDate: dateFilter } : {}),
    },
    orderBy: { appointmentDate: view === "today" || view === "upcoming" ? "asc" : "desc" },
    include: {
      doctor: {
        include: { user: true },
      },
      prescription: true,
    },
  });

  const tabs: { key: ViewType; label: string }[] = [
    { key: "all", label: "All" },
    { key: "upcoming", label: "Upcoming" },
    { key: "today", label: "Today" },
    { key: "past", label: "Past" },
  ];

  return (
    <div className="p-6 md:p-8 space-y-8 bg-black min-h-screen text-slate-50 max-w-6xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
        <div className="flex flex-col space-y-1">
          <Link
            href="/dashboard/patient"
            className="flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-bold uppercase tracking-widest mb-2 transition-colors w-fit"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Portal
          </Link>
          <h2 className="text-3xl font-extrabold tracking-tight text-white">
            APPOINTMENT <span className="text-zinc-500 font-light text-4xl italic">HISTORY</span>
          </h2>
          <p className="text-zinc-500 font-medium italic">Every visit you have booked, in one place.</p>
        </div>
      </div>

      {/* Date Tabs: All / Upcoming / Today / Past */}
      <div className="flex gap-2 bg-zinc-950/50 p-1.5 rounded-2xl border border-zinc-800/50 w-fit">
        {tabs.map((tab) => (
          <Link
            key={tab.key}
            href={`/dashboard/patient/history?view=${tab.key}`}
            className={`px-5 py-2 rounded-xl text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${view === tab.key ? "bg-white text-black" : "text-zinc-500 hover:text-white"
              }`}
          >
            {tab.label}
          </Link>
        ))}
      </div>

      {/* Search + Status + Specific Date filter, sab is component ke andar */}
      <HistoryList
        appointments={appointments}
        emptyLabel={view === "all" ? "No appointments booked yet." : `No ${view} appointments.`}
      />
    </div>
  );
}
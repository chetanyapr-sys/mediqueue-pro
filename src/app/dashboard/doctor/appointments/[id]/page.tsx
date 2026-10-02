import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Stethoscope, Calendar } from "lucide-react";
import AppointmentDetailPanel from "./_components/AppointmentDetailPanel";

export const dynamic = "force-dynamic";

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

export default async function DoctorAppointmentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const user = await currentUser();
  if (!user) redirect("/");

  const { id } = await params;

  const appointment = await db.appointment.findUnique({
    where: { id },
    include: { patient: true, prescription: true },
  });

  if (!appointment || appointment.doctorId !== user.id) {
    redirect("/dashboard/doctor/appointments");
  }

  return (
    <div className="p-6 md:p-8 bg-black min-h-screen text-white max-w-2xl mx-auto">
      <Link
        href="/dashboard/doctor/appointments"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Appointments
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <div className="h-14 w-14 bg-zinc-900 border border-zinc-800 rounded-xl flex items-center justify-center font-black text-blue-500 text-lg shrink-0">
          #{appointment.tokenNumber}
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-3xl font-black tracking-tighter truncate">{appointment.patient?.name || "Patient"}</h1>
          <span
            className={`inline-block mt-1 text-[10px] font-black uppercase tracking-widest px-3 py-1 rounded-full border ${statusStyle(appointment.status)}`}
          >
            {appointment.status.replace("_", " ")}
          </span>
        </div>
      </div>

      <div className="space-y-6">
        <div className="flex items-center justify-between text-sm py-4 border-y border-zinc-800/50">
          <span className="flex items-center gap-2 text-zinc-500 font-medium">
            <Calendar className="h-4 w-4" /> Date & Time
          </span>
          <span className="font-bold text-zinc-200">
            {new Date(appointment.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            {" · "}
            {new Date(appointment.appointmentDate).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}
          </span>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-zinc-500">
            <Stethoscope className="h-3.5 w-3.5" />
            <span className="text-[10px] font-black uppercase tracking-widest">Symptoms</span>
          </div>
          <p className="text-sm text-zinc-200 leading-relaxed bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4">
            {appointment.symptoms || "No symptoms noted for this appointment."}
          </p>
        </div>

        <AppointmentDetailPanel
          appointmentId={appointment.id}
          status={appointment.status}
          prescription={appointment.prescription}
        />
      </div>
    </div>
  );
}
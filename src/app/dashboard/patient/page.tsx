import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { User, Calendar, Clock, FileText, ArrowRight } from "lucide-react";
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import Link from "next/link";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PatientDashboard() {
  const user = await currentUser();
  if (!user) redirect("/");

  const patientData = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!patientData) {
    return (
      <div className="p-8 flex flex-col items-center justify-center min-h-screen bg-black text-white space-y-4 text-center">
        <h2 className="text-4xl font-extrabold tracking-tighter uppercase">Profile Not <span className="text-zinc-500">Synced</span></h2>
        <p className="text-zinc-400 font-medium max-w-md">Aapka account database mein nahi mila.</p>
      </div>
    );
  }

  if (!patientData.patientOnboarded) redirect("/dashboard/patient/onboarding");

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayEnd = new Date(today);
  todayEnd.setDate(todayEnd.getDate() + 1);

  let myAppt = null;
  try {
    myAppt = await db.appointment.findFirst({
      where: {
        patientId: user.id,
        status: { in: ["WAITING", "IN_PROGRESS"] },
        appointmentDate: { gte: today },
      },
      orderBy: { appointmentDate: "asc" },
      include: {
        doctor: {
          include: { user: true }
        }
      }
    });
  } catch (error) {
    console.error("No active appointment:", error);
  }

  const isTodayAppt = !!(myAppt && myAppt.appointmentDate >= today && myAppt.appointmentDate < todayEnd);

  let activeQueueCount = 0;
  if (myAppt && myAppt.doctorId && isTodayAppt) {
    activeQueueCount = await db.appointment.count({
      where: {
        doctorId: myAppt.doctorId,
        status: "WAITING",
        appointmentDate: { gte: today, lt: todayEnd },
      }
    });
  }

  const myAppointmentIds = await db.appointment.findMany({
    where: { patientId: user.id },
    select: { id: true },
  });
  const prescriptionCount = await db.prescription.count({
    where: { appointmentId: { in: myAppointmentIds.map((a) => a.id) } },
  });

  const hasAppt = !!(myAppt && myAppt.doctor && myAppt.doctor.user);

  const stats = [
    {
      title: "Next Appointment",
      value: hasAppt
        ? isTodayAppt
          ? "Today"
          : new Date(myAppt!.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })
        : "None",
      icon: Calendar, color: "text-blue-500", shadow: "shadow-blue-900/40"
    },
    { title: "Your Token", value: hasAppt ? `#${String(myAppt?.tokenNumber).padStart(2, '0')}` : "N/A", icon: Clock, color: "text-purple-500", shadow: "shadow-purple-900/40" },
    { title: "Current Queue", value: isTodayAppt ? String(activeQueueCount).padStart(2, '0') : "—", icon: User, color: "text-orange-500", shadow: "shadow-orange-900/40" },
    { title: "Prescriptions", value: String(prescriptionCount).padStart(2, '0'), icon: FileText, color: "text-emerald-500", shadow: "shadow-emerald-900/40" },
  ];

  return (
    <div className="p-8 space-y-10 bg-black min-h-screen text-slate-50">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-6 border-b border-zinc-900">
        <div className="flex flex-col space-y-1">
          <h2 className="text-5xl font-extrabold tracking-tighter text-white">
            PATIENT <span className="text-zinc-500 font-light text-6xl italic">PORTAL</span>
          </h2>
          <p className="text-zinc-500 font-medium italic">Tracking your health journey.</p>
        </div>
        <Link href="/dashboard/patient/find-doctors" className="group flex items-center gap-3 bg-blue-600 hover:bg-blue-500 text-white px-8 py-4 rounded-2xl font-bold transition-all w-fit">
          Book New Appointment
          <ArrowRight className="h-5 w-5 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className={`group bg-zinc-900/40 border border-zinc-800 transition-all duration-300 ${stat.shadow} rounded-3xl hover:border-zinc-600 hover:bg-zinc-900/70 hover:-translate-y-1 hover:shadow-xl`}
          >
            <CardHeader className="flex flex-row items-center justify-between pb-3">
              <CardTitle className="text-xs uppercase tracking-[0.2em] font-black text-zinc-600">{stat.title}</CardTitle>
              <stat.icon className={`h-4 w-4 ${stat.color} transition-transform duration-300 group-hover:scale-125`} />
            </CardHeader>
            <CardContent>
              <div className="text-4xl font-extrabold text-white tracking-tighter italic">{stat.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-8 md:grid-cols-7">
        <Card className="col-span-4 bg-zinc-900/30 border border-zinc-800 rounded-3xl transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white flex items-center justify-between uppercase italic tracking-tighter">
              Live Queue Tracking
              <div className="text-[10px] font-black text-emerald-500 bg-emerald-500/10 px-3 py-1 rounded-full border border-emerald-500/20">Updated just now</div>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="relative h-2 w-full bg-zinc-800 rounded-full overflow-hidden">
              <div className={`absolute top-0 left-0 h-full ${hasAppt ? 'w-[40%]' : 'w-0'} bg-gradient-to-r from-blue-600 to-purple-600 rounded-full transition-all duration-1000`} />
            </div>
            <div className="flex justify-between text-[10px] font-black text-zinc-600 uppercase tracking-widest">
              <span>Entering</span>
              <span className="text-white">Your Position ({hasAppt ? `#${myAppt?.tokenNumber}` : "None"})</span>
              <span>Doctor's Room</span>
            </div>
            <div className="h-40 flex items-center justify-center border border-dashed border-zinc-800 rounded-3xl bg-zinc-950/50">
              <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest italic px-4 text-center">
                {hasAppt
                  ? isTodayAppt
                    ? "Expected wait time: ~15 mins."
                    : `Scheduled for ${new Date(myAppt!.appointmentDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} — come back on that day to track live queue.`
                  : "No active appointments found."}
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="col-span-3 bg-zinc-900/30 border border-zinc-800 rounded-3xl transition-all duration-300 hover:border-zinc-700 hover:bg-zinc-900/50">
          <CardHeader>
            <CardTitle className="text-xl font-bold text-white uppercase italic tracking-tighter">My Doctor</CardTitle>
          </CardHeader>
          <CardContent>
             <div className="flex flex-col items-center justify-center h-[250px] space-y-4">
                <div className={`w-24 h-24 rounded-3xl bg-zinc-800 border-2 ${hasAppt ? 'border-blue-500' : 'border-zinc-700'} flex items-center justify-center overflow-hidden transition-all duration-300`}>
                   <User className="h-12 w-12 text-zinc-600" />
                </div>
                <div className="text-center space-y-1">
                   <h3 className="text-white font-black text-2xl tracking-tighter uppercase">
                    {hasAppt ? `Dr. ${myAppt?.doctor?.user?.name}` : "No Specialist"}
                   </h3>
                   <p className="text-blue-500 text-[10px] font-black uppercase tracking-[0.2em]">
                    {hasAppt ? myAppt?.doctor?.specialization : "Please book an appointment"}
                   </p>
                </div>
                <button className="w-full py-4 bg-white text-black text-[10px] font-black uppercase tracking-[0.2em] rounded-2xl disabled:opacity-30 mt-4 transition-all duration-300 hover:bg-blue-600 hover:text-white disabled:hover:bg-white disabled:hover:text-black" disabled={!hasAppt}>
                  Contact Hospital
                </button>
             </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
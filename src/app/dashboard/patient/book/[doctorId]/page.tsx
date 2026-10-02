import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { Stethoscope, ShieldCheck, AlertCircle } from "lucide-react";
import { redirect } from "next/navigation";
import BookingForm from "./_components/BookingForm";

// FIX: force-dynamic taaki doctor ki availability turant reflect ho,
// direct URL se aane par bhi stale/cached data na dikhe
export const dynamic = "force-dynamic";

export default async function BookingPage({ params }: { params: Promise<{ doctorId: string }> }) {
  const user = await currentUser();
  if (!user) redirect("/");

  const { doctorId } = await params;

  // Finding doctor by MongoDB ID from URL
  const doctor = await db.doctor.findUnique({
    where: { id: doctorId },
    include: { user: true }
  });

  if (!doctor) return <div className="p-10 text-white">Doctor Profile not found!</div>;

  // Agar doctor ne apni availability off kar rakhi hai, toh booking form ki jagah
  // ek clear message dikhao — direct URL se bhi bypass na ho sake.
  if (!doctor.isAvailable) {
    return (
      <div className="p-8 bg-black min-h-screen text-white max-w-2xl mx-auto flex items-center justify-center">
        <div className="text-center space-y-4 bg-zinc-900/50 border border-zinc-800 p-12 rounded-[2.5rem]">
          <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
          <h2 className="text-2xl font-black tracking-tight">Dr. {doctor.user.name} is currently unavailable</h2>
          <p className="text-zinc-500">This doctor is not accepting new appointments right now. Please check back later or choose another doctor.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 bg-black min-h-screen text-white max-w-5xl mx-auto">
      <div className="flex flex-col md:flex-row gap-10 items-start">

        {/* Left Side: Doctor Card */}
        <div className="w-full md:w-1/3 sticky top-8">
          <div className="bg-zinc-900/50 border border-zinc-800 p-6 rounded-[1.75rem] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4">
              <ShieldCheck className="text-blue-500 h-6 w-6 opacity-50" />
            </div>

            <div className="space-y-6">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-blue-600 to-cyan-500 flex items-center justify-center shadow-2xl shadow-blue-500/20">
                <Stethoscope className="text-white h-8 w-8" />
              </div>

              <div>
                <h2 className="text-xl font-black tracking-tight text-white">Dr. {doctor.user.name}</h2>
                <p className="text-blue-400 text-xs font-black uppercase tracking-[0.2em]">{doctor.specialization}</p>
              </div>

              <div className="space-y-4 pt-6 border-t border-zinc-800/50">
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs font-bold uppercase">Consultation</span>
                  <span className="font-black text-emerald-400 text-lg">₹{doctor.fees}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-zinc-500 text-xs font-bold uppercase">Availability</span>
                  <span className="font-bold text-zinc-300">
                    {doctor.workingHoursStart} - {doctor.workingHoursEnd}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Form */}
        <div className="w-full md:w-2/3 space-y-8">
          <div className="space-y-2">
            <h1 className="text-3xl font-black tracking-tight">Confirm <span className="text-blue-500">Booking</span></h1>
            <p className="text-zinc-500 text-sm">Choose your preferred date and time slot.</p>
          </div>

          <BookingForm
            doctorClerkId={doctor.userId}
            doctorName={doctor.user.name || "Specialist"}
            fees={doctor.fees}
            workingHoursStart={doctor.workingHoursStart}
            workingHoursEnd={doctor.workingHoursEnd}
          />
        </div>
      </div>
    </div>
  );
}
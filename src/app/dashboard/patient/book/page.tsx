import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowRight } from "lucide-react";

// FIX: force-dynamic taaki availability toggle ke baad list turant refresh ho
export const dynamic = "force-dynamic";

export default async function BookAppointmentPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  // Saare Doctors ki list fetch karo (available + unavailable, dono)
  const doctors = await db.doctor.findMany({
    include: { user: true }
  });

  return (
    <div className="p-8 min-h-screen bg-black text-white">
      <h1 className="text-3xl font-black mb-8 bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">
        Available Doctors
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {doctors.map((doctor) => (
          <div key={doctor.id} className={`p-6 bg-zinc-900/50 border border-zinc-800 rounded-3xl backdrop-blur-xl ${!doctor.isAvailable ? "opacity-60" : ""}`}>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-white">{doctor.user.name}</h3>
                <p className="text-blue-400 text-sm">{doctor.specialization}</p>
              </div>
              {doctor.isAvailable ? (
                <div className="bg-emerald-500/10 text-emerald-500 px-3 py-1 rounded-full text-xs font-bold">
                  Fees: ₹{doctor.fees}
                </div>
              ) : (
                <div className="bg-red-500/10 text-red-400 px-3 py-1 rounded-full text-xs font-bold">
                  Unavailable
                </div>
              )}
            </div>

            {/* FIX: BookingButton (galat function signature use karta tha) hata kar
                seedha working /book/[doctorId] flow par le jaate hain, jo pehle se
                createAppointment(formData) ko sahi tarike se call karta hai. */}
            {doctor.isAvailable ? (
              <Link
                href={`/dashboard/patient/book/${doctor.id}`}
                className="w-full flex items-center justify-center gap-2 py-3 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-2xl transition-all active:scale-95"
              >
                Book Appointment Now
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <div className="w-full flex items-center justify-center gap-2 py-3 bg-zinc-800 text-zinc-600 font-bold rounded-2xl cursor-not-allowed">
                Currently Unavailable
              </div>
            )}
          </div>
        ))}

        {doctors.length === 0 && (
          <div className="col-span-full py-24 text-center border border-dashed border-zinc-800 rounded-3xl">
            <p className="text-zinc-600 font-bold uppercase tracking-widest text-sm">No doctors available right now.</p>
          </div>
        )}
      </div>
    </div>
  );
}
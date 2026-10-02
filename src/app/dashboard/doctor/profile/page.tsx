import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileForm from "./_components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function DoctorProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const doctor = await db.doctor.findUnique({
    where: { userId: user.id },
  });

  if (!doctor) redirect("/dashboard/doctor/onboarding");

  return (
    <div className="p-8 bg-black min-h-screen text-white max-w-2xl mx-auto">
      <Link
        href="/dashboard/doctor"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Dashboard
      </Link>

      <div className="space-y-2 mb-10">
        <h1 className="text-3xl font-black tracking-tight">
          Edit <span className="text-blue-500">Profile</span>
        </h1>
        <p className="text-zinc-500 text-lg">Update your specialization, fees, working hours, and daily patient limit.</p>
      </div>

      <ProfileForm
        specialization={doctor.specialization}
        fees={doctor.fees}
        workingHoursStart={doctor.workingHoursStart}
        workingHoursEnd={doctor.workingHoursEnd}
        maxPatientsPerDay={doctor.maxPatientsPerDay}
      />
    </div>
  );
}
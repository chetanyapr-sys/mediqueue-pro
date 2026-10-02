import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import ProfileForm from "./_components/ProfileForm";

export const dynamic = "force-dynamic";

export default async function PatientProfilePage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const patientData = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!patientData) redirect("/dashboard/patient");

  return (
    <div className="p-8 bg-black min-h-screen text-white max-w-2xl mx-auto">
      <Link
        href="/dashboard/patient"
        className="inline-flex items-center gap-2 text-zinc-500 hover:text-white text-xs font-black uppercase tracking-widest mb-8 transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Portal
      </Link>

      <div className="space-y-2 mb-10">
        <h1 className="text-3xl font-black tracking-tight">
          Edit <span className="text-blue-500">Profile</span>
        </h1>
        <p className="text-zinc-500 text-lg">Update your name and phone number.</p>
      </div>

      <ProfileForm
        initialName={patientData.name || ""}
        initialPhone={patientData.phone || ""}
      />
    </div>
  );
}
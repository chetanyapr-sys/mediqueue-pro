import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import OnboardingForm from "./_components/OnboardingForm";

export default async function PatientOnboardingPage() {
  const user = await currentUser();
  if (!user) redirect("/");

  const patientData = await db.user.findUnique({
    where: { clerkId: user.id },
  });

  if (!patientData) redirect("/dashboard");

  // Agar onboarding pehle hi complete ho chuki hai (chahe phone diya ho ya Skip kiya ho),
  // dobara is form pe atakne ki zaroorat nahi.
  if (patientData.patientOnboarded) redirect("/dashboard/patient");

  return <OnboardingForm initialName={patientData.name || ""} />;
}
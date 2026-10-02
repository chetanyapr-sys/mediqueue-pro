"use server"
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

// Doctor ek appointment ke liye prescription likhe (ya edit kare, agar already likhi hai).
// Sirf COMPLETED ya IN_PROGRESS appointments ke liye allow hai — WAITING patient ko
// abhi dekha hi nahi gaya, uske liye prescription likhna galat hoga.
export async function savePrescription(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const appointmentId = formData.get("appointmentId") as string;
  const diagnosis = (formData.get("diagnosis") as string)?.trim();
  const medicines = (formData.get("medicines") as string)?.trim();
  const notes = (formData.get("notes") as string)?.trim();

  if (!appointmentId) return { success: false, error: "Missing appointment reference." };
  if (!medicines) return { success: false, error: "Please add at least one medicine." };

  const appointment = await db.appointment.findUnique({ where: { id: appointmentId } });
  if (!appointment || appointment.doctorId !== user.id) {
    return { success: false, error: "You are not authorized to write this prescription." };
  }
  if (appointment.status !== "COMPLETED" && appointment.status !== "IN_PROGRESS") {
    return { success: false, error: "Prescription can only be added for an ongoing or completed visit." };
  }

  await db.prescription.upsert({
    where: { appointmentId },
    create: {
      appointmentId,
      diagnosis: diagnosis || null,
      medicines,
      notes: notes || null,
    },
    update: {
      diagnosis: diagnosis || null,
      medicines,
      notes: notes || null,
    },
  });

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/patient/history");

  return { success: true };
}
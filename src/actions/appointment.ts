"use server"
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

export async function createAppointment(formData: FormData): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const doctorClerkId = formData.get("doctorClerkId") as string;
  const symptoms = formData.get("symptoms") as string;
  const dateStr = formData.get("appointmentDate") as string;
  const timeStr = formData.get("appointmentTime") as string;

  if (!doctorClerkId) throw new Error("Doctor ID is missing");
  if (!dateStr || !timeStr) {
    return { success: false, error: "Please select a date and time." };
  }

  const appointmentDate = new Date(`${dateStr}T${timeStr}:00`);
  if (isNaN(appointmentDate.getTime())) {
    return { success: false, error: "Invalid date/time selected." };
  }

  if (appointmentDate.getTime() < Date.now()) {
    return { success: false, error: "You cannot book a slot in the past." };
  }

  const dayStart = new Date(appointmentDate);
  dayStart.setHours(0, 0, 0, 0);
  const dayEnd = new Date(dayStart);
  dayEnd.setDate(dayEnd.getDate() + 1);

  const doctor = await db.doctor.findUnique({ where: { userId: doctorClerkId } });
  if (!doctor) return { success: false, error: "Doctor not found." };
  if (!doctor.isAvailable) return { success: false, error: "This doctor is currently unavailable." };

  const bookingsThatDay = await db.appointment.count({
    where: {
      doctorId: doctorClerkId,
      appointmentDate: { gte: dayStart, lt: dayEnd },
      status: { in: ["WAITING", "IN_PROGRESS", "COMPLETED"] }
    }
  });

  if (bookingsThatDay >= doctor.maxPatientsPerDay) {
    return { success: false, error: "This doctor is fully booked for the selected date. Please choose another date." };
  }

  const lastAppt = await db.appointment.findFirst({
    where: {
      doctorId: doctorClerkId,
      appointmentDate: { gte: dayStart, lt: dayEnd }
    },
    orderBy: { tokenNumber: 'desc' }
  });

  const tokenNum = (lastAppt?.tokenNumber || 0) + 1;

  await db.appointment.create({
    data: {
      tokenNumber: tokenNum,
      patientId: user.id,
      doctorId: doctorClerkId,
      symptoms: symptoms,
      status: "WAITING",
      appointmentDate: appointmentDate
    }
  });

  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/doctor");
  return { success: true };
}

// Doctor clicks "Call Next Patient" -> earliest WAITING patient for TODAY becomes IN_PROGRESS
export async function callNextPatient(doctorId: string): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayEnd = new Date(todayStart);
  todayEnd.setDate(todayEnd.getDate() + 1);

  // Don't allow calling a new patient while one is already in progress (aaj ke liye)
  const alreadyInProgress = await db.appointment.findFirst({
    where: { doctorId, status: "IN_PROGRESS", appointmentDate: { gte: todayStart, lt: todayEnd } }
  });
  if (alreadyInProgress) {
    revalidatePath("/dashboard/doctor");
    return;
  }

  const nextPatient = await db.appointment.findFirst({
    where: {
      doctorId,
      status: "WAITING",
      appointmentDate: { gte: todayStart, lt: todayEnd }
    },
    orderBy: { tokenNumber: "asc" }
  });

  if (!nextPatient) {
    revalidatePath("/dashboard/doctor");
    return;
  }

  await db.appointment.update({
    where: { id: nextPatient.id },
    data: { status: "IN_PROGRESS" }
  });

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/patient");
}

// Doctor clicks "Mark as Completed" for the patient currently being seen
export async function completeAppointment(appointmentId: string): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db.appointment.update({
    where: { id: appointmentId },
    data: { status: "COMPLETED" }
  });

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/patient");
}

// Manual "Start" — doctor kisi past-dated WAITING appointment ko IN_PROGRESS mein move
// kare (jaise Today ke "Call Next Patient" flow mein hota hai), taaki Past tab mein bhi
// same WAITING → IN_PROGRESS → COMPLETED 2-step flow follow ho, seedha complete na ho jaye.
// Sirf WAITING appointments hi is se IN_PROGRESS ban sakti hain (safe no-op warna).
export async function markInProgress(appointmentId: string): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db.appointment.updateMany({
    where: { id: appointmentId, status: "WAITING" },
    data: { status: "IN_PROGRESS" }
  });

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/patient");
}

// Doctor (ya patient) kisi appointment ko cancel/reject kar sake
// Sirf WAITING ya IN_PROGRESS appointments hi cancel ho sakte hain,
// already COMPLETED/CANCELLED wale dobara touch nahi honge.
export async function cancelAppointment(appointmentId: string): Promise<void> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  await db.appointment.updateMany({
    where: {
      id: appointmentId,
      status: { in: ["WAITING", "IN_PROGRESS"] }
    },
    data: { status: "CANCELLED" }
  });

  revalidatePath("/dashboard/doctor");
  revalidatePath("/dashboard/patient");
}

// Patient apni khud ki booking cancel kar sake (History page se)
// Security: sirf apni khud ki appointment cancel kar sakta hai, doosre ki nahi.
// Sirf WAITING status wali hi cancel karne deni chahiye — agar doctor pehle hi
// IN_PROGRESS mein le chuka hai toh cancel allow nahi (clinic mein already ho raha hai).
export async function cancelOwnAppointment(appointmentId: string): Promise<{ success: boolean; error?: string }> {
  const user = await currentUser();
  if (!user) throw new Error("Unauthorized");

  const result = await db.appointment.updateMany({
    where: {
      id: appointmentId,
      patientId: user.id,
      status: "WAITING"
    },
    data: { status: "CANCELLED" }
  });

  if (result.count === 0) {
    return { success: false, error: "This appointment can no longer be cancelled." };
  }

  revalidatePath("/dashboard/patient");
  revalidatePath("/dashboard/patient/history");
  revalidatePath("/dashboard/doctor");
  return { success: true };
}
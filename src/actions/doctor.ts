"use server"

import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs/server";
import { revalidatePath } from "next/cache";

/**
 * 1. Logged-in Doctor ki profile fetch karne ke liye
 * Dashboard par doctor ka data dikhane ke kaam aata hai.
 */
export async function getDoctorProfile() {
  try {
    const { userId } = await auth();
    if (!userId) return null;
    
    return await db.doctor.findUnique({
      where: { userId },
      include: { user: true }
    });
  } catch (error) {
    console.error("Profile Fetch Error:", error);
    return null;
  }
}

/**
 * 2. Saare Doctors ki list fetch karne ke liye (Patient side)
 * FIX: 'isNot' aur 'Unknown argument' wali errors ko solve karne ke liye 
 * ClerkId check ka use kiya gaya hai.
 *
 * UPDATE: Ab yeh function unavailable doctors ko bhi return karta hai
 * (pehle sirf isAvailable: true wale doctors dikhte the, jisse patient ko
 * lagta tha doctor system se hi hata diya gaya). Ab list mein sabhi doctors
 * dikhenge, bas unavailable wale "Currently Unavailable" mark honge aur
 * neeche sort ho jayenge — behtar UX ke liye.
 */
export async function getAllDoctors() {
  try {
    const doctors = await db.doctor.findMany({
      where: { 
        // ✅ MongoDB Specific Fix: 
        // Direct 'user: null' check crash karta hai, isliye clerkId filter use kiya hai.
        user: {
          clerkId: {
            not: "" 
          }
        }
      },
      include: { 
        user: true 
      }
    });

    // Sorting: Available doctors pehle, unke andar naya doctor sabse upar
    return doctors.sort((a, b) => {
      if (a.isAvailable !== b.isAvailable) {
        return a.isAvailable ? -1 : 1;
      }
      const dateA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
      const dateB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
      return dateB - dateA;
    });
  } catch (error) {
    console.error("Fetch Error:", error);
    return [];
  }
}

/**
 * 3. Nayi Doctor Profile create karne aur User ka Name update karne ke liye
 */
export async function createDoctorProfile(formData: { name: string; specialization: string; fees: number }) {
  try {
    const { userId } = await auth();
    
    if (!userId) {
      throw new Error("User not authenticated");
    }

    // Step 1: User table mein name update karein (Clerk sync ke liye)
    await db.user.update({
      where: { clerkId: userId },
      data: { 
        name: formData.name 
      },
    });

    // Step 2: Doctor table mein profile create karein
    // (workingHoursStart, workingHoursEnd, maxPatientsPerDay automatically
    // schema ke default values le lenge: "10:00", "17:00", 20)
    const newDoctor = await db.doctor.create({
      data: {
        userId: userId,
        specialization: formData.specialization,
        fees: Number(formData.fees),
        isAvailable: true,
      },
    });

    // Step 3: Cache refresh karein taaki data turant dikhe
    revalidatePath("/dashboard");
    revalidatePath("/dashboard/patient/find-doctors");
    
    return { success: true, doctor: newDoctor };
  } catch (error) {
    console.error("Create Doctor Error:", error);
    return { success: false, error: "Profile creation failed" };
  }
}

/**
 * 4. Doctor apni Availability On/Off toggle kar sake
 * Jab isAvailable = false hoga, doctor list (patient side) mein dikhega
 * bhi, lekin "Unavailable" mark hoga aur booking button disabled ho jayega.
 * (getAllDoctors() ab saare doctors return karta hai — sirf sort order badalta hai)
 */
export async function toggleAvailability(doctorUserId: string, currentStatus: boolean): Promise<void> {
  try {
    const { userId } = await auth();
    if (!userId || userId !== doctorUserId) {
      throw new Error("Unauthorized");
    }

    await db.doctor.update({
      where: { userId: doctorUserId },
      data: { isAvailable: !currentStatus },
    });

    revalidatePath("/dashboard/doctor");
    revalidatePath("/dashboard/patient/find-doctors");
    revalidatePath("/dashboard/patient/book");
  } catch (error) {
    console.error("Toggle Availability Error:", error);
  }
}

/**
 * 5. Doctor apni profile edit kar sake — specialization, fees,
 * working hours (start/end), aur roz ke max patients ki limit.
 */
export async function updateDoctorProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) throw new Error("Unauthorized");

    const specialization = formData.get("specialization") as string;
    const fees = Number(formData.get("fees"));
    const workingHoursStart = formData.get("workingHoursStart") as string;
    const workingHoursEnd = formData.get("workingHoursEnd") as string;
    const maxPatientsPerDay = Number(formData.get("maxPatientsPerDay"));

    if (!specialization || !workingHoursStart || !workingHoursEnd) {
      return { success: false, error: "Please fill in all required fields." };
    }
    if (isNaN(fees) || fees < 0) {
      return { success: false, error: "Fees must be a valid positive number." };
    }
    if (isNaN(maxPatientsPerDay) || maxPatientsPerDay < 1) {
      return { success: false, error: "Daily patient limit must be at least 1." };
    }
    if (workingHoursStart >= workingHoursEnd) {
      return { success: false, error: "Working hours end time must be after start time." };
    }

    await db.doctor.update({
      where: { userId },
      data: { specialization, fees, workingHoursStart, workingHoursEnd, maxPatientsPerDay }
    });

    revalidatePath("/dashboard/doctor");
    revalidatePath("/dashboard/doctor/profile");
    revalidatePath("/dashboard/patient/find-doctors");
    revalidatePath("/dashboard/patient/book");

    return { success: true };
  } catch (error) {
    console.error("Update Doctor Profile Error:", error);
    return { success: false, error: "Something went wrong while updating your profile." };
  }
}
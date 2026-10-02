"use server";

import { auth, currentUser } from "@clerk/nextjs/server";
import { db } from "@/lib/db"; 
import { revalidatePath } from "next/cache";

export const onboardUser = async (role: "DOCTOR" | "PATIENT") => {
  try {
    const { userId } = await auth();
    const user = await currentUser();

    if (!userId || !user) {
      return { success: false, error: "Authentication failed" };
    }

    const newUser = await db.user.upsert({
      where: { clerkId: userId },
      update: { role }, 
      create: {
        clerkId: userId,
        email: user.emailAddresses[0].emailAddress,
        name: `${user.firstName || ""} ${user.lastName || ""}`.trim(),
        role: role,
      },
    });

    return { success: true, user: newUser };

  } catch (error: any) {
    console.error("❌ DATABASE ERROR:", error.message || error); 
    return { success: false, error: "Database save failed" };
  }
};

// Patient (ya doctor) apni basic profile (name, phone) edit kar sake
export async function updateUserProfile(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();

    if (!name) {
      return { success: false, error: "Name cannot be empty." };
    }

    // Basic phone validation — agar bhara hai toh kam se kam 7 digits hona chahiye
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    await db.user.update({
      where: { clerkId: userId },
      data: {
        name,
        phone: phone || null,
      },
    });

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/patient/profile");
    revalidatePath("/dashboard/doctor");

    return { success: true };
  } catch (error: any) {
    console.error("❌ Update Profile Error:", error.message || error);
    return { success: false, error: "Something went wrong while updating your profile." };
  }
}

// Patient onboarding form (naam confirm + phone) — Edit Profile se alag isliye
// hai kyunki yeh "patientOnboarded" flag bhi true kar deta hai, taaki "Skip"
// karne wale patients ko dobara yeh form baar-baar na dikhe.
export async function completePatientOnboarding(formData: FormData): Promise<{ success: boolean; error?: string }> {
  try {
    const { userId } = await auth();
    if (!userId) return { success: false, error: "Unauthorized" };

    const name = (formData.get("name") as string)?.trim();
    const phone = (formData.get("phone") as string)?.trim();

    if (!name) {
      return { success: false, error: "Name cannot be empty." };
    }
    if (phone && !/^[0-9+\-\s]{7,15}$/.test(phone)) {
      return { success: false, error: "Please enter a valid phone number." };
    }

    await db.user.update({
      where: { clerkId: userId },
      data: {
        name,
        phone: phone || null,
        patientOnboarded: true,
      },
    });

    revalidatePath("/dashboard/patient");
    revalidatePath("/dashboard/patient/profile");

    return { success: true };
  } catch (error: any) {
    console.error("❌ Complete Patient Onboarding Error:", error.message || error);
    return { success: false, error: "Something went wrong. Please try again." };
  }
}
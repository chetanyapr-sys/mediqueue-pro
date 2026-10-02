"use server"
import { db } from "@/lib/db";
import { currentUser } from "@clerk/nextjs/server";

export async function getDoctorStats() {
  const user = await currentUser();
  if (!user) return null;

  try {
    // Sabse pehle ye check karo ki is Clerk ID ka doctor profile exists karta hai
    const doctorProfile = await db.doctor.findUnique({
      where: { userId: user.id } // Clerk ID se doctor dhundo
    });

    if (!doctorProfile) {
      return { totalPatients: 0, totalAppointments: 0, inQueue: 0, completed: 0 };
    }

    // Ab appointments fetch karte waqt user.id (Clerk ID) hi use karein 
    // kyunki aapke relation mein 'references: [userId]' likha hai
    const doctorIdForQuery = user.id;

    // 1. Total unique patients
    const totalPatients = await db.appointment.groupBy({
      by: ['patientId'],
      where: { doctorId: doctorIdForQuery }
    });

    // 2. Today's total appointments
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const todayAppointments = await db.appointment.count({
      where: { 
        doctorId: doctorIdForQuery,
        createdAt: { gte: today }
      }
    });

    // 3. Current waiting queue
    const inQueue = await db.appointment.count({
      where: { 
        doctorId: doctorIdForQuery, 
        status: "WAITING" 
      }
    });

    // 4. Completed appointments today
    const completedToday = await db.appointment.count({
      where: { 
        doctorId: doctorIdForQuery, 
        status: "COMPLETED",
        updatedAt: { gte: today }
      }
    });

    return {
      totalPatients: totalPatients.length,
      totalAppointments: todayAppointments,
      inQueue,
      completed: completedToday
    };
  } catch (error) {
    console.error("Dashboard Stats Error:", error);
    return { totalPatients: 0, totalAppointments: 0, inQueue: 0, completed: 0 };
  }
}
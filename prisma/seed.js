const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  // 👉 Patient create
  const patient = await db.user.create({
    data: {
      clerkId: "test_patient_1",
      email: "patient@test.com",
      name: "Test Patient",
      role: "PATIENT",
    },
  });

  // 👉 Doctor create
  const doctor = await db.user.create({
    data: {
      clerkId: "test_doctor_1",
      email: "doctor@test.com",
      name: "Test Doctor",
      role: "DOCTOR",
      doctorProfile: {
        create: {
          specialization: "General",
          fees: 500,
        },
      },
    },
  });

  // 👉 Appointment create
  await db.appointment.createMany({
    data: [
      {
        tokenNumber: 1,
        status: "WAITING",
        patientId: patient.id,
        doctorId: doctor.doctorProfile.id,
      },
      {
        tokenNumber: 2,
        status: "COMPLETED",
        patientId: patient.id,
        doctorId: doctor.doctorProfile.id,
      },
    ],
  });

  console.log("✅ Test Data Inserted");
}

main()
  .catch((e) => console.error(e))
  .finally(() => db.$disconnect());
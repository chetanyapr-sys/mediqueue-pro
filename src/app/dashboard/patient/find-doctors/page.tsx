import { getAllDoctors } from "@/actions/doctor";
import DoctorGrid from "./_components/DoctorGrid";

// FIX: Bina isske Next.js is page ko cache kar leta tha, isliye doctor
// ki availability toggle karne ke baad bhi purana (stale) data dikhta tha.
// force-dynamic har request par fresh database data fetch karwata hai.
export const dynamic = "force-dynamic";

export default async function FindDoctorsPage() {
  const doctors = await getAllDoctors();

  return (
    <div className="p-6 md:p-8 bg-black min-h-screen text-white space-y-8 max-w-6xl mx-auto">
      <div className="space-y-2">
        <h1 className="text-4xl md:text-5xl font-black tracking-tight">
          Find a{" "}
          <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">
            Doctor
          </span>
        </h1>
        <p className="text-zinc-500 text-lg">Pick a doctor and book your visit. No waiting in line.</p>
      </div>

      <DoctorGrid doctors={doctors} />
    </div>
  );
}
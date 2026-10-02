import { getAllDoctors } from "@/actions/doctor";
import { Zap } from "lucide-react";
import DoctorGrid from "./_components/DoctorGrid";

// FIX: Bina isske Next.js is page ko cache kar leta tha, isliye doctor
// ki availability toggle karne ke baad bhi purana (stale) data dikhta tha.
// force-dynamic har request par fresh database data fetch karwata hai.
export const dynamic = "force-dynamic";

export default async function FindDoctorsPage() {
  const doctors = await getAllDoctors();

  return (
    <div className="p-8 bg-black min-h-screen text-white space-y-10">
      
      {/* Header Section */}
      <div className="flex flex-col space-y-2">
        <div className="flex items-center gap-2 text-blue-500 font-black uppercase tracking-[0.3em] text-[10px]">
          <Zap className="h-3 w-3 fill-blue-500" />
          Live Specialists
        </div>
        <h1 className="text-6xl font-black tracking-tighter">
          Find <span className="bg-gradient-to-r from-blue-500 to-cyan-400 bg-clip-text text-transparent">Specialists</span>
        </h1>
        <p className="text-zinc-500 font-medium max-w-2xl text-lg">
          MediQueue verified experts are available now. Choose your doctor and skip the waiting room.
        </p>
      </div>

      {/* Interactive Grid: stats bar + search + filters + doctor cards */}
      <DoctorGrid doctors={doctors} />
    </div>
  );
}
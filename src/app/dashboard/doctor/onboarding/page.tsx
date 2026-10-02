"use client"

import { useState } from "react";
import { createDoctorProfile } from "@/actions/doctor";
import { useRouter } from "next/navigation";
import { Loader2, Stethoscope, Banknote, ShieldCheck, UserCircle } from "lucide-react";

export default function OnboardingPage() {
  const [name, setName] = useState(""); // ✅ Name state add ki
  const [specialization, setSpecialization] = useState("");
  const [fees, setFees] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const res = await createDoctorProfile({
      name, // ✅ Name ko action mein bhej rahe hain
      specialization,
      fees: Number(fees),
    });

    if (res.success) {
      router.push("/dashboard/doctor"); 
      router.refresh(); 
    } else {
      alert("Database error! Check your server terminal.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 p-7 rounded-[1.75rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 blur-[80px]" />
        
        <div className="relative z-10 space-y-8">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Doctor Setup</h1>
            <p className="text-zinc-500 text-sm mt-2">Apne hospital ki details bhariye.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* ✅ Full Name Field Added */}
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-4 h-5 w-5 text-zinc-700" />
                <input
                  required
                  placeholder="e.g. Dr. Chetanya Prakash"
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-zinc-800"
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Specialization</label>
              <div className="relative">
                <Stethoscope className="absolute left-4 top-4 h-5 w-5 text-zinc-700" />
                <input
                  required
                  placeholder="e.g. Dentist, Surgeon"
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-zinc-800"
                  onChange={(e) => setSpecialization(e.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Consultation Fees (₹)</label>
              <div className="relative">
                <Banknote className="absolute left-4 top-4 h-5 w-5 text-zinc-700" />
                <input
                  required
                  type="number"
                  placeholder="500"
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-zinc-800"
                  onChange={(e) => setFees(e.target.value)}
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 text-white hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
            >
              {loading ? <Loader2 className="animate-spin h-5 w-5" /> : "Complete Profile 🚀"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
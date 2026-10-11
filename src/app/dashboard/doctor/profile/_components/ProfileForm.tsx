"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Stethoscope, IndianRupee, Clock3, Users, Timer } from "lucide-react";
import { updateDoctorProfile } from "@/actions/doctor";

interface ProfileFormProps {
  specialization: string;
  fees: number;
  workingHoursStart: string;
  workingHoursEnd: string;
  maxPatientsPerDay: number;
  slotDuration: number;
}

const SLOT_OPTIONS = [10, 15, 20, 30];

export default function ProfileForm({
  specialization: initialSpecialization,
  fees: initialFees,
  workingHoursStart: initialStart,
  workingHoursEnd: initialEnd,
  maxPatientsPerDay: initialLimit,
  slotDuration: initialSlot,
}: ProfileFormProps) {
  const router = useRouter();
  const [specialization, setSpecialization] = useState(initialSpecialization);
  const [fees, setFees] = useState(String(initialFees));
  const [workingHoursStart, setWorkingHoursStart] = useState(initialStart);
  const [workingHoursEnd, setWorkingHoursEnd] = useState(initialEnd);
  const [maxPatientsPerDay, setMaxPatientsPerDay] = useState(String(initialLimit));
  const [slotDuration, setSlotDuration] = useState(initialSlot);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("specialization", specialization);
    formData.set("fees", fees);
    formData.set("workingHoursStart", workingHoursStart);
    formData.set("workingHoursEnd", workingHoursEnd);
    formData.set("maxPatientsPerDay", maxPatientsPerDay);
    formData.set("slotDuration", String(slotDuration));

    const result = await updateDoctorProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully!");
      router.push("/dashboard/doctor");
      router.refresh();
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Specialization */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Stethoscope className="h-3.5 w-3.5" /> Specialization
        </label>
        <input
          type="text"
          value={specialization}
          onChange={(e) => setSpecialization(e.target.value)}
          required
          placeholder="e.g. Dentist, Cardiologist"
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
      </div>

      {/* Fees */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <IndianRupee className="h-3.5 w-3.5" /> Consultation Fees
        </label>
        <input
          type="number"
          min={0}
          value={fees}
          onChange={(e) => setFees(e.target.value)}
          required
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
      </div>

      {/* Working Hours */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Clock3 className="h-3.5 w-3.5" /> Working Hours
        </label>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-600 uppercase">From</span>
            <input
              type="time"
              value={workingHoursStart}
              onChange={(e) => setWorkingHoursStart(e.target.value)}
              required
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
            />
          </div>
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-zinc-600 uppercase">To</span>
            <input
              type="time"
              value={workingHoursEnd}
              onChange={(e) => setWorkingHoursEnd(e.target.value)}
              required
              className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
            />
          </div>
        </div>
      </div>

      {/* Slot Length */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Timer className="h-3.5 w-3.5" /> Time Per Patient
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {SLOT_OPTIONS.map((mins) => {
            const selected = slotDuration === mins;
            return (
              <button
                key={mins}
                type="button"
                onClick={() => setSlotDuration(mins)}
                aria-pressed={selected}
                className={`flex flex-col items-center justify-center py-4 rounded-2xl border text-sm font-black transition-all duration-300 ${
                  selected
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-blue-500/40"
                }`}
              >
                <span className="text-lg">{mins}</span>
                <span className="text-[10px] font-bold uppercase tracking-widest">
                  {selected ? "Selected" : "Minutes"}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-zinc-600">
          Har patient ko itna time milega. Slot length badalne se pehle aane wali bookings dekh lo, kyunki purani bookings naye slots pe nahi baithengi.
        </p>
      </div>

      {/* Daily Patient Limit */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Users className="h-3.5 w-3.5" /> Max Patients Per Day
        </label>
        <input
          type="number"
          min={1}
          value={maxPatientsPerDay}
          onChange={(e) => setMaxPatientsPerDay(e.target.value)}
          required
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
        <p className="text-xs text-zinc-600">Isse zyada bookings us din ke liye allow nahi hongi.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-5 bg-white text-black font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-blue-600 hover:text-white transition-all duration-500 active:scale-95 shadow-2xl shadow-white/5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Saving...
          </>
        ) : (
          "Save Changes"
        )}
      </button>
    </form>
  );
}
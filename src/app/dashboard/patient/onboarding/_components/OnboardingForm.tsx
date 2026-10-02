"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCircle, Phone, ShieldCheck } from "lucide-react";
import { completePatientOnboarding } from "@/actions/user";

interface OnboardingFormProps {
  initialName: string;
}

export default function OnboardingForm({ initialName }: OnboardingFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);

    const result = await completePatientOnboarding(formData);

    if (result.success) {
      toast.success("Profile complete! Welcome to MediQueue.");
      router.push("/dashboard/patient");
      router.refresh();
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  // "Skip" — phone optional hai, isliye patient chahe toh sirf naam confirm karke aage badh sakta hai
  async function handleSkip() {
    setIsSubmitting(true);
    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", "");

    const result = await completePatientOnboarding(formData);
    if (result.success) {
      router.push("/dashboard/patient");
      router.refresh();
    } else {
      toast.error(result.error || "Something went wrong.");
      setIsSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center p-6">
      <div className="max-w-md w-full bg-zinc-950 border border-zinc-900 p-7 rounded-[1.75rem] shadow-2xl relative overflow-hidden">
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-blue-600/10 blur-[80px]" />

        <div className="relative z-10 space-y-8">
          <div className="text-center">
            <div className="inline-flex p-3 rounded-2xl bg-blue-500/10 border border-blue-500/20 mb-4">
              <ShieldCheck className="h-8 w-8 text-blue-500" />
            </div>
            <h1 className="text-3xl font-black tracking-tighter">Complete Your Profile</h1>
            <p className="text-zinc-500 text-sm mt-2">Confirm your name and add a phone number so we can reach you.</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Full Name</label>
              <div className="relative">
                <UserCircle className="absolute left-4 top-4 h-5 w-5 text-zinc-700" />
                <input
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Priya Sharma"
                  suppressHydrationWarning
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-zinc-800"
                />
              </div>
              <p className="text-[10px] text-zinc-600 ml-1">
                Yeh naam humne aapki login ID se liya hai — agar galat hai toh yahin sahi kar dijiye.
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-[0.2em] font-black text-zinc-600 ml-1">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-4 top-4 h-5 w-5 text-zinc-700" />
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. +91 98765 43210"
                  suppressHydrationWarning
                  className="w-full bg-zinc-900/50 border border-zinc-800 p-4 pl-12 rounded-2xl focus:ring-2 focus:ring-blue-500 outline-none transition-all text-white placeholder:text-zinc-800"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              suppressHydrationWarning
              className="w-full bg-blue-600 text-white hover:bg-blue-500 py-4 rounded-2xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95 disabled:opacity-50"
            >
              {isSubmitting ? <Loader2 className="animate-spin h-5 w-5" /> : "Continue to Dashboard 🚀"}
            </button>

            <button
              type="button"
              onClick={handleSkip}
              disabled={isSubmitting}
              suppressHydrationWarning
              className="w-full text-zinc-600 hover:text-zinc-400 py-2 text-xs font-bold uppercase tracking-widest transition-colors"
            >
              Skip phone for now
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
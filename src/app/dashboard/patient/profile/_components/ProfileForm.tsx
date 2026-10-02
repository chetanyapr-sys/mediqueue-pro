"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, UserCircle, Phone } from "lucide-react";
import { updateUserProfile } from "@/actions/user";

interface ProfileFormProps {
  initialName: string;
  initialPhone: string;
}

export default function ProfileForm({ initialName, initialPhone }: ProfileFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [phone, setPhone] = useState(initialPhone);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("name", name);
    formData.set("phone", phone);

    const result = await updateUserProfile(formData);

    if (result.success) {
      toast.success("Profile updated successfully!");
      router.push("/dashboard/patient");
      router.refresh();
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Name */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <UserCircle className="h-3.5 w-3.5" /> Full Name
        </label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          placeholder="e.g. Priya Sharma"
          suppressHydrationWarning
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
      </div>

      {/* Phone */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Phone className="h-3.5 w-3.5" /> Phone Number
        </label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="e.g. +91 98765 43210"
          suppressHydrationWarning
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 px-6 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
        <p className="text-xs text-zinc-600">Optional — appointment reminders ke liye use ho sakta hai future mein.</p>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        suppressHydrationWarning
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
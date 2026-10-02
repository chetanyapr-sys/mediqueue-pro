"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { X, Loader2 } from "lucide-react";
import { cancelOwnAppointment } from "@/actions/appointment";

export default function CancelBookingButton({ appointmentId }: { appointmentId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  async function handleCancel() {
    setIsCancelling(true);
    const result = await cancelOwnAppointment(appointmentId);

    if (result.success) {
      toast.success("Appointment cancelled.");
      router.refresh();
    } else {
      toast.error(result.error || "Could not cancel this appointment.");
    }
    setIsCancelling(false);
    setConfirming(false);
  }

  if (confirming) {
    return (
      <div className="flex items-center gap-2">
        <span className="text-[10px] font-bold text-zinc-500 uppercase">Cancel this?</span>
        <button
          onClick={handleCancel}
          disabled={isCancelling}
          suppressHydrationWarning
          className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-red-500/10 text-red-400 border border-red-500/20 hover:bg-red-500/20 transition-colors disabled:opacity-50"
        >
          {isCancelling ? <Loader2 className="h-3 w-3 animate-spin" /> : "Yes, Cancel"}
        </button>
        <button
          onClick={() => setConfirming(false)}
          disabled={isCancelling}
          suppressHydrationWarning
          className="px-3 py-1.5 rounded-full text-[10px] font-black uppercase bg-zinc-800 text-zinc-400 hover:bg-zinc-700 transition-colors"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setConfirming(true)}
      suppressHydrationWarning
      title="Cancel this appointment"
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest bg-zinc-900 text-zinc-500 border border-zinc-800 hover:text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-colors"
    >
      <X className="h-3 w-3" /> Cancel
    </button>
  );
}
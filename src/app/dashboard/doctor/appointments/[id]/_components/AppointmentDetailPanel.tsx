"use client"

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { PlayCircle, CheckCircle2, XCircle, Pencil, Pill, Loader2 } from "lucide-react";
import { markInProgress, completeAppointment, cancelAppointment } from "@/actions/appointment";
import PrescriptionForm from "../../../_components/PrescriptionForm";

interface Prescription {
  diagnosis: string | null;
  medicines: string;
  notes: string | null;
}

interface AppointmentDetailPanelProps {
  appointmentId: string;
  status: string;
  prescription: Prescription | null;
}

export default function AppointmentDetailPanel({ appointmentId, status, prescription }: AppointmentDetailPanelProps) {
  const router = useRouter();
  const [editingPrescription, setEditingPrescription] = useState(false);
  const [pendingAction, setPendingAction] = useState<"start" | "complete" | "cancel" | null>(null);

  async function handleAction(action: "start" | "complete" | "cancel") {
    setPendingAction(action);
    try {
      if (action === "start") await markInProgress(appointmentId);
      if (action === "complete") await completeAppointment(appointmentId);
      if (action === "cancel") await cancelAppointment(appointmentId);
      toast.success(
        action === "start" ? "Consultation started." : action === "complete" ? "Marked as completed." : "Appointment cancelled."
      );
      router.refresh();
    } catch {
      toast.error("Something went wrong. Please try again.");
    }
    setPendingAction(null);
  }

  return (
    <div className="space-y-6">
      {(status === "WAITING" || status === "IN_PROGRESS") && (
        <div className="flex items-center gap-3">
          {status === "WAITING" && (
            <button
              onClick={() => handleAction("start")}
              disabled={pendingAction !== null}
              suppressHydrationWarning
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-blue-600 text-white font-black uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-all text-sm disabled:opacity-50"
            >
              {pendingAction === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <PlayCircle className="h-4 w-4" />}
              Start Consultation
            </button>
          )}
          {status === "IN_PROGRESS" && (
            <button
              onClick={() => handleAction("complete")}
              disabled={pendingAction !== null}
              suppressHydrationWarning
              className="flex-1 flex items-center justify-center gap-2 py-4 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-2xl hover:bg-emerald-400 transition-all text-sm disabled:opacity-50"
            >
              {pendingAction === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
              Mark as Completed
            </button>
          )}
          <button
            onClick={() => handleAction("cancel")}
            disabled={pendingAction !== null}
            suppressHydrationWarning
            className="px-6 py-4 bg-zinc-900 border border-zinc-800 text-zinc-400 font-black uppercase tracking-widest rounded-2xl hover:bg-red-500/10 hover:text-red-500 hover:border-red-500/30 transition-all text-sm disabled:opacity-50"
          >
            {pendingAction === "cancel" ? <Loader2 className="h-4 w-4 animate-spin" /> : <XCircle className="h-4 w-4" />}
          </button>
        </div>
      )}

      {(status === "COMPLETED" || status === "IN_PROGRESS") && (
        <div className="space-y-3 bg-zinc-900/30 border border-zinc-800 rounded-[2rem] p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-zinc-400">
              <Pill className="h-4 w-4" />
              <span className="text-xs font-black uppercase tracking-widest">Prescription</span>
            </div>
            {prescription && !editingPrescription && (
              <button
                onClick={() => setEditingPrescription(true)}
                suppressHydrationWarning
                className="flex items-center gap-1 text-[10px] font-black uppercase text-blue-400 hover:text-blue-300 transition-colors"
              >
                <Pencil className="h-3 w-3" /> Edit
              </button>
            )}
          </div>

          {prescription && !editingPrescription ? (
            <div className="bg-zinc-900/50 border border-zinc-800/50 rounded-2xl p-4 space-y-3 text-sm">
              {prescription.diagnosis && (
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Diagnosis</p>
                  <p className="text-zinc-200">{prescription.diagnosis}</p>
                </div>
              )}
              <div>
                <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Medicines</p>
                <p className="text-zinc-200 whitespace-pre-line">{prescription.medicines}</p>
              </div>
              {prescription.notes && (
                <div>
                  <p className="text-[10px] font-black uppercase text-zinc-600 mb-1">Notes</p>
                  <p className="text-zinc-400 italic">{prescription.notes}</p>
                </div>
              )}
            </div>
          ) : (
            <PrescriptionForm
              appointmentId={appointmentId}
              initialDiagnosis={prescription?.diagnosis || ""}
              initialMedicines={prescription?.medicines || ""}
              initialNotes={prescription?.notes || ""}
              onSaved={() => {
                setEditingPrescription(false);
                router.refresh();
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
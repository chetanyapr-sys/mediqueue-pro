"use client"

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, Pill } from "lucide-react";
import { savePrescription } from "@/actions/prescription";

interface PrescriptionFormProps {
  appointmentId: string;
  initialDiagnosis: string;
  initialMedicines: string;
  initialNotes: string;
  onSaved: () => void;
}

export default function PrescriptionForm({
  appointmentId,
  initialDiagnosis,
  initialMedicines,
  initialNotes,
  onSaved,
}: PrescriptionFormProps) {
  const [diagnosis, setDiagnosis] = useState(initialDiagnosis);
  const [medicines, setMedicines] = useState(initialMedicines);
  const [notes, setNotes] = useState(initialNotes);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("appointmentId", appointmentId);
    formData.set("diagnosis", diagnosis);
    formData.set("medicines", medicines);
    formData.set("notes", notes);

    const result = await savePrescription(formData);

    if (result.success) {
      toast.success("Prescription saved.");
      onSaved();
    } else {
      toast.error(result.error || "Something went wrong.");
    }
    setIsSubmitting(false);
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 pt-2">
      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Diagnosis (optional)</label>
        <input
          type="text"
          value={diagnosis}
          onChange={(e) => setDiagnosis(e.target.value)}
          placeholder="e.g. Viral Fever"
          suppressHydrationWarning
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Medicines</label>
        <textarea
          value={medicines}
          onChange={(e) => setMedicines(e.target.value)}
          required
          placeholder={"1. Paracetamol 500mg — 1 tablet, twice daily, 5 days\n2. ..."}
          suppressHydrationWarning
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all min-h-[100px] resize-none"
        />
      </div>

      <div className="space-y-2">
        <label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Notes / Advice (optional)</label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="e.g. Drink plenty of fluids, follow up in 5 days if fever persists"
          suppressHydrationWarning
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl py-2.5 px-4 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 outline-none transition-all min-h-[70px] resize-none"
        />
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        suppressHydrationWarning
        className="w-full flex items-center justify-center gap-2 py-3 bg-emerald-500 text-black font-black uppercase tracking-widest rounded-xl hover:bg-emerald-400 transition-all text-xs disabled:opacity-50"
      >
        {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Pill className="h-4 w-4" />}
        {initialMedicines ? "Update Prescription" : "Save Prescription"}
      </button>
    </form>
  );
}
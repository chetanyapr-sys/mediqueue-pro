"use client"

import { useState, useMemo } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { CalendarDays, Clock3, Loader2 } from "lucide-react";
import { createAppointment } from "@/actions/appointment";
import Calendar from "./Calendar";

interface BookingFormProps {
  doctorClerkId: string;
  doctorName: string;
  fees: number;
  workingHoursStart: string; // "10:00"
  workingHoursEnd: string;   // "17:00"
}

// Doctor ke working hours (e.g. "10:00" se "17:00") ke beech 30-minute ke slots generate karta hai
function generateTimeSlots(start: string, end: string) {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current < endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += 30;
  }
  return slots;
}

function formatTimeLabel(time24: string) {
  const [h, m] = time24.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}

export default function BookingForm({ doctorClerkId, doctorName, fees, workingHoursStart, workingHoursEnd }: BookingFormProps) {
  const router = useRouter();
  const allSlots = useMemo(() => generateTimeSlots(workingHoursStart, workingHoursEnd), [workingHoursStart, workingHoursEnd]);

  const [selectedDate, setSelectedDate] = useState<Date>(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [symptoms, setSymptoms] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Agar aaj ka din selected hai, toh beete hue time-slots hide kar do
  const visibleSlots = useMemo(() => {
    const isToday = selectedDate.toDateString() === new Date().toDateString();
    if (!isToday) return allSlots;

    const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
    return allSlots.filter((slot) => {
      const [h, m] = slot.split(":").map(Number);
      return h * 60 + m > nowMinutes;
    });
  }, [allSlots, selectedDate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    if (!selectedTime) {
      toast.error("Please select a time slot.");
      return;
    }
    if (!symptoms.trim()) {
      toast.error("Please describe your symptoms.");
      return;
    }

    setIsSubmitting(true);

    const formData = new FormData();
    formData.set("doctorClerkId", doctorClerkId);
    formData.set("symptoms", symptoms);
    // yyyy-mm-dd format mein date bhejna zaroori hai (server isse parse karta hai)
    const yyyy = selectedDate.getFullYear();
    const mm = String(selectedDate.getMonth() + 1).padStart(2, "0");
    const dd = String(selectedDate.getDate()).padStart(2, "0");
    formData.set("appointmentDate", `${yyyy}-${mm}-${dd}`);
    formData.set("appointmentTime", selectedTime);

    const result = await createAppointment(formData);

    if (result.success) {
      toast.success("Appointment booked successfully!");
      router.push("/dashboard/patient");
    } else {
      toast.error(result.error || "Something went wrong. Please try again.");
      setIsSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Date Picker — Full Calendar (kisi bhi future date ko select kar sakte ho) */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <CalendarDays className="h-3.5 w-3.5" /> Select Date
        </label>
        <Calendar
          selectedDate={selectedDate}
          onSelectDate={(date) => {
            setSelectedDate(date);
            setSelectedTime(null);
          }}
        />
      </div>

      {/* Time Slot Picker */}
      <div className="space-y-3">
        <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600">
          <Clock3 className="h-3.5 w-3.5" /> Select Time Slot
          <span className="text-blue-400 normal-case tracking-normal font-bold">
            — {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
          </span>
        </label>
        {visibleSlots.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {visibleSlots.map((slot) => (
              <button
                key={slot}
                type="button"
                onClick={() => setSelectedTime(slot)}
                className={`flex items-center justify-center py-3.5 px-2 rounded-xl text-xs font-bold border whitespace-nowrap transition-all duration-300 ${
                  selectedTime === slot
                    ? "bg-blue-600 text-white border-blue-600"
                    : "bg-zinc-900/50 border-zinc-800 text-zinc-300 hover:border-blue-500/40"
                }`}
              >
                {formatTimeLabel(slot)}
              </button>
            ))}
          </div>
        ) : (
          <p className="text-sm text-zinc-600 italic py-4">No slots left for today. Please pick another date.</p>
        )}
      </div>

      {/* Symptoms */}
      <div className="group space-y-3">
        <label className="text-[10px] font-black uppercase tracking-[0.3em] text-zinc-600 group-focus-within:text-blue-500 transition-colors">
          What are your symptoms?
        </label>
        <textarea
          value={symptoms}
          onChange={(e) => setSymptoms(e.target.value)}
          required
          placeholder="Describe briefly (e.g. Fever, Cough, Pain...)"
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 text-sm focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all min-h-[120px] resize-none"
        />
      </div>

      {/* Live Booking Summary — real-time update hota hai jaise jaise patient selections karta hai */}
      <div className="p-5 bg-gradient-to-br from-blue-500/10 to-cyan-500/5 border border-blue-500/20 rounded-2xl space-y-3">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-blue-400">Booking Summary</p>
        <div className="space-y-2.5 text-sm">
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Doctor</span>
            <span className="font-bold text-zinc-200">Dr. {doctorName}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Date</span>
            <span className="font-bold text-zinc-200">
              {selectedDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" })}
            </span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Time</span>
            <span className={`font-bold ${selectedTime ? "text-zinc-200" : "text-zinc-600 italic"}`}>
              {selectedTime ? formatTimeLabel(selectedTime) : "Not selected yet"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2.5 border-t border-blue-500/10">
            <span className="text-zinc-500 font-medium">Consultation Fee</span>
            <span className="font-black text-emerald-400 text-base">₹{fees}</span>
          </div>
        </div>
      </div>

      <button
        type="submit"
        disabled={isSubmitting}
        className="w-full flex items-center justify-center gap-2 py-4 bg-white text-black font-black uppercase tracking-[0.2em] rounded-xl hover:bg-blue-600 hover:text-white transition-all duration-500 active:scale-95 shadow-2xl shadow-white/5 disabled:opacity-50 disabled:pointer-events-none"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" /> Booking...
          </>
        ) : (
          "Confirm Appointment"
        )}
      </button>
    </form>
  );
}
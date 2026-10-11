// Slot logic ek jagah, taaki BookingForm (client) aur appointment.ts (server) dono same list use karein.
// Note: ye file "use server" nahi hai, isliye yahan se normal function export ho sakta hai.

export const SLOT_MINUTES = 15;

// Working hours (e.g. "10:00" se "17:00") ke beech slots generate karta hai
export function generateTimeSlots(start: string, end: string, step: number = SLOT_MINUTES): string[] {
  const slots: string[] = [];
  const [startH, startM] = start.split(":").map(Number);
  const [endH, endM] = end.split(":").map(Number);

  let current = startH * 60 + startM;
  const endMinutes = endH * 60 + endM;

  while (current < endMinutes) {
    const h = Math.floor(current / 60);
    const m = current % 60;
    slots.push(`${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`);
    current += step;
  }
  return slots;
}
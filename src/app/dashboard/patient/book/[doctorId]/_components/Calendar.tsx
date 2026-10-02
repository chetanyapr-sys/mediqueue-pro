"use client"

import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface CalendarProps {
  selectedDate: Date;
  onSelectDate: (date: Date) => void;
  // Optional: kitne mahine aage tak booking allow ho (default 3)
  maxMonthsAhead?: number;
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function isSameDay(a: Date, b: Date) {
  return a.toDateString() === b.toDateString();
}

export default function Calendar({ selectedDate, onSelectDate, maxMonthsAhead = 3 }: CalendarProps) {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // viewMonth = jo month abhi calendar mein display ho raha hai
  const [viewMonth, setViewMonth] = useState(new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1));

  const maxDate = new Date(today.getFullYear(), today.getMonth() + maxMonthsAhead, today.getDate());

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();

  const firstDayOfMonth = new Date(year, month, 1);
  const startOffset = firstDayOfMonth.getDay(); // 0 = Sunday
  const daysInMonth = new Date(year, month + 1, 0).getDate();

  const cells: (Date | null)[] = [];
  for (let i = 0; i < startOffset; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(year, month, d));

  const canGoPrev = new Date(year, month, 1) > new Date(today.getFullYear(), today.getMonth(), 1);
  const canGoNext = new Date(year, month, 1) < new Date(maxDate.getFullYear(), maxDate.getMonth(), 1);

  return (
    <div className="bg-zinc-900/50 border border-zinc-800 rounded-[2rem] p-6">
      {/* Month Navigation */}
      <div className="flex items-center justify-between mb-5">
        <button
          type="button"
          disabled={!canGoPrev}
          onClick={() => setViewMonth(new Date(year, month - 1, 1))}
          className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronLeft className="h-4 w-4" />
        </button>
        <span className="font-black uppercase tracking-widest text-sm">
          {viewMonth.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </span>
        <button
          type="button"
          disabled={!canGoNext}
          onClick={() => setViewMonth(new Date(year, month + 1, 1))}
          className="p-2 rounded-xl text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors disabled:opacity-20 disabled:pointer-events-none"
        >
          <ChevronRight className="h-4 w-4" />
        </button>
      </div>

      {/* Weekday headers */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {WEEKDAYS.map((w, i) => (
          <div key={i} className="text-center text-[10px] font-black uppercase text-zinc-600">
            {w}
          </div>
        ))}
      </div>

      {/* Day grid */}
      <div className="grid grid-cols-7 gap-1">
        {cells.map((date, i) => {
          if (!date) return <div key={`empty-${i}`} />;

          const isPast = date < today;
          const isFuture = date > maxDate;
          const isDisabled = isPast || isFuture;
          const isSelected = isSameDay(date, selectedDate);
          const isToday = isSameDay(date, today);

          return (
            <button
              key={date.toISOString()}
              type="button"
              disabled={isDisabled}
              onClick={() => onSelectDate(date)}
              className={`aspect-square rounded-xl text-sm font-bold transition-all duration-200 ${
                isSelected
                  ? "bg-white text-black"
                  : isDisabled
                  ? "text-zinc-800 cursor-not-allowed"
                  : isToday
                  ? "bg-blue-500/10 text-blue-400 border border-blue-500/30 hover:bg-blue-500/20"
                  : "text-zinc-300 hover:bg-zinc-800"
              }`}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>
    </div>
  );
}
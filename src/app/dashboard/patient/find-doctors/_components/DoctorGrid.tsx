"use client"

import { useState, useMemo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Search, Star, ArrowRight, IndianRupee, Clock, Stethoscope } from "lucide-react";
import Link from "next/link";

interface DoctorUser {
  name: string | null;
}

interface Doctor {
  id: string;
  userId: string;
  specialization: string;
  fees: number;
  isAvailable: boolean;
  workingHoursStart: string;
  workingHoursEnd: string;
  updatedAt: Date | string;
  user: DoctorUser;
}

// Gradient palette — har doctor ko naam ke hisaab se ek consistent color milega
const GRADIENTS = [
  "from-blue-500 to-cyan-400",
  "from-purple-500 to-pink-400",
  "from-emerald-500 to-teal-400",
  "from-orange-500 to-amber-400",
  "from-rose-500 to-red-400",
  "from-indigo-500 to-blue-400",
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

function getGradient(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return GRADIENTS[Math.abs(hash) % GRADIENTS.length];
}

export default function DoctorGrid({ doctors }: { doctors: Doctor[] }) {
  const [search, setSearch] = useState("");
  const [activeSpecialization, setActiveSpecialization] = useState("All");

  const specializations = useMemo(() => {
    const unique = Array.from(new Set(doctors.map((d) => d.specialization)));
    return ["All", ...unique];
  }, [doctors]);

  const availableCount = useMemo(() => doctors.filter((d) => d.isAvailable).length, [doctors]);

  const filteredDoctors = useMemo(() => {
    return doctors.filter((doctor) => {
      const name = doctor.user?.name || "";
      const matchesSearch =
        name.toLowerCase().includes(search.toLowerCase()) ||
        doctor.specialization.toLowerCase().includes(search.toLowerCase());
      const matchesSpecialization = activeSpecialization === "All" || doctor.specialization === activeSpecialization;
      return matchesSearch && matchesSpecialization;
    });
  }, [doctors, search, activeSpecialization]);

  return (
    <div className="space-y-8">
      {/* Live Stats Bar */}
      <div className="flex flex-wrap items-center gap-6 text-xs font-bold text-zinc-500">
        <span className="flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-emerald-400">{availableCount}</span> Available Now
        </span>
        <span className="text-zinc-700">•</span>
        <span>{doctors.length} Total Specialists</span>
        <span className="text-zinc-700">•</span>
        <span>{specializations.length - 1} Specializations</span>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-6 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-600" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by doctor name or specialization..."
          className="w-full bg-zinc-900/50 border border-zinc-800 rounded-2xl py-4 pl-14 pr-6 text-sm text-white placeholder:text-zinc-600 focus:border-blue-500/50 focus:ring-4 focus:ring-blue-500/5 outline-none transition-all"
        />
      </div>

      {/* Specialization Filter Chips */}
      <div className="flex flex-wrap gap-2">
        {specializations.map((spec) => (
          <button
            key={spec}
            onClick={() => setActiveSpecialization(spec)}
            className={`px-4 py-2 rounded-full text-[11px] font-black uppercase tracking-widest transition-all duration-300 ${
              activeSpecialization === spec
                ? "bg-white text-black"
                : "bg-zinc-900/50 border border-zinc-800 text-zinc-400 hover:border-zinc-600"
            }`}
          >
            {spec}
          </button>
        ))}
      </div>

      {/* Doctors Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filteredDoctors.length > 0 ? (
          filteredDoctors.map((doctor) => {
            const name = doctor.user?.name || "Specialist";
            const initials = getInitials(name);
            const gradient = getGradient(name);

            return (
              <Card
                key={doctor.id}
                className={`bg-zinc-900/20 border backdrop-blur-md transition-all duration-500 group relative overflow-hidden rounded-[2.5rem] ${
                  doctor.isAvailable
                    ? "border-zinc-800/50 hover:border-blue-500/40 hover:-translate-y-1 hover:shadow-2xl hover:shadow-black/40"
                    : "border-zinc-800/50 opacity-60"
                }`}
              >
                {/* Background Glow Effect */}
                <div className="absolute -right-10 -top-10 h-40 w-40 bg-blue-600/10 blur-[60px] group-hover:bg-blue-600/20 transition-all" />

                <CardContent className="p-8 space-y-6">
                  {/* Avatar & Rating */}
                  <div className="flex items-start justify-between">
                    <div
                      className={`h-16 w-16 rounded-3xl bg-gradient-to-br ${gradient} flex items-center justify-center shadow-2xl shrink-0 relative overflow-hidden`}
                    >
                      <span className="text-lg font-black text-white tracking-tight">{initials}</span>
                      {doctor.isAvailable && (
                        <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full bg-emerald-400 border-2 border-zinc-950" />
                      )}
                    </div>
                    {doctor.isAvailable ? (
                      <div className="flex items-center gap-1.5 bg-blue-500/10 px-4 py-1.5 rounded-full border border-blue-500/20 backdrop-blur-sm">
                        <Star className="h-3 w-3 text-blue-400 fill-blue-400" />
                        <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">Top Rated</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 bg-red-500/10 px-4 py-1.5 rounded-full border border-red-500/20 backdrop-blur-sm">
                        <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
                        <span className="text-[10px] font-black text-red-400 uppercase tracking-widest">Unavailable</span>
                      </div>
                    )}
                  </div>

                  {/* Info Section */}
                  <div className="space-y-1">
                    <h3 className="text-2xl font-black text-white group-hover:text-blue-400 transition-colors tracking-tight">
                      Dr. {name}
                    </h3>
                    <div className="flex items-center gap-2">
                      <span className={`h-1.5 w-1.5 rounded-full ${doctor.isAvailable ? "bg-emerald-500 animate-pulse" : "bg-zinc-600"}`} />
                      <p className="text-xs text-zinc-500 font-black uppercase tracking-[0.2em]">
                        {doctor.specialization} Specialist
                      </p>
                    </div>
                  </div>

                  {/* Fees & Availability */}
                  <div className="grid grid-cols-2 gap-4 py-4 border-y border-zinc-800/50">
                    <div className="space-y-1">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Consultation</p>
                      <div className="flex items-center gap-1">
                        <IndianRupee className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-sm font-bold text-zinc-200">₹{doctor.fees}</span>
                      </div>
                    </div>
                    <div className="space-y-1 text-right">
                      <p className="text-[10px] font-black text-zinc-600 uppercase tracking-widest">Status</p>
                      <div className="flex items-center gap-1 justify-end">
                        <Clock className="h-3.5 w-3.5 text-orange-500" />
                        <span className="text-sm font-bold text-zinc-200">
                          {doctor.isAvailable
                            ? `${doctor.workingHoursStart} - ${doctor.workingHoursEnd}`
                            : `Offline since ${new Date(doctor.updatedAt).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" })}`}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Action Button */}
                  {doctor.isAvailable ? (
                    <Link
                      href={`/dashboard/patient/book/${doctor.id}`}
                      className="flex items-center justify-between w-full p-5 bg-white text-black rounded-2xl group-hover:bg-blue-600 group-hover:text-white transition-all duration-500 shadow-2xl shadow-white/5 active:scale-95"
                    >
                      <span className="font-black text-[11px] uppercase tracking-[0.2em]">Book Appointment</span>
                      <ArrowRight className="h-5 w-5 group-hover:translate-x-2 transition-transform" />
                    </Link>
                  ) : (
                    <div className="flex items-center justify-center w-full p-5 bg-zinc-900 text-zinc-600 rounded-2xl cursor-not-allowed border border-zinc-800">
                      <span className="font-black text-[11px] uppercase tracking-[0.2em]">Currently Unavailable</span>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })
        ) : (
          <div className="col-span-full py-32 text-center border-2 border-dashed border-zinc-900 rounded-[3rem] bg-zinc-900/10">
            <Stethoscope className="h-12 w-12 text-zinc-800 mx-auto mb-4" />
            <p className="text-zinc-600 font-black uppercase tracking-[0.3em] text-sm italic">
              {doctors.length === 0 ? "No Doctors Available" : "No doctors match your search"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
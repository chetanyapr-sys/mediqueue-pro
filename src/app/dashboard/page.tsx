"use client";

import { motion } from "framer-motion";
import { Stethoscope, UserCircle, ArrowRight, Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { onboardUser } from "@/actions/user";

export default function OnboardingPage() {
  const router = useRouter();
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const handleRoleSelection = async (role: string) => {
    if (isLoading) return;
    
    setIsLoading(true);
    try {
      const selectedRole = role.toUpperCase() as "DOCTOR" | "PATIENT";
      const result = await onboardUser(selectedRole);

      if (result.success) {
        router.push(`/dashboard/${role}`); 
      } else {
        alert("Opps! Database mein save nahi hua: " + result.error);
        setIsLoading(false);
      }
    } catch (error) {
      console.error("Onboarding error:", error);
      setIsLoading(false);
    }
  };

  const cards = [
    {
      role: "doctor",
      title: "I am a Doctor",
      desc: "Manage hospital, patients, and digital queue.",
      icon: <Stethoscope size={24} />,
      color: "from-blue-600/60 to-cyan-500/60",
      glowColor: "rgba(59, 130, 246, 0.15)",
    },
    {
      role: "patient",
      title: "I am a Patient",
      desc: "Book appointments and track your queue status.",
      icon: <UserCircle size={24} />,
      color: "from-emerald-600/60 to-teal-500/60",
      glowColor: "rgba(16, 185, 129, 0.15)",
    }
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white flex flex-col items-center justify-center p-8 relative overflow-hidden">
      
      <motion.div 
        animate={{
          background: hoveredCard === "doctor" 
            ? "radial-gradient(700px at 25% 50%, rgba(59, 130, 246, 0.06), transparent 80%)"
            : hoveredCard === "patient"
              ? "radial-gradient(700px at 75% 50%, rgba(16, 185, 129, 0.06), transparent 80%)"
              : "radial-gradient(700px at 50% 50%, rgba(255, 255, 255, 0.01), transparent 80%)"
        }}
        className="absolute inset-0 pointer-events-none transition-all duration-1000 z-0"
      />
      
      <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.02] pointer-events-none z-0"></div>

      <motion.div 
        initial={{ opacity: 0, y: -12 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-10 z-10"
      >
        <h1 className="text-2xl md:text-3xl font-black tracking-tight mb-2 bg-clip-text text-transparent bg-gradient-to-b from-white to-zinc-500">
          Identify Yourself
        </h1>
        <p className="text-zinc-500 text-sm font-medium max-w-md mx-auto">
          Choose your role to customize your workspace
        </p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-2xl z-10">
        {cards.map((card, index) => (
          <motion.div
            key={card.role}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            whileHover={!isLoading ? { y: -4, scale: 1.01 } : {}}
            onHoverStart={() => !isLoading && setHoveredCard(card.role)}
            onHoverEnd={() => setHoveredCard(null)}
            onClick={() => handleRoleSelection(card.role)}
            className={`group relative ${isLoading ? 'cursor-wait opacity-50' : 'cursor-pointer'}`}
          >
            <div className={`absolute -inset-px rounded-[1.75rem] opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-sm`}
              style={{ background: `linear-gradient(to right, ${card.glowColor}, ${card.glowColor})` }}
            />
            
            <div className="relative h-full bg-zinc-900/40 border border-zinc-800 p-6 rounded-[1.75rem] flex flex-col items-start text-start transition-all duration-300 group-hover:bg-zinc-900/70 group-hover:border-zinc-700 backdrop-blur-xl">
              
              <div className={`mb-4 p-3 rounded-xl bg-zinc-950 border border-zinc-800 text-white group-hover:bg-gradient-to-br ${card.color} transition-all duration-300 shadow-xl`}>
                {card.icon}
              </div>
              
              <h2 className="text-lg font-bold mb-1.5 tracking-tight group-hover:text-cyan-300 transition-colors">
                {card.title}
              </h2>
              
              <p className="text-zinc-500 font-medium mb-5 text-xs leading-relaxed max-w-[220px]">
                {card.desc}
              </p>

              <div className="mt-auto flex items-center gap-1.5 text-[10px] font-black tracking-widest uppercase opacity-40 group-hover:opacity-100 transition-all transform group-hover:translate-x-1">
                {isLoading ? (
                  <span className="flex items-center gap-2">Processing <Loader2 size={12} className="animate-spin" /></span>
                ) : (
                  <>Continue <ArrowRight size={12} /></>
                )}
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      <p className="mt-12 text-zinc-800 text-[10px] font-bold tracking-widest uppercase z-10">
        MediQueue Pro &copy; 2026
      </p>
    </div>
  );
}
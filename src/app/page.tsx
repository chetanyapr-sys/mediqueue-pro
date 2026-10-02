"use client";

import { SignInButton, useAuth, UserButton } from "@clerk/nextjs";
import { ArrowRight, Activity, ShieldCheck, Clock, Zap, Star } from "lucide-react";
import { motion, Variants } from "framer-motion"; 
import { useState, useEffect } from "react"; 
import Link from "next/link";

const fadeUp: Variants = {
  initial: { opacity: 0, y: 30, filter: "blur(15px)", scale: 0.98 },
  animate: { 
    opacity: 1, y: 0, filter: "blur(0px)", scale: 1,
    transition: { duration: 1.2, ease: [0.22, 1, 0.36, 1] }
  }
};

const staggerContainer: Variants = {
  animate: { transition: { staggerChildren: 0.2 } }
};

export default function Home() {
  const { isSignedIn } = useAuth();
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  return (
    <div className="relative min-h-screen w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden font-sans selection:bg-blue-600/30">
      
      {/* Spotlight Effect */}
      <div 
        className="pointer-events-none absolute inset-0 z-30 transition-opacity duration-300 opacity-60"
        style={{
          background: `radial-gradient(600px at ${mousePos.x}px ${mousePos.y}px, rgba(37, 99, 235, 0.15), transparent 80%)`,
        }}
      />

      {/* Background Blobs */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none z-0">
        <motion.div 
          animate={{ scale: [1, 1.1, 1], rotate: [0, 5, 0] }}
          transition={{ duration: 15, repeat: Infinity }}
          className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/20 rounded-full blur-[120px]" 
        />
        <motion.div 
          animate={{ scale: [1.1, 1, 1.1], rotate: [0, -5, 0] }}
          transition={{ duration: 18, repeat: Infinity, delay: 1 }}
          className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-emerald-600/10 rounded-full blur-[120px]" 
        />
        <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-[0.03]"></div>
      </div>

      <motion.main 
        initial="initial"
        animate="animate"
        variants={staggerContainer}
        className="relative z-10 w-full max-w-5xl px-6 py-12 text-center"
      >
        {/* Floating Badge */}
        <motion.div variants={fadeUp} className="group inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-zinc-900/80 border border-zinc-800 text-blue-400 text-xs font-medium mb-10 shadow-[0_0_15px_rgba(59,130,246,0.1)]">
          <Zap size={14} className="text-yellow-500 fill-yellow-500" />
          <span className="tracking-wide">v1.0 Live Hospital Management - Ultra Secure</span>
          <ArrowRight size={12} className="group-hover:translate-x-1 transition-transform" />
        </motion.div>

        {/* Heading */}
        <motion.h1 variants={fadeUp} className="text-6xl md:text-8xl font-black text-white tracking-tighter mb-8 leading-[0.9] drop-shadow-[0_0_20px_rgba(255,255,255,0.05)]">
          Streamline Your Hospital <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 via-emerald-400 to-indigo-400">
            MediQueue Pro
          </span>
        </motion.h1>

        {/* Paragraph */}
        <motion.p variants={fadeUp} className="text-zinc-500 text-lg md:text-xl max-w-2xl mx-auto mb-12 leading-relaxed">
          The ultimate AI-powered queue system for modern healthcare. Reduce wait times, 
          manage appointments, and enhance patient experience effortlessly.
        </motion.p>

        {/* Buttons Section */}
        <motion.div variants={fadeUp} className="mb-24">
          {!isSignedIn ? (
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <SignInButton mode="modal">
                <button className="group relative px-10 py-4 bg-white text-black font-bold rounded-2xl transition-all hover:bg-blue-50 active:scale-95 flex items-center gap-2.5 overflow-hidden hover:scale-105">
                  Get Started Now
                  <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                </button>
              </SignInButton>
              <button className="px-10 py-4 bg-zinc-900 text-zinc-300 border border-zinc-800 rounded-2xl font-bold hover:bg-zinc-800 transition-all active:scale-95">
                Watch Demo
              </button>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-6">
              <div className="p-3 pr-8 bg-zinc-900/60 border border-zinc-800 rounded-full backdrop-blur-xl flex items-center gap-4 shadow-[0_10px_30px_-10px_rgba(0,0,0,0.5)]">
                 <UserButton appearance={{elements: {avatarBox: "h-11 w-11"}}} />
                 <div className="text-left leading-tight">
                    <p className="text-zinc-600 text-xs font-bold uppercase tracking-widest">Signed In As</p>
                    <h3 className="text-white font-black text-lg">MediQueue Developer</h3>
                 </div>
              </div>

              <Link href="/dashboard">
                <button className="px-12 py-4 bg-gradient-to-r from-blue-600 to-blue-500 text-white font-bold rounded-2xl shadow-xl shadow-blue-500/10 hover:scale-105 transition-all">
                  Enter Admin Dashboard
                </button>
              </Link>
            </div>
          )}
        </motion.div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 w-full mt-24">
          {[
            { icon: <Clock />, title: "Live Queue", color: "text-blue-500", desc: "Real-time updates for patients." },
            { icon: <ShieldCheck />, title: "Secure Docs", color: "text-emerald-500", desc: "HIPAA compliant medical records." },
            { icon: <Star />, title: "AI Analytics", color: "text-purple-500", desc: "Optimize your hospital flow." }
          ].map((feature, i) => (
            <motion.div 
              key={i} 
              variants={fadeUp} 
              whileHover={{ y: -8, backgroundColor: "rgba(24, 24, 27, 0.6)" }} 
              className="p-10 bg-zinc-900/30 border border-zinc-800/80 rounded-[2rem] text-left backdrop-blur-sm transition-all relative overflow-hidden group"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className={`p-3 rounded-2xl bg-zinc-950/80 border border-zinc-800 inline-block mb-6 ${feature.color}`}>
                {feature.icon}
              </div>
              <h4 className="text-white font-extrabold text-xl mb-2.5 tracking-tight">{feature.title}</h4>
              <p className="text-zinc-500 text-sm leading-relaxed">{feature.desc}</p>
            </motion.div>
          ))}
        </div>
      </motion.main>
    </div>
  );
}
import ThemeToggle from "@/components/theme-toggle";
import { Settings } from "lucide-react";

export default function PatientSettingsPage() {
  return (
    <div className="p-6 md:p-8 bg-black min-h-screen text-white max-w-2xl mx-auto space-y-8">
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center">
          <Settings className="h-5 w-5 text-zinc-400" />
        </div>
        <div>
          <h1 className="text-2xl font-black tracking-tight">Settings</h1>
          <p className="text-zinc-500 text-sm">Manage your app preferences.</p>
        </div>
      </div>

      <div className="space-y-4">
        <p className="text-[10px] font-black uppercase tracking-widest text-zinc-600">Appearance</p>
        <ThemeToggle />
      </div>
    </div>
  );
}
import React from 'react';
import { Activity, Sparkles } from 'lucide-react';

export default function Header() {
  return (
    <header className="border-b border-slate-800 bg-slate-900/80 backdrop-blur-md px-6 py-4 sticky top-0 z-30">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-gradient-to-tr from-blue-600 via-indigo-600 to-cyan-400 text-white shadow-lg shadow-blue-500/20">
            <Activity className="w-6 h-6 text-cyan-200" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20">
                NASA Space Apps Challenge 2026
              </span>
              <span className="text-xs text-slate-400 hidden sm:inline">
                Crescent Coder Girls
              </span>
            </div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white mt-0.5 flex items-center gap-2">
              <span>TerraPulse</span>
              <span className="text-xs font-normal text-slate-400 hidden md:inline">
                — Discovering the Pulse of a Changing Planet.
              </span>
            </h1>
            <p className="text-xs text-slate-400 md:hidden mt-0.5">
              Discovering the Pulse of a Changing Planet.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 text-xs text-slate-300">
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            <span>30 Global Grid Cells Active</span>
          </div>
          <div className="px-3 py-1.5 rounded-lg bg-slate-800/80 border border-slate-700/60 hidden lg:flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            <span>Study Period: 1990–2024 (35 Yrs)</span>
          </div>
        </div>
      </div>
    </header>
  );
}

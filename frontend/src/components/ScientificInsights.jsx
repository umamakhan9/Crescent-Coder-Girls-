import React, { useState } from 'react';
import { Compass, TrendingUp, TrendingDown, Layers, BarChart3, ChevronDown, ChevronUp } from 'lucide-react';
import { formatCoordinate, formatMetric, formatPValue } from '../utils/formatters';

export default function ScientificInsights({ drivers, comparisons, dataSource }) {
  const [isOpen, setIsOpen] = useState(true);
  const [activeTab, setActiveTab] = useState('comparisons'); // 'comparisons' or 'drivers'

  if ((!drivers || drivers.length === 0) && (!comparisons || comparisons.length === 0)) {
    return null;
  }

  return (
    <div className="rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl overflow-hidden">
      {/* Header Bar */}
      <div
        className="px-6 py-4 flex items-center justify-between cursor-pointer hover:bg-slate-800/40 transition"
        onClick={() => setIsOpen(!isOpen)}
      >
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-white">Scientific Drivers & Regional Divergence</h3>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-indigo-900/60 text-indigo-300 border border-indigo-700/50">
                Person 2 Analysis
              </span>
              {dataSource === 'api' ? (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800">
                  Live API
                </span>
              ) : (
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  CSV Fallback
                </span>
              )}
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Empirical evidence of opposing climate trends and correlation with global mean temperature
            </p>
          </div>
        </div>

        <button className="text-slate-400 hover:text-white transition">
          {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Collapsible Content */}
      {isOpen && (
        <div className="p-6 pt-2 border-t border-slate-800/80 space-y-4">
          {/* Tabs */}
          <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
            <button
              onClick={() => setActiveTab('comparisons')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'comparisons'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Opposing Regional Trends ({comparisons?.length || 0})
            </button>
            <button
              onClick={() => setActiveTab('drivers')}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                activeTab === 'drivers'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              Global Mean Temperature Drivers ({drivers?.length || 0})
            </button>
          </div>

          {/* Tab 1: Opposing Regional Trends */}
          {activeTab === 'comparisons' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {comparisons && comparisons.map((c, i) => {
                const isPositive = Number(c.slope) > 0;
                return (
                  <div
                    key={i}
                    className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-white">{c.variable}</span>
                        <span className="text-xs text-slate-400">at</span>
                        <span className="text-xs font-mono text-cyan-300">
                          {formatCoordinate(c.lat, c.lon)}
                        </span>
                      </div>
                      {isPositive ? (
                        <span className="flex items-center gap-1 text-xs font-semibold text-red-400">
                          <TrendingUp className="w-3.5 h-3.5" /> Warming / Wetting
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-xs font-semibold text-blue-400">
                          <TrendingDown className="w-3.5 h-3.5" /> Cooling / Drying
                        </span>
                      )}
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs pt-2 border-t border-slate-700/40">
                      <div>
                        <span className="text-slate-400 block text-[10px]">Sen Slope:</span>
                        <strong className="text-white font-mono">{formatMetric(c.slope, 4)}</strong>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">95% CI:</span>
                        <span className="text-slate-300 font-mono text-[11px]">
                          [{formatMetric(c.ci_lo, 3)}, {formatMetric(c.ci_hi, 3)}]
                        </span>
                      </div>
                      <div>
                        <span className="text-slate-400 block text-[10px]">p-value:</span>
                        <strong className="text-emerald-400 font-mono">{formatPValue(c.p)}</strong>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Tab 2: Global Mean Drivers */}
          {activeTab === 'drivers' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {drivers && drivers.map((d, i) => (
                <div
                  key={i}
                  className="p-4 rounded-xl bg-slate-800/40 border border-slate-700/50 flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-white">{d.variable}</span>
                      <span className="text-xs text-slate-400">at</span>
                      <span className="text-xs font-mono text-cyan-300">
                        {formatCoordinate(d.lat, d.lon)}
                      </span>
                    </div>
                    <BarChart3 className="w-4 h-4 text-indigo-400" />
                  </div>

                  <p className="text-[11px] text-slate-400 mb-2">
                    Pearson r correlation against latitude-weighted global mean temperature.
                  </p>

                  <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-slate-700/40">
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <span className="text-slate-400 block text-[10px]">Raw Pearson r:</span>
                      <strong className="text-cyan-300 font-mono text-sm">{d.r_raw}</strong>
                      <span className="text-[10px] text-slate-500 block">p = {formatPValue(d.p_raw)}</span>
                    </div>
                    <div className="p-2 rounded-lg bg-slate-900/60">
                      <span className="text-slate-400 block text-[10px]">Detrended r:</span>
                      <strong className="text-indigo-300 font-mono text-sm">{d.r_detrended}</strong>
                      <span className="text-[10px] text-slate-500 block">p = {formatPValue(d.p_detrended)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

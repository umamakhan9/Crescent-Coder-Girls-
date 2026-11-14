import React from 'react';
import { Compass, TrendingUp, TrendingDown, Minus, Activity, ShieldCheck } from 'lucide-react';
import { formatMetric, formatPValue, formatCoordinate } from '../utils/formatters';
import { getTrendColor } from '../utils/colorRules';

export default function KPICards({ selectedCell, variable }) {
  if (!selectedCell) {
    return (
      <div className="p-5 rounded-2xl bg-slate-900/60 border border-slate-800 text-center text-slate-400">
        <Compass className="w-8 h-8 text-slate-500 mx-auto mb-2 animate-bounce" />
        <p className="font-medium text-sm text-slate-300">No Cell Selected</p>
        <p className="text-xs text-slate-500 mt-0.5">Click any grid cell on the map to inspect its trend statistics.</p>
      </div>
    );
  }

  const trendColor = getTrendColor(selectedCell.trend_map);
  const trendCode = selectedCell.trend_map;

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
      {/* Coordinate & Variable Card */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs uppercase tracking-wider font-semibold">Location</span>
          <Compass className="w-4 h-4 text-cyan-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white tracking-tight">
            {formatCoordinate(selectedCell.lat, selectedCell.lon)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5 flex items-center gap-1.5">
            <span>Grid Centroid:</span>
            <code className="text-cyan-300 font-mono">[{selectedCell.lat}, {selectedCell.lon}]</code>
          </div>
        </div>
      </div>

      {/* Slope / Rate of Change */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs uppercase tracking-wider font-semibold">Annual Slope</span>
          <Activity className="w-4 h-4 text-indigo-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white font-mono">
            {formatMetric(selectedCell.slope, 5)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Change per calendar year
          </div>
        </div>
      </div>

      {/* Total Change */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs uppercase tracking-wider font-semibold">Total Change (35y)</span>
          {trendCode === 1 ? (
            <TrendingUp className="w-4 h-4 text-red-400" />
          ) : trendCode === -1 ? (
            <TrendingDown className="w-4 h-4 text-blue-400" />
          ) : (
            <Minus className="w-4 h-4 text-slate-400" />
          )}
        </div>
        <div>
          <div className="text-lg font-bold text-white font-mono">
            {formatMetric(selectedCell.total_change, 4)}
          </div>
          <div className="text-xs text-slate-400 mt-0.5">
            Cumulative 1990–2024
          </div>
        </div>
      </div>

      {/* Significance & FDR p-value */}
      <div className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800/80 shadow-md flex flex-col justify-between">
        <div className="flex items-center justify-between text-slate-400 mb-1">
          <span className="text-xs uppercase tracking-wider font-semibold">FDR p-value</span>
          <ShieldCheck className="w-4 h-4 text-emerald-400" />
        </div>
        <div>
          <div className="text-lg font-bold text-white font-mono">
            {formatPValue(selectedCell.p_fdr)}
          </div>
          <div className="text-xs mt-0.5 flex items-center gap-1.5">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ backgroundColor: trendColor.fillColor }}
            ></span>
            <span className="text-slate-300 font-medium">{trendColor.shortLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

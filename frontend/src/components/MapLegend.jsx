import React, { useState } from 'react';
import { Info, HelpCircle } from 'lucide-react';
import { COLOR_CONFIG } from '../utils/colorRules';

export default function MapLegend() {
  const [showMercatorNote, setShowMercatorNote] = useState(false);

  return (
    <div className="bg-slate-900/95 backdrop-blur-md border border-slate-800 rounded-2xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
          Map Classification (trend_map)
        </h3>
        <button
          onClick={() => setShowMercatorNote(!showMercatorNote)}
          className="text-slate-400 hover:text-cyan-400 text-xs flex items-center gap-1 transition-colors"
          title="Projection Note"
        >
          <HelpCircle className="w-3.5 h-3.5" />
          <span>Projection Info</span>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 text-xs">
        {/* Red: Increase */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <span
            className="w-4 h-4 rounded-md shadow-sm flex-shrink-0"
            style={{ backgroundColor: COLOR_CONFIG.INCREASE.fillColor }}
          ></span>
          <div>
            <div className="font-semibold text-slate-200">Red (1)</div>
            <div className="text-[10px] text-slate-400">Increase</div>
          </div>
        </div>

        {/* Blue: Decrease */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <span
            className="w-4 h-4 rounded-md shadow-sm flex-shrink-0"
            style={{ backgroundColor: COLOR_CONFIG.DECREASE.fillColor }}
          ></span>
          <div>
            <div className="font-semibold text-slate-200">Blue (-1)</div>
            <div className="text-[10px] text-slate-400">Decrease</div>
          </div>
        </div>

        {/* Grey: No Change */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <span
            className="w-4 h-4 rounded-md shadow-sm flex-shrink-0"
            style={{ backgroundColor: COLOR_CONFIG.NEUTRAL.fillColor }}
          ></span>
          <div>
            <div className="font-semibold text-slate-200">Grey (0)</div>
            <div className="text-[10px] text-slate-400">No sig. change</div>
          </div>
        </div>

        {/* Invalid / Missing */}
        <div className="flex items-center gap-2 p-2 rounded-xl bg-slate-800/50 border border-slate-700/40">
          <span className="w-4 h-4 rounded-md border-2 border-dashed border-amber-500 bg-transparent flex-shrink-0"></span>
          <div>
            <div className="font-semibold text-amber-400">Amber (Null)</div>
            <div className="text-[10px] text-slate-400">Missing/Invalid</div>
          </div>
        </div>
      </div>

      {showMercatorNote && (
        <div className="mt-3 p-3 rounded-xl bg-slate-800/90 border border-cyan-500/30 text-slate-300 text-[11px] leading-relaxed flex items-start gap-2.5 animate-fadeIn">
          <Info className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
          <div>
            <strong className="text-cyan-300 font-medium">Safeguard 4 Note (Web Mercator Projection):</strong>
            <p className="mt-0.5 text-slate-300">
              The grid spans latitudes from 60°S to 60°N (outer cell bounds ±75°). In standard Web Mercator (EPSG:3857),
              cells at ±60° latitude appear vertically stretched compared to equatorial cells. Each cell centroid marker
              remains precisely positioned and fully interactive.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

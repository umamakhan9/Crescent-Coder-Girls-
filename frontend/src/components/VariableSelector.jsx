import React from 'react';
import { Thermometer, CloudRain } from 'lucide-react';

export default function VariableSelector({
  variables,
  selectedVariable,
  onSelectVariable,
  validationReport
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 p-1.5 bg-slate-900/90 rounded-2xl border border-slate-800 shadow-inner">
      {variables.map((variable) => {
        const isSelected = selectedVariable.toLowerCase() === variable.toLowerCase();
        const isTemp = variable.toLowerCase().includes('temp');
        const report = validationReport?.[variable];

        return (
          <button
            key={variable}
            onClick={() => onSelectVariable(variable)}
            className={`flex items-center gap-2.5 px-4 py-2 rounded-xl font-medium text-sm transition-all duration-200 ${
              isSelected
                ? 'bg-blue-600 text-white shadow-lg shadow-blue-600/30 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            {isTemp ? (
              <Thermometer className={`w-4 h-4 ${isSelected ? 'text-amber-300' : 'text-slate-400'}`} />
            ) : (
              <CloudRain className={`w-4 h-4 ${isSelected ? 'text-cyan-300' : 'text-slate-400'}`} />
            )}
            <span>{variable}</span>
            <span
              className={`text-xs px-2 py-0.5 rounded-full ${
                isSelected ? 'bg-blue-700/60 text-blue-100' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {report ? `${report.uniqueCells} cells` : '30 cells'}
            </span>
          </button>
        );
      })}
    </div>
  );
}

import React, { useState, useEffect, useMemo } from 'react';
import Header from './components/Header';
import VariableSelector from './components/VariableSelector';
import MapView from './components/MapView';
import MapLegend from './components/MapLegend';
import KPICards from './components/KPICards';
import TimeSeriesChart from './components/TimeSeriesChart';
import ScientificInsights from './components/ScientificInsights';
import { loadDatasets } from './utils/dataLoader';
import { AlertTriangle, RefreshCw, Server, Database } from 'lucide-react';

export default function App() {
  const [dataset, setDataset] = useState(null);
  const [selectedVariable, setSelectedVariable] = useState('Temperature');
  const [selectedCell, setSelectedCell] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);

  // Ingest data with FastAPI probe + CSV fallback
  useEffect(() => {
    let isMounted = true;

    async function initData() {
      try {
        setIsLoading(true);
        setLoadError(null);
        const loaded = await loadDatasets();

        if (!isMounted) return;
        setDataset(loaded);

        // Set default variable
        const initialVar =
          loaded.variables.find((v) => v.toLowerCase() === 'temperature') ||
          loaded.variables[0] ||
          'Temperature';
        setSelectedVariable(initialVar);

        // Select default prominent cell (e.g., Lat: 0, Lon: 30)
        const initialCells = loaded.trends.filter(
          (r) => String(r.variable).trim().toLowerCase() === initialVar.toLowerCase()
        );
        const defaultCell =
          initialCells.find((c) => Number(c.lat) === 0 && Number(c.lon) === 30) ||
          initialCells[0] ||
          null;

        setSelectedCell(defaultCell);
      } catch (err) {
        if (!isMounted) return;
        console.error('Failed to initialize datasets:', err);
        setLoadError(err.message || 'Failed to load datasets.');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    initData();

    return () => {
      isMounted = false;
    };
  }, []);

  // Filter 30 cells for currently selected variable
  const activeCells = useMemo(() => {
    if (!dataset || !dataset.trends) return [];
    return dataset.trends.filter(
      (row) => String(row.variable).trim().toLowerCase() === selectedVariable.toLowerCase()
    );
  }, [dataset, selectedVariable]);

  // Synchronize selected cell when variable changes
  const currentCellData = useMemo(() => {
    if (!selectedCell || activeCells.length === 0) return null;
    return (
      activeCells.find(
        (c) =>
          Number(c.lat) === Number(selectedCell.lat) &&
          Number(c.lon) === Number(selectedCell.lon)
      ) || activeCells[0]
    );
  }, [activeCells, selectedCell]);

  // Fetch 35-year time series for selected cell
  const activeTimeSeries = useMemo(() => {
    if (!dataset || !currentCellData) return [];
    return dataset.getYearlySeries(
      selectedVariable,
      currentCellData.lat,
      currentCellData.lon
    );
  }, [dataset, selectedVariable, currentCellData]);

  // Handle variable change
  const handleVariableChange = (newVar) => {
    setSelectedVariable(newVar);
    // Keep coordinates if available in new variable
    if (selectedCell && dataset) {
      const match = dataset.trends.find(
        (r) =>
          String(r.variable).trim().toLowerCase() === newVar.toLowerCase() &&
          Number(r.lat) === Number(selectedCell.lat) &&
          Number(r.lon) === Number(selectedCell.lon)
      );
      if (match) {
        setSelectedCell(match);
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0b0f19] text-slate-100 flex flex-col font-sans">
      <Header />

      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Loading Spinner */}
        {isLoading && (
          <div className="min-h-[500px] flex flex-col items-center justify-center space-y-4">
            <RefreshCw className="w-10 h-10 text-blue-500 animate-spin" />
            <p className="text-sm font-medium text-slate-400">
              Loading and validating NASA Earth system datasets...
            </p>
          </div>
        )}

        {/* Error Notification */}
        {loadError && (
          <div className="p-6 rounded-2xl bg-red-950/40 border border-red-500/30 text-red-200 flex items-start gap-4">
            <AlertTriangle className="w-6 h-6 text-red-400 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-red-100">Dataset Loading Error</h3>
              <p className="text-sm text-red-300 mt-1">{loadError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-3 px-4 py-1.5 rounded-lg bg-red-600 hover:bg-red-500 text-white text-xs font-semibold transition"
              >
                Retry
              </button>
            </div>
          </div>
        )}

        {!isLoading && !loadError && dataset && (
          <>
            {/* Top Controls: Variable Selector and High-level Summary */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
              <VariableSelector
                variables={dataset.variables}
                selectedVariable={selectedVariable}
                onSelectVariable={handleVariableChange}
                validationReport={dataset.validationReport}
              />

              <div className="flex flex-wrap items-center gap-3 text-xs text-slate-400">
                {/* Live Data Source Indicator */}
                {dataset.source === 'api' ? (
                  <div className="px-3 py-1 rounded-xl bg-emerald-950/60 border border-emerald-600/40 text-emerald-300 flex items-center gap-1.5 font-medium shadow-sm">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
                    <Server className="w-3.5 h-3.5" />
                    <span>FastAPI Backend Connected</span>
                  </div>
                ) : (
                  <div className="px-3 py-1 rounded-xl bg-amber-950/50 border border-amber-600/40 text-amber-300 flex items-center gap-1.5 font-medium shadow-sm">
                    <Database className="w-3.5 h-3.5" />
                    <span>Static CSV Fallback Active</span>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <span>Active Variable:</span>
                  <span className="font-semibold text-cyan-300">{selectedVariable}</span>
                  <span className="text-slate-600">|</span>
                  <span>30 Grid Cells</span>
                </div>
              </div>
            </div>

            {/* KPI Cards for the active cell */}
            <KPICards selectedCell={currentCellData} variable={selectedVariable} />

            {/* Main Interactive Grid: Map + Chart Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
              {/* Map & Legend Column */}
              <div className="lg:col-span-7 space-y-4">
                <MapView
                  cells={activeCells}
                  selectedVariable={selectedVariable}
                  selectedCell={currentCellData}
                  onSelectCell={(cell) => setSelectedCell(cell)}
                />

                <MapLegend />
              </div>

              {/* Historical Time-Series Chart Column */}
              <div className="lg:col-span-5 space-y-4">
                <TimeSeriesChart
                  selectedCell={currentCellData}
                  timeSeries={activeTimeSeries}
                  variable={selectedVariable}
                />
              </div>
            </div>

            {/* Scientific Insights: Drivers & Regional Opposing Trends */}
            <ScientificInsights
              drivers={dataset.drivers}
              comparisons={dataset.comparisons}
              dataSource={dataset.source}
            />
          </>
        )}
      </main>

      <footer className="mt-auto border-t border-slate-800/80 bg-slate-900/60 py-4 px-6 text-center text-xs text-slate-500">
        <p>NASA Space Apps Challenge 2026 — Be An Earth System Trend Detective!</p>
        <p className="text-[11px] text-slate-600 mt-1">
          Historical datasets (1990–2024) verified and processed without alteration · Crescent Coder Girls
        </p>
      </footer>
    </div>
  );
}

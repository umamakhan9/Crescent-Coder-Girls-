import React, { useMemo } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { LineChart as ChartIcon, Calendar, Info } from 'lucide-react';
import { formatCoordinate, formatMetric } from '../utils/formatters';
import { getTrendColor } from '../utils/colorRules';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

// Custom inline plugin for an explicit, high-contrast horizontal zero reference line
const zeroLinePlugin = {
  id: 'zeroLinePlugin',
  afterDraw(chart) {
    const { ctx, chartArea, scales } = chart;
    const yScale = scales.y;
    if (!yScale || !chartArea) return;

    const zeroPixel = yScale.getPixelForValue(0);
    // Draw only if zero falls within chart bounds
    if (zeroPixel >= chartArea.top && zeroPixel <= chartArea.bottom) {
      ctx.save();
      ctx.beginPath();
      ctx.setLineDash([6, 6]);
      ctx.lineWidth = 1.75;
      ctx.strokeStyle = '#94a3b8'; // Slate 400 reference line
      ctx.moveTo(chartArea.left, zeroPixel);
      ctx.lineTo(chartArea.right, zeroPixel);
      ctx.stroke();

      // Zero label on the right axis
      ctx.fillStyle = '#cbd5e1';
      ctx.font = 'bold 10px sans-serif';
      ctx.textAlign = 'right';
      ctx.fillText('0.0 (Baseline)', chartArea.right - 6, zeroPixel - 5);
      ctx.restore();
    }
  }
};

export default function TimeSeriesChart({ selectedCell, timeSeries, variable }) {
  if (!selectedCell || !timeSeries || timeSeries.length === 0) {
    return (
      <div className="h-80 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col items-center justify-center p-6 text-center text-slate-500">
        <ChartIcon className="w-10 h-10 text-slate-600 mb-2" />
        <p className="font-medium text-slate-300">Historical Time-Series View</p>
        <p className="text-xs text-slate-500 max-w-sm mt-1">
          Select any grid cell on the map to display its 35-year annual anomaly curve (1990–2024).
        </p>
      </div>
    );
  }

  const trendColor = getTrendColor(selectedCell.trend_map);
  const years = useMemo(() => timeSeries.map((d) => d.year), [timeSeries]);
  const values = useMemo(() => timeSeries.map((d) => d.value), [timeSeries]);

  const chartData = useMemo(() => {
    return {
      labels: years,
      datasets: [
        {
          label: `${variable} Anomaly`,
          data: values,
          borderColor: trendColor.fillColor,
          backgroundColor: `${trendColor.fillColor}22`,
          pointBackgroundColor: trendColor.fillColor,
          pointBorderColor: '#0f172a',
          pointHoverBackgroundColor: '#ffffff',
          pointHoverBorderColor: trendColor.fillColor,
          pointRadius: 3.5,
          pointHoverRadius: 6,
          pointBorderWidth: 1.5,
          tension: 0.25,
          fill: true
        }
      ]
    };
  }, [years, values, trendColor, variable]);

  const options = useMemo(() => {
    return {
      responsive: true,
      maintainAspectRatio: false,
      interaction: {
        mode: 'index',
        intersect: false
      },
      plugins: {
        legend: {
          display: true,
          position: 'top',
          labels: {
            color: '#cbd5e1',
            font: { size: 12, weight: '500' },
            boxWidth: 14,
            usePointStyle: true
          }
        },
        tooltip: {
          backgroundColor: '#0f172a',
          titleColor: '#e2e8f0',
          bodyColor: '#94a3b8',
          borderColor: '#334155',
          borderWidth: 1,
          padding: 10,
          displayColors: false,
          callbacks: {
            title: (items) => `Year: ${items[0].label}`,
            label: (item) => `Anomaly Value: ${formatMetric(item.parsed.y, 4)}`
          }
        }
      },
      scales: {
        x: {
          grid: {
            color: '#1e293b'
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            maxRotation: 0,
            autoSkip: true,
            maxTicksLimit: 12
          }
        },
        y: {
          grid: {
            color: '#1e293b'
          },
          ticks: {
            color: '#94a3b8',
            font: { size: 11 },
            callback: (val) => Number(val).toFixed(2)
          }
        }
      }
    };
  }, []);

  return (
    <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800 shadow-xl flex flex-col justify-between">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-cyan-400" />
              <span>35-Year Historical Time Series (1990–2024)</span>
            </h2>
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
              {timeSeries.length} Observations
            </span>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Cell Location: <strong className="text-slate-200">{formatCoordinate(selectedCell.lat, selectedCell.lon)}</strong>
            {' · '}Annual deviation measurements from <code className="text-cyan-300">clean_yearly.csv</code>
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-400">
          <span className="w-2.5 h-0.5 bg-slate-400 inline-block"></span>
          <span>Zero Reference Line (y = 0)</span>
        </div>
      </div>

      <div className="h-72 w-full">
        <Line data={chartData} options={options} plugins={[zeroLinePlugin]} />
      </div>

      <div className="mt-3 pt-3 border-t border-slate-800/80 flex items-center justify-between text-[11px] text-slate-400">
        <div className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-cyan-400 flex-shrink-0" />
          <span>Horizontal dashed line denotes zero baseline. Values above/below represent annual anomalies.</span>
        </div>
        <span className="font-mono text-slate-500 hidden sm:inline">1990 — 2024</span>
      </div>
    </div>
  );
}

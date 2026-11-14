import Papa from 'papaparse';
import { getCoordinateKey } from './geoGrid';

/**
 * Enhanced Data Loader with FastAPI Integration & Zero-Failure CSV Fallback.
 *
 * Primary: Queries FastAPI backend (/api/health, /api/trends, /api/drivers, etc.)
 * Fallback: Parses local static CSVs via PapaParse if backend is unavailable.
 */

const API_BASE_URL = (typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL) || 'http://localhost:8000';

/**
 * Checks if the FastAPI backend is running and healthy.
 */
async function checkBackendHealth() {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 2000);

    // Try relative /api/health first (works with Vite proxy), fallback to absolute URL
    let res = await fetch('/api/health', { signal: controller.signal }).catch(() => null);
    if (!res || !res.ok) {
      res = await fetch(`${API_BASE_URL}/api/health`, { signal: controller.signal }).catch(() => null);
    }

    clearTimeout(timeoutId);
    if (res && res.ok) {
      const data = await res.json();
      return { isHealthy: true, data };
    }
  } catch (err) {
    // Backend probe failed
  }
  return { isHealthy: false, data: null };
}

/**
 * Parse a CSV file using PapaParse.
 */
async function parseCsvUrl(url) {
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: HTTP ${res.status}`);
  }
  const text = await res.text();
  const parsed = Papa.parse(text, {
    header: true,
    dynamicTyping: true,
    skipEmptyLines: true,
  });
  return parsed.data;
}

/**
 * Index time series data by key: "variable__lat_lon".
 */
function buildYearlyIndex(yearlyRows) {
  const yearlyIndex = new Map();

  for (const row of yearlyRows) {
    if (!row.variable || row.year === undefined || row.value === undefined) continue;
    const v = String(row.variable).trim();
    const coordKey = getCoordinateKey(row.lat, row.lon);
    const fullKey = `${v.toLowerCase()}__${coordKey}`;

    if (!yearlyIndex.has(fullKey)) {
      yearlyIndex.set(fullKey, []);
    }

    yearlyIndex.get(fullKey).push({
      year: Number(row.year),
      value: Number(row.value),
    });
  }

  // Sort time series chronologically
  for (const series of yearlyIndex.values()) {
    series.sort((a, b) => a.year - b.year);
  }

  return yearlyIndex;
}

/**
 * Build Safeguard 1 Validation Report across all variables.
 */
function buildValidationReport(trendsRows) {
  const variableMap = new Map();

  for (const row of trendsRows) {
    if (!row.variable) continue;
    const v = String(row.variable).trim();
    if (!variableMap.has(v)) {
      variableMap.set(v, []);
    }
    variableMap.get(v).push(row);
  }

  const validationReport = {};

  for (const [variable, rows] of variableMap.entries()) {
    const coordSet = new Set();
    for (const r of rows) {
      coordSet.add(getCoordinateKey(r.lat, r.lon));
    }

    validationReport[variable] = {
      totalRows: rows.length,
      uniqueCells: coordSet.size,
      isValid: coordSet.size === 30 && rows.length === 30,
    };
  }

  return { variableMap, validationReport };
}

/**
 * Main Loader: Connects to FastAPI Backend with Automatic CSV Fallback.
 */
export async function loadDatasets() {
  const health = await checkBackendHealth();

  let rawTrends = [];
  let rawYearly = [];
  let rawDrivers = [];
  let rawComparisons = [];
  let dataSource = 'csv_fallback';

  if (health.isHealthy) {
    try {
      console.log('⚡ [DataLayer] FastAPI backend connected successfully at:', API_BASE_URL);

      // Fetch trends, drivers, and comparisons in parallel from FastAPI
      const [trendsRes, driversRes, comparisonsRes] = await Promise.all([
        fetch('/api/trends').catch(() => fetch(`${API_BASE_URL}/api/trends`)),
        fetch('/api/drivers').catch(() => fetch(`${API_BASE_URL}/api/drivers`)),
        fetch('/api/comparisons').catch(() => fetch(`${API_BASE_URL}/api/comparisons`)),
      ]);

      if (trendsRes && trendsRes.ok) {
        const trendsJson = await trendsRes.json();
        rawTrends = trendsJson.trends || [];
      }

      if (driversRes && driversRes.ok) {
        const driversJson = await driversRes.json();
        rawDrivers = driversJson.drivers || [];
      }

      if (comparisonsRes && comparisonsRes.ok) {
        const compJson = await comparisonsRes.json();
        rawComparisons = compJson.comparisons || [];
      }

      // For instant client-side time-series scrubbing, also fetch the yearly CSV
      try {
        rawYearly = await parseCsvUrl('/data/clean_yearly.csv');
      } catch (err) {
        console.warn('Could not pre-load clean_yearly.csv, will use API series endpoint:', err);
      }

      dataSource = 'api';
    } catch (err) {
      console.warn('⚡ [DataLayer] API data fetch error. Falling back to static CSVs:', err);
      dataSource = 'csv_fallback';
    }
  }

  // If backend was offline or API fetch failed, execute complete CSV fallback
  if (dataSource === 'csv_fallback') {
    console.log('📂 [DataLayer] Using static CSV fallback datasets from /data/');

    const [trendsCsv, yearlyCsv] = await Promise.all([
      parseCsvUrl('/data/trend_results.csv'),
      parseCsvUrl('/data/clean_yearly.csv'),
    ]);

    rawTrends = trendsCsv;
    rawYearly = yearlyCsv;

    // Optional supplementary CSVs
    try {
      rawDrivers = await parseCsvUrl('/data/driver_correlation.csv');
    } catch (e) {
      rawDrivers = [];
    }
    try {
      rawComparisons = await parseCsvUrl('/data/opposite_trends.csv');
    } catch (e) {
      rawComparisons = [];
    }
  }

  // Validate Safeguard 1
  const { variableMap, validationReport } = buildValidationReport(rawTrends);
  const yearlyIndex = buildYearlyIndex(rawYearly);

  return {
    source: dataSource,
    backendStatus: health.data,
    backendUrl: API_BASE_URL,
    trends: rawTrends,
    variables: Array.from(variableMap.keys()),
    validationReport,
    drivers: rawDrivers,
    comparisons: rawComparisons,

    // Fast synchronous getter from in-memory index
    getYearlySeries: (variable, lat, lon) => {
      const coordKey = getCoordinateKey(lat, lon);
      const fullKey = `${String(variable).trim().toLowerCase()}__${coordKey}`;
      return yearlyIndex.get(fullKey) || [];
    },

    // Async getter directly from FastAPI /api/series endpoint with local fallback
    fetchSeriesFromApi: async (variable, lat, lon) => {
      try {
        const url = `/api/series?variable=${encodeURIComponent(variable)}&lat=${lat}&lon=${lon}`;
        const res = await fetch(url).catch(() => fetch(`${API_BASE_URL}${url}`));
        if (res && res.ok) {
          const json = await res.json();
          return json.series || [];
        }
      } catch (err) {
        // Fallback to in-memory
      }
      const coordKey = getCoordinateKey(lat, lon);
      return yearlyIndex.get(`${String(variable).trim().toLowerCase()}__${coordKey}`) || [];
    },

    // Async getter directly from FastAPI /api/stats endpoint
    fetchStatsFromApi: async (variable, lat, lon) => {
      try {
        const url = `/api/stats?variable=${encodeURIComponent(variable)}&lat=${lat}&lon=${lon}`;
        const res = await fetch(url).catch(() => fetch(`${API_BASE_URL}${url}`));
        if (res && res.ok) {
          return await res.json();
        }
      } catch (err) {
        // Return null if API is unreachable
      }
      return null;
    },
  };
}

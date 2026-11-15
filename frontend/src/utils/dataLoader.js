import Papa from 'papaparse';
import { getCoordinateKey } from './geoGrid';

/**
 * Enhanced Data Loader with FastAPI Integration & Zero-Failure CSV Fallback.
 *
 * Primary: Queries FastAPI backend (/api/health, /api/trends, /api/drivers, etc.)
 * Fallback: Parses local static CSVs via PapaParse if backend is unavailable.
 */

const RAW_API_BASE =
  typeof import.meta !== 'undefined' && import.meta.env?.VITE_API_URL
    ? import.meta.env.VITE_API_URL.replace(/\/$/, '')
    : '';

const API_BASE_URL = RAW_API_BASE || 'http://localhost:8000';

/**
 * Checks if the FastAPI backend is running and healthy.
 */
async function checkBackendHealth() {
  const controller = new AbortController();
  // 3.5-second probe timeout
  const timeoutId = setTimeout(() => controller.abort(), 3500);

  // If RAW_API_BASE is provided (e.g. Render hosted backend), probe it first
  const candidates = [];
  if (RAW_API_BASE) {
    candidates.push(`${RAW_API_BASE}/api/health`);
  }
  candidates.push('/api/health');
  if (!RAW_API_BASE && API_BASE_URL) {
    candidates.push(`${API_BASE_URL}/api/health`);
  }

  for (const url of candidates) {
    try {
      const res = await fetch(url, { signal: controller.signal });
      const cType = res.headers.get('content-type') || '';
      if (res.ok && cType.includes('application/json')) {
        const data = await res.json();
        clearTimeout(timeoutId);
        const resolvedBase = url.endsWith('/api/health')
          ? url.slice(0, -'/api/health'.length)
          : '';
        return { isHealthy: true, data, activeBase: resolvedBase };
      }
    } catch (e) {
      // Continue to next probe candidate
    }
  }

  clearTimeout(timeoutId);
  return { isHealthy: false, data: null, activeBase: '' };
}

/**
 * Parse a CSV file using PapaParse with automatic path normalization.
 */
async function parseCsvUrl(url) {
  let res = await fetch(url).catch(() => null);
  if (!res || !res.ok) {
    const altUrl = url.startsWith('/data/')
      ? url.replace('/data/', '/Data/')
      : url.replace('/Data/', '/data/');
    res = await fetch(altUrl).catch(() => null);
  }
  if (!res || !res.ok) {
    throw new Error(`Failed to fetch CSV from ${url}: HTTP ${res?.status}`);
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
  const activeBase = health.isHealthy ? health.activeBase : '';

  let rawTrends = [];
  let rawYearly = [];
  let rawDrivers = [];
  let rawComparisons = [];
  let dataSource = 'csv_fallback';

  if (health.isHealthy) {
    try {
      console.log('⚡ [DataLayer] FastAPI backend connected successfully at:', activeBase || 'local proxy');

      const fetchApi = async (endpoint) => {
        const primary = activeBase ? `${activeBase}${endpoint}` : endpoint;
        let r = await fetch(primary).catch(() => null);
        if (!r || !r.ok) {
          r = await fetch(endpoint).catch(() => null);
        }
        return r;
      };

      // Fetch trends, drivers, and comparisons in parallel from FastAPI
      const [trendsRes, driversRes, comparisonsRes] = await Promise.all([
        fetchApi('/api/trends'),
        fetchApi('/api/drivers'),
        fetchApi('/api/comparisons'),
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
    backendUrl: activeBase || API_BASE_URL,
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
        const query = `/api/series?variable=${encodeURIComponent(variable)}&lat=${lat}&lon=${lon}`;
        const primary = activeBase ? `${activeBase}${query}` : query;
        let res = await fetch(primary).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(query).catch(() => null);
        }
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
        const query = `/api/stats?variable=${encodeURIComponent(variable)}&lat=${lat}&lon=${lon}`;
        const primary = activeBase ? `${activeBase}${query}` : query;
        let res = await fetch(primary).catch(() => null);
        if (!res || !res.ok) {
          res = await fetch(query).catch(() => null);
        }
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

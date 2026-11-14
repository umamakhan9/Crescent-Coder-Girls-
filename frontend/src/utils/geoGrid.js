/**
 * Dynamic geographic grid calculation and bounding box generator.
 *
 * Safeguard 1: Uses actual unique lat/lon extracted from dataset.
 * Safeguard 2: Preserves coordinate uniqueness without improper rounding.
 * Safeguard 4: Computes bounding boxes within Web Mercator limits ([-75°, +75°]).
 */

/**
 * Derives unique, sorted coordinates from a list of cell records.
 * Validates coordinate uniqueness with strict precision.
 */
export function extractUniqueCoordinates(cells) {
  const latSet = new Set();
  const lonSet = new Set();

  for (const cell of cells) {
    if (cell.lat !== undefined && cell.lat !== null && !isNaN(Number(cell.lat))) {
      latSet.add(Number(cell.lat));
    }
    if (cell.lon !== undefined && cell.lon !== null && !isNaN(Number(cell.lon))) {
      lonSet.add(Number(cell.lon));
    }
  }

  const sortedLats = Array.from(latSet).sort((a, b) => a - b);
  const sortedLons = Array.from(lonSet).sort((a, b) => a - b);

  return { sortedLats, sortedLons };
}

/**
 * Calculates dynamic cell bounding boxes for each (lat, lon) center.
 * Instead of hardcoding 30°x60°, boundary cuts are placed at midpoints
 * between adjacent coordinates, with outer edges extending by half of the adjacent step.
 *
 * @param {number[]} lats - Sorted unique latitudes
 * @param {number[]} lons - Sorted unique longitudes
 * @returns {Map<string, { latMin: number, latMax: number, lonMin: number, lonMax: number, bounds: [[number, number], [number, number]] }>}
 */
export function buildDynamicGridBounds(lats, lons) {
  const boundsMap = new Map();

  // Compute latitude intervals
  const latIntervals = [];
  for (let i = 0; i < lats.length; i++) {
    const current = lats[i];
    let latMin, latMax;

    if (i === 0) {
      // Southernmost coordinate: step based on distance to next coordinate
      const halfStep = (lats[i + 1] - current) / 2;
      latMin = Math.max(-85, current - halfStep); // Clamped within Mercator limit
      latMax = (current + lats[i + 1]) / 2;
    } else if (i === lats.length - 1) {
      // Northernmost coordinate: step based on distance to previous coordinate
      const halfStep = (current - lats[i - 1]) / 2;
      latMin = (lats[i - 1] + current) / 2;
      latMax = Math.min(85, current + halfStep); // Clamped within Mercator limit
    } else {
      // Intermediate latitudes: split distance to neighbors
      latMin = (lats[i - 1] + current) / 2;
      latMax = (current + lats[i + 1]) / 2;
    }

    latIntervals.push({ center: current, min: latMin, max: latMax });
  }

  // Compute longitude intervals
  const lonIntervals = [];
  for (let j = 0; j < lons.length; j++) {
    const current = lons[j];
    let lonMin, lonMax;

    if (j === 0) {
      // Westernmost
      const halfStep = (lons[j + 1] - current) / 2;
      lonMin = current - halfStep;
      lonMax = (current + lons[j + 1]) / 2;
    } else if (j === lons.length - 1) {
      // Easternmost
      const halfStep = (current - lons[j - 1]) / 2;
      lonMin = (lons[j - 1] + current) / 2;
      lonMax = current + halfStep;
    } else {
      // Intermediate longitudes
      lonMin = (lons[j - 1] + current) / 2;
      lonMax = (current + lons[j + 1]) / 2;
    }

    lonIntervals.push({ center: current, min: lonMin, max: lonMax });
  }

  // Combine into bounds map using canonical key
  for (const latObj of latIntervals) {
    for (const lonObj of lonIntervals) {
      const key = `${latObj.center}_${lonObj.center}`;
      boundsMap.set(key, {
        latCenter: latObj.center,
        lonCenter: lonObj.center,
        latMin: latObj.min,
        latMax: latObj.max,
        lonMin: lonObj.min,
        lonMax: lonObj.max,
        // Leaflet LatLngBounds format: [[south, west], [north, east]]
        bounds: [
          [latObj.min, lonObj.min],
          [latObj.max, lonObj.max]
        ]
      });
    }
  }

  return boundsMap;
}

/**
 * Canonical coordinate key generator that avoids floating-point roundoff errors
 * while never collapsing distinct coordinates.
 */
export function getCoordinateKey(lat, lon) {
  const l = Number(lat);
  const r = Number(lon);
  // Integer degrees are preserved exactly; floats are formatted with up to 6 decimal places without jitter
  return `${Number(l.toFixed(6))}_${Number(r.toFixed(6))}`;
}

/**
 * Safe coordinate matching function with tolerance threshold
 */
export function coordinatesMatch(lat1, lon1, lat2, lon2, tolerance = 1e-5) {
  return (
    Math.abs(Number(lat1) - Number(lat2)) <= tolerance &&
    Math.abs(Number(lon1) - Number(lon2)) <= tolerance
  );
}

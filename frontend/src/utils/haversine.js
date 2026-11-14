/**
 * Spherical distance calculation using the Haversine formula
 * with longitude wraparound normalization across the antimeridian (±180°).
 */

const EARTH_RADIUS_KM = 6371.0;

/**
 * Normalizes longitude difference into [-180, 180] degrees to account for wraparound
 */
export function normalizeDeltaLon(lon1, lon2) {
  const diff = (lon1 - lon2) % 360;
  return ((diff + 540) % 360) - 180;
}

/**
 * Calculates great-circle distance between two points in kilometers.
 *
 * @param {number} lat1 - Latitude of point 1 (degrees)
 * @param {number} lon1 - Longitude of point 1 (degrees)
 * @param {number} lat2 - Latitude of point 2 (degrees)
 * @param {number} lon2 - Longitude of point 2 (degrees)
 * @returns {number} Distance in kilometers
 */
export function haversineDistance(lat1, lon1, lat2, lon2) {
  const dLatRad = ((lat2 - lat1) * Math.PI) / 180;
  const dLonDeg = normalizeDeltaLon(lon2, lon1);
  const dLonRad = (dLonDeg * Math.PI) / 180;

  const lat1Rad = (lat1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;

  const a =
    Math.sin(dLatRad / 2) * Math.sin(dLatRad / 2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * Math.sin(dLonRad / 2) * Math.sin(dLonRad / 2);

  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

  return EARTH_RADIUS_KM * c;
}

/**
 * Finds the nearest cell among a list of cells to a target (lat, lon).
 *
 * @param {number} clickLat - Clicked latitude
 * @param {number} clickLon - Clicked longitude
 * @param {Array<{lat: number, lon: number}>} cells - Available cells
 * @returns {{ cell: object, distanceKm: number } | null}
 */
export function findNearestGridCell(clickLat, clickLon, cells) {
  if (!cells || cells.length === 0) return null;

  let nearestCell = null;
  let minDistance = Infinity;

  for (const cell of cells) {
    const dist = haversineDistance(clickLat, clickLon, Number(cell.lat), Number(cell.lon));
    if (dist < minDistance) {
      minDistance = dist;
      nearestCell = cell;
    }
  }

  return {
    cell: nearestCell,
    distanceKm: minDistance
  };
}

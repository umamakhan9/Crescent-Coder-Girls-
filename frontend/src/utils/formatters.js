/**
 * Scientific number formatters and sanitizers.
 *
 * Safeguard 3: Preserve scientific numerical values exactly.
 * Only normalize actual negative zero for display.
 * Do not convert legitimate small values (such as 0.0000000000005) into zero.
 */

/**
 * Normalizes literal negative zero (-0) to positive zero (0).
 * Leaves all legitimate non-zero numbers (including very small decimals) intact.
 */
export function sanitizeNegativeZero(val) {
  if (typeof val !== 'number') {
    val = Number(val);
  }
  // Check specifically for IEEE 754 negative zero (-0.0)
  if (val === 0 && (Object.is(val, -0) || 1 / val === -Infinity)) {
    return 0;
  }
  return val;
}

/**
 * Formats a decimal number with fixed precision or scientific notation for tiny numbers.
 * @param {number|string} val
 * @param {number} decimals
 * @returns {string}
 */
export function formatMetric(val, decimals = 4) {
  if (val === null || val === undefined || isNaN(Number(val))) {
    return 'N/A';
  }
  const num = sanitizeNegativeZero(Number(val));

  // If the number is zero
  if (num === 0) {
    return (0).toFixed(decimals);
  }

  // If the number is extremely small in absolute magnitude, use scientific notation
  const abs = Math.abs(num);
  if (abs < 0.0001 && abs > 0) {
    return num.toExponential(3);
  }

  return num.toFixed(decimals);
}

/**
 * Formats a p-value with scientific notation when very small
 */
export function formatPValue(p) {
  if (p === null || p === undefined || isNaN(Number(p))) {
    return 'N/A';
  }
  const num = sanitizeNegativeZero(Number(p));
  if (num === 0) return '0.000';
  if (num < 0.001) {
    return num.toExponential(3);
  }
  return num.toFixed(4);
}

/**
 * Formats coordinates for human-readable labels
 * Example: lat -60 -> "60°S", lon -150 -> "150°W"
 */
export function formatCoordinate(lat, lon) {
  const latNum = Number(lat);
  const lonNum = Number(lon);

  const latStr = latNum === 0 ? '0°' : latNum > 0 ? `${latNum}°N` : `${Math.abs(latNum)}°S`;
  const lonStr = lonNum === 0 ? '0°' : lonNum > 0 ? `${lonNum}°E` : `${Math.abs(lonNum)}°W`;

  return `${latStr}, ${lonStr}`;
}

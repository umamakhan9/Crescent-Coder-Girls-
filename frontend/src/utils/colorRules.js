/**
 * Strict color rules derived solely from trend_map.
 *
 * Rules:
 *   trend_map = 1: Red
 *   trend_map = -1: Blue
 *   trend_map = 0: Grey
 *   Missing or invalid values: Handled separately, NEVER automatically classified as grey.
 */

export const COLOR_CONFIG = {
  INCREASE: {
    code: 1,
    fillColor: '#ef4444',      // Red (tailwind red-500)
    strokeColor: '#b91c1c',    // Dark red
    label: 'Increase (trend_map = 1)',
    shortLabel: 'Increase',
    status: 'valid'
  },
  DECREASE: {
    code: -1,
    fillColor: '#3b82f6',      // Blue (tailwind blue-500)
    strokeColor: '#1d4ed8',    // Dark blue
    label: 'Decrease (trend_map = -1)',
    shortLabel: 'Decrease',
    status: 'valid'
  },
  NEUTRAL: {
    code: 0,
    fillColor: '#9ca3af',      // Grey (tailwind gray-400)
    strokeColor: '#4b5563',    // Dark grey
    label: 'No significant change (trend_map = 0)',
    shortLabel: 'No significant change',
    status: 'valid'
  },
  INVALID: {
    code: null,
    fillColor: 'transparent',  // Distinct pattern or transparent fill
    strokeColor: '#f59e0b',    // Warning amber
    dashArray: '5, 5',
    label: 'Missing / Invalid trend_map',
    shortLabel: 'Invalid Data',
    status: 'invalid'
  }
};

export function getTrendColor(trendMap) {
  // Explicitly reject null, undefined, boolean, or empty string before number conversion
  if (
    trendMap === null ||
    trendMap === undefined ||
    trendMap === '' ||
    typeof trendMap === 'boolean'
  ) {
    return COLOR_CONFIG.INVALID;
  }

  const val = Number(trendMap);
  if (isNaN(val)) {
    return COLOR_CONFIG.INVALID;
  }

  if (val === 1) {
    return COLOR_CONFIG.INCREASE;
  }
  if (val === -1) {
    return COLOR_CONFIG.DECREASE;
  }
  if (val === 0) {
    return COLOR_CONFIG.NEUTRAL;
  }

  // Any other number (e.g., 2, -2, 999) is invalid
  return COLOR_CONFIG.INVALID;
}

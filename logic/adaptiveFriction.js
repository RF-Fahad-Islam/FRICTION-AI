/**
 * Adaptive Friction Engine (Module M8)
 * Calculates optimal friction level based on user profile, brainrot score, and context.
 */

/** Friction level configurations */
export const FRICTION_LEVELS = {
  1: {
    label: 'Gentle',
    scrollDelay: 200,
    overlayOpacity: 0.1,
    cooldown: 0,
    popupType: null,
    description: 'Slight scroll resistance',
  },
  2: {
    label: 'Moderate',
    scrollDelay: 500,
    overlayOpacity: 0.2,
    cooldown: 30,
    popupType: 'intent',
    description: 'Noticeable delay + intent check',
  },
  3: {
    label: 'Strong',
    scrollDelay: 1000,
    overlayOpacity: 0.4,
    cooldown: 60,
    popupType: 'warning',
    description: 'Significant delay + warning popup',
  },
  4: {
    label: 'Aggressive',
    scrollDelay: 2000,
    overlayOpacity: 0.6,
    cooldown: 120,
    popupType: 'warning',
    description: 'Heavy delay + strong warning',
  },
  5: {
    label: 'Maximum',
    scrollDelay: 5000,
    overlayOpacity: 0.8,
    cooldown: 300,
    popupType: 'cooldown',
    description: 'Full block + cooldown timer',
  },
};

/**
 * Clamp a value between min and max.
 */
function clamp(val, min, max) {
  return Math.max(min, Math.min(max, val));
}

/**
 * Check if current hour falls within a time range string like "21:00-00:00".
 * @param {number} hour - Current hour (0-23)
 * @param {string} range - Time range string
 * @returns {boolean}
 */
export function isInTimeRange(hour, range) {
  if (!range) return false;
  const [startStr, endStr] = range.split('-');
  const start = parseInt(startStr.split(':')[0], 10);
  const end = parseInt(endStr.split(':')[0], 10);

  if (start <= end) {
    return hour >= start && hour < end;
  }
  // Wraps midnight (e.g., 21:00-02:00)
  return hour >= start || hour < end;
}

/**
 * Calculate friction level for the current context.
 *
 * @param {object} profile - User profile (behavior + preferences)
 * @param {number} brainrotScore - Current brainrot score (0-100)
 * @param {Date} [now=new Date()] - Current timestamp
 * @returns {{ level: number, config: object, reason: string }}
 */
export function calculateFrictionLevel(profile, brainrotScore, now = new Date()) {
  const hour = now.getHours();
  const tolerance = profile?.behavior?.frictionTolerance || 2;
  const peakTime = profile?.behavior?.peakDistractionTime || '';
  const highRiskSites = profile?.behavior?.highRiskSites || [];
  let level = 1;
  const reasons = [];

  // Base level from brainrot score
  if (brainrotScore >= 80) {
    level = 4;
    reasons.push('Very high brainrot score');
  } else if (brainrotScore >= 60) {
    level = 3;
    reasons.push('High brainrot score');
  } else if (brainrotScore >= 40) {
    level = 2;
    reasons.push('Moderate brainrot score');
  } else {
    level = 1;
    reasons.push('Low brainrot score');
  }

  // Adjust for user's friction tolerance preference
  const toleranceOffset = tolerance - 2; // 2 is neutral
  level += toleranceOffset;
  if (toleranceOffset > 0) reasons.push('User prefers stricter friction');
  if (toleranceOffset < 0) reasons.push('User prefers gentler friction');

  // Peak distraction hours → bump up
  if (isInTimeRange(hour, peakTime)) {
    level += 1;
    reasons.push('Currently in peak distraction hours');
  }

  // Clamp to valid range
  level = clamp(level, 1, 5);

  return {
    level,
    config: FRICTION_LEVELS[level],
    reason: reasons.join('; '),
  };
}

/**
 * Get the friction config for a specific level.
 * @param {number} level
 * @returns {object}
 */
export function getFrictionConfig(level) {
  return FRICTION_LEVELS[clamp(level, 1, 5)];
}

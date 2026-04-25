/**
 * Adaptive Friction Engine (Module M8)
 * Calculates optimal friction level based on user profile, brainrot score, and context.
 */

/** Friction level configurations */
export const FRICTION_LEVELS = {
  1: {
    label: 'Gentle',
    scrollDelay: 300,
    overlayOpacity: 0.15,
    cooldown: 0,
    popupType: null,
    description: 'Slight scroll resistance',
  },
  2: {
    label: 'Moderate',
    scrollDelay: 800,
    overlayOpacity: 0.3,
    cooldown: 45,
    popupType: 'intent',
    description: 'Noticeable delay + intent check',
  },
  3: {
    label: 'Strong',
    scrollDelay: 1500,
    overlayOpacity: 0.5,
    cooldown: 90,
    popupType: 'warning',
    description: 'Significant delay + warning popup',
  },
  4: {
    label: 'Aggressive',
    scrollDelay: 3000,
    overlayOpacity: 0.7,
    cooldown: 180,
    popupType: 'warning',
    description: 'Heavy delay + strong warning',
  },
  5: {
    label: 'Maximum',
    scrollDelay: 10000,
    overlayOpacity: 0.95,
    cooldown: 600,
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
  const tolerance = parseInt(profile?.behavior?.frictionTolerance || 2, 10);
  const peakTime = profile?.behavior?.peakDistractionTime || '';
  let level = tolerance;
  const reasons = [];

  reasons.push(`Base tolerance: ${tolerance}`);

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

export function getFrictionConfig(level) {
  return FRICTION_LEVELS[clamp(level, 1, 5)];
}

/**
 * Sophisticated Brainrot Score Calculation.
 * Incorporates velocity, time, and context.
 */
export function calculateBrainrotScore(metrics, now = new Date()) {
  const { reels = 0, timeSpent = 0 } = metrics;
  const hour = now.getHours();
  
  // Base score from reels (exponential growth)
  let score = Math.pow(reels, 1.2) * 5;
  
  // Time factor (linear growth, max 40 points)
  const timeScore = Math.min((timeSpent / 300) * 10, 40);
  score += timeScore;
  
  // Velocity factor (reels per minute)
  const rpm = timeSpent > 30 ? (reels / (timeSpent / 60)) : 0;
  if (rpm > 6) {
    score *= 1.3; // Rapid consumption multiplier
  }
  
  // Night multiplier (22:00 - 04:00)
  if (hour >= 22 || hour <= 4) {
    score *= 1.2;
  }
  
  return clamp(Math.round(score), 0, 100);
}

/**
 * Get dynamic scroll friction level based on session time and behavior.
 * 
 * @param {number} baseLevel - User's friction tolerance (1-5)
 * @param {number} sessionTimeSeconds - Time spent on current site
 * @param {number} scrollCount - Number of scrolls/reels consumed
 * @param {Date} [now=new Date()]
 * @returns {number} Dynamic level (1-5)
 */
export function calculateDynamicScrollFriction(baseLevel, sessionTimeSeconds, scrollCount, now = new Date()) {
  const hour = now.getHours();
  let dynamicLevel = baseLevel;
  const sessionMinutes = sessionTimeSeconds / 60;
  
  // Time escalation: Increase by 1 level every 5 minutes on brainrot sites
  if (sessionMinutes > 5) {
    const timeEscalation = Math.min(Math.floor(sessionMinutes / 5), 2);
    dynamicLevel += timeEscalation;
  }
  
  // Scroll count escalation: +1 level for every 10 consecutive reels
  if (scrollCount > 10) {
    const scrollEscalation = Math.min(Math.floor(scrollCount / 10), 1);
    dynamicLevel += scrollEscalation;
  }
  
  // Peak hours (22:00-02:00): Stricter by default
  if (hour >= 22 || hour <= 2) {
    dynamicLevel = Math.min(dynamicLevel + 1, 5);
  }
  
  return clamp(dynamicLevel, 1, 5);
}

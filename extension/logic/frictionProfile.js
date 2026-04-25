/**
 * Friction Profile Engine (Module M9)
 * Generates a behavioral profile for the user based on tracking data.
 */

export const PROFILE_TYPES = {
  NIGHT_OWL: 'Night Owl Scroller',
  WORK_PROCRASTINATOR: 'Work Procrastinator',
  REEL_ADDICT: 'Dopamine Chaser',
  BALANCED: 'Mindful Browser',
  UNKNOWN: 'Shadow Voyager',
};

/**
 * Generate a friction profile based on session and activity data.
 */
export function generateFrictionProfile(sessions, dailyActivity, profile) {
  if (!sessions || sessions.length === 0) return { type: PROFILE_TYPES.UNKNOWN, confidence: 0 };

  const now = new Date();
  const brainrotSessions = sessions.filter(s => s.isBrainrot);
  
  // 1. Analyze timing (Night vs Day)
  let nightSprints = 0;
  brainrotSessions.forEach(s => {
    const hour = new Date(s.startTime).getHours();
    if (hour >= 22 || hour <= 4) nightSprints++;
  });
  
  const nightRatio = nightSprints / (brainrotSessions.length || 1);

  // 2. Analyze Intensity (Reels per minute)
  let totalReels = 0;
  let totalBrainrotTime = 0;
  brainrotSessions.forEach(s => {
    totalReels += s.reelCount || 0;
    totalBrainrotTime += s.duration || 0;
  });
  
  const reelsPerMin = totalBrainrotTime > 0 ? (totalReels / (totalBrainrotTime / 60)) : 0;

  // 3. Categorize
  let type = PROFILE_TYPES.BALANCED;
  let reasons = [];

  if (nightRatio > 0.6) {
    type = PROFILE_TYPES.NIGHT_OWL;
    reasons.push('Most distracted late at night');
  } else if (reelsPerMin > 4) {
    type = PROFILE_TYPES.REEL_ADDICT;
    reasons.push('High-velocity scrolling detected');
  } else if (brainrotSessions.length > 5) {
    type = PROFILE_TYPES.WORK_PROCRASTINATOR;
    reasons.push('Frequent short distractions during day');
  }

  // Update profile behavior settings (preserve user's explicit tolerance)
  const frictionTolerance = profile?.behavior?.frictionTolerance || 1;
  const peakDistractionTime = type === PROFILE_TYPES.NIGHT_OWL ? '22:00-02:00' : '';

  return {
    type,
    metrics: {
      nightRatio,
      reelsPerMin,
      totalReels,
      avgSessionDuration: totalBrainrotTime / (brainrotSessions.length || 1)
    },
    reasons,
    adjustments: {
      frictionTolerance,
      peakDistractionTime
    }
  };
}

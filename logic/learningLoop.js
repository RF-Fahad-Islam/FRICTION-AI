/**
 * Learning Loop Engine (Module M9)
 * Evaluates friction effectiveness and adjusts user profile parameters.
 */

/**
 * Rolling average helper.
 * @param {number} current - Current average
 * @param {number} newValue - New data point
 * @param {number} weight - Weight for new value (0-1)
 * @returns {number}
 */
function rollingAvg(current, newValue, weight = 0.3) {
  if (current === 0) return newValue;
  return Math.round(current * (1 - weight) + newValue * weight);
}

/**
 * Evaluate a session and compute profile adjustments.
 *
 * @param {object} profile - Current user profile
 * @param {object} sessionResult - Session outcome data
 * @param {number} sessionResult.frictionShown - How many times friction was applied
 * @param {number} sessionResult.frictionIgnored - How many times user ignored friction
 * @param {boolean} sessionResult.exitedEarly - Did user leave within 60s of friction?
 * @param {number} sessionResult.totalTime - Total session time in seconds
 * @param {number} sessionResult.brainrotScore - Session brainrot score
 * @param {string} sessionResult.url - Primary URL
 * @param {number} sessionResult.scrollCount - Total scrolls
 *
 * @returns {{ profile: object, adjustments: string[] }}
 */
export function evaluateAndAdjust(profile, sessionResult) {
  const adjustments = [];
  const behavior = { ...profile.behavior };

  const {
    frictionShown = 0,
    frictionIgnored = 0,
    exitedEarly = false,
    totalTime = 0,
    brainrotScore = 0,
    url = '',
    scrollCount = 0,
  } = sessionResult;

  // 1. Friction tolerance adjustment
  const ignoreRate = frictionShown > 0
    ? frictionIgnored / frictionShown
    : 0;

  if (ignoreRate > 0.7 && frictionShown >= 2) {
    behavior.frictionTolerance = Math.min((behavior.frictionTolerance || 2) + 1, 5);
    adjustments.push(`Increased friction tolerance to ${behavior.frictionTolerance} (${Math.round(ignoreRate * 100)}% ignored)`);
  } else if (exitedEarly && totalTime < 60) {
    behavior.frictionTolerance = Math.max((behavior.frictionTolerance || 2) - 1, 1);
    adjustments.push(`Decreased friction tolerance to ${behavior.frictionTolerance} (exited early)`);
  }

  // 2. Update behavioral averages
  behavior.avgScrollSession = rollingAvg(behavior.avgScrollSession || 0, totalTime);
  adjustments.push(`Updated avg session time: ${behavior.avgScrollSession}s`);

  // 3. Track high-risk sites
  if (brainrotScore >= 70) {
    const domain = extractDomain(url);
    if (domain && !behavior.highRiskSites.includes(domain)) {
      // Count occurrences — add to high risk after 3 sessions
      const siteCount = (behavior._siteCounts || {})[domain] || 0;
      if (siteCount >= 2) {
        behavior.highRiskSites = [...(behavior.highRiskSites || []), domain];
        adjustments.push(`Added ${domain} to high-risk sites`);
      } else {
        behavior._siteCounts = { ...(behavior._siteCounts || {}), [domain]: siteCount + 1 };
      }
    }
  }

  // 4. Update brainrot rate (rolling average)
  const wasBrainrot = brainrotScore >= 50 ? 1 : 0;
  behavior.brainrotRate = parseFloat(
    ((behavior.brainrotRate || 0.5) * 0.8 + wasBrainrot * 0.2).toFixed(2)
  );

  // 5. Detect time patterns
  const hour = new Date().getHours();
  if (brainrotScore < 30 && hour >= 6 && hour <= 12) {
    if (!behavior.focusPatterns.includes('productive_morning')) {
      behavior.focusPatterns = [...(behavior.focusPatterns || []), 'productive_morning'];
      adjustments.push('Detected morning productivity pattern');
    }
  }
  if (brainrotScore >= 60 && (hour >= 21 || hour <= 1)) {
    behavior.peakDistractionTime = '21:00-01:00';
    adjustments.push('Updated peak distraction time: 9PM-1AM');
  }

  // 6. Update friction response history
  const history = { ...(profile.history || {}) };
  const responses = { ...(history.frictionResponses || { ignored: 0, obeyed: 0, exitedEarly: 0 }) };
  responses.ignored += frictionIgnored;
  responses.obeyed += Math.max(frictionShown - frictionIgnored, 0);
  if (exitedEarly) responses.exitedEarly += 1;
  history.frictionResponses = responses;

  // 7. Update weekly scores
  const weekScores = [...(history.lastWeekScores || [])];
  weekScores.push(brainrotScore);
  if (weekScores.length > 7) weekScores.shift();
  history.lastWeekScores = weekScores;

  return {
    profile: {
      ...profile,
      behavior,
      history,
      updatedAt: new Date().toISOString(),
    },
    adjustments,
  };
}

/**
 * Extract domain from URL for site tracking.
 */
function extractDomain(url) {
  try {
    const parsed = new URL(url);
    return parsed.hostname.replace('www.', '');
  } catch {
    return '';
  }
}

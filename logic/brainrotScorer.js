/**
 * Brainrot Scorer (Module M3)
 * Calculates a 0-100 brainrot score based on URL pattern, scroll count, and time spent.
 */

/** Known brainrot URL patterns with base scores (0-40) */
const BRAINROT_URLS = {
  'instagram.com/reels': 40,
  'instagram.com/explore': 30,
  'youtube.com/shorts': 40,
  'tiktok.com': 40,
  'twitter.com': 25,
  'x.com': 25,
  'reddit.com': 20,
  'facebook.com/watch': 30,
  'snapchat.com/spotlight': 35,
  'pinterest.com': 15,
};

/**
 * Check if a URL matches a known brainrot pattern.
 * @param {string} url - The full URL to check
 * @returns {{ matched: boolean, domain: string, baseScore: number }}
 */
export function matchBrainrotUrl(url) {
  try {
    const parsed = new URL(url);
    const fullPath = parsed.hostname.replace('www.', '') + parsed.pathname;

    for (const [pattern, score] of Object.entries(BRAINROT_URLS)) {
      if (fullPath.startsWith(pattern)) {
        return { matched: true, domain: pattern, baseScore: score };
      }
    }

    return { matched: false, domain: parsed.hostname, baseScore: 0 };
  } catch {
    return { matched: false, domain: '', baseScore: 0 };
  }
}

/**
 * Calculate brainrot score (0-100).
 *
 * Components:
 * - URL match: 0-40 points
 * - Scroll intensity: 0-30 points (normalized to 50 scrolls)
 * - Time spent: 0-30 points (normalized to 10 minutes)
 *
 * @param {{ url: string, scrollCount: number, timeSpent: number }} data
 * @returns {{ score: number, urlScore: number, scrollScore: number, timeScore: number, isBrainrot: boolean }}
 */
export function calculateBrainrotScore({ url, scrollCount, timeSpent }) {
  const { baseScore: urlScore } = matchBrainrotUrl(url);
  const scrollScore = Math.round(Math.min(scrollCount / 50, 1) * 30);
  const timeScore = Math.round(Math.min(timeSpent / 600, 1) * 30);
  const score = Math.min(urlScore + scrollScore + timeScore, 100);

  return {
    score,
    urlScore,
    scrollScore,
    timeScore,
    isBrainrot: score >= 50,
  };
}

/**
 * Quick check: is this URL a known brainrot platform?
 * @param {string} url
 * @returns {boolean}
 */
export function isBrainrotUrl(url) {
  return matchBrainrotUrl(url).matched;
}

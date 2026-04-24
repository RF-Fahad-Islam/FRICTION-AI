/**
 * Categorizer (Module M5)
 * Rule-based site classification with confidence scoring.
 * Falls back to AI classification (M6) when confidence is low.
 */

/** Category definitions */
export const CATEGORIES = {
  PRODUCTIVITY: 'productivity',
  LEARNING: 'learning',
  ENTERTAINMENT: 'entertainment',
  TIME_WASTE: 'timeWaste',
  BRAINROT: 'brainrot',
  MIXED: 'mixed',
  UNKNOWN: 'unknown',
};

/** Rule-based classification patterns */
const CATEGORY_RULES = [
  // Productivity
  { pattern: /github\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /stackoverflow\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /gitlab\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /docs\.google\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /notion\.so/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /figma\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /linear\.app/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /vercel\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },

  // Learning
  { pattern: /coursera\.org/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /udemy\.com/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /khanacademy\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /edx\.org/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /leetcode\.com/, category: CATEGORIES.LEARNING, confidence: 0.85 },
  { pattern: /medium\.com/, category: CATEGORIES.MIXED, confidence: 0.5 },
  { pattern: /dev\.to/, category: CATEGORIES.LEARNING, confidence: 0.8 },
  { pattern: /wikipedia\.org/, category: CATEGORIES.LEARNING, confidence: 0.7 },

  // Brainrot (highest priority)
  { pattern: /youtube\.com\/shorts/, category: CATEGORIES.BRAINROT, confidence: 0.9 },
  { pattern: /instagram\.com\/reels/, category: CATEGORIES.BRAINROT, confidence: 0.9 },
  { pattern: /tiktok\.com/, category: CATEGORIES.BRAINROT, confidence: 0.9 },
  { pattern: /snapchat\.com\/spotlight/, category: CATEGORIES.BRAINROT, confidence: 0.85 },

  // Entertainment
  { pattern: /youtube\.com/, category: CATEGORIES.MIXED, confidence: 0.5 },
  { pattern: /netflix\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.9 },
  { pattern: /twitch\.tv/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.85 },
  { pattern: /disneyplus\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.9 },
  { pattern: /spotify\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.7 },

  // Time Waste
  { pattern: /twitter\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.7 },
  { pattern: /x\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.7 },
  { pattern: /reddit\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.6 },
  { pattern: /facebook\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.65 },
  { pattern: /instagram\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.7 },
];

/**
 * Classify a URL using rule-based matching.
 * @param {string} url
 * @param {string} [title='']
 * @returns {{ category: string, confidence: number, source: 'rule' | 'unknown' }}
 */
export function categorize(url, title = '') {
  const fullStr = `${url} ${title}`.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.pattern.test(fullStr)) {
      return {
        category: rule.category,
        confidence: rule.confidence,
        source: 'rule',
      };
    }
  }

  return {
    category: CATEGORIES.UNKNOWN,
    confidence: 0,
    source: 'unknown',
  };
}

/**
 * Check if a categorization result needs AI fallback.
 * @param {{ confidence: number }} result
 * @returns {boolean}
 */
export function needsAiFallback(result) {
  return result.confidence < 0.6 || result.category === CATEGORIES.UNKNOWN;
}

/**
 * Get a human-readable label for a category.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryLabel(category) {
  const labels = {
    [CATEGORIES.PRODUCTIVITY]: '🎯 Productive',
    [CATEGORIES.LEARNING]: '📚 Learning',
    [CATEGORIES.ENTERTAINMENT]: '🎬 Entertainment',
    [CATEGORIES.TIME_WASTE]: '⏳ Time Waste',
    [CATEGORIES.BRAINROT]: '🧟 Brainrot',
    [CATEGORIES.MIXED]: '🔀 Mixed',
    [CATEGORIES.UNKNOWN]: '❓ Unknown',
  };
  if (labels[category]) return labels[category];
  
  // For dynamic AI categories
  const formatted = category.replace(/_/g, ' ');
  return `✨ ${formatted.charAt(0).toUpperCase() + formatted.slice(1)}`;
}

/**
 * Get the color class for a category.
 * @param {string} category
 * @returns {string}
 */
export function getCategoryColor(category) {
  const colors = {
    [CATEGORIES.PRODUCTIVITY]: '#00B894',
    [CATEGORIES.LEARNING]: '#6C5CE7',
    [CATEGORIES.ENTERTAINMENT]: '#FDCB6E',
    [CATEGORIES.TIME_WASTE]: '#E17055',
    [CATEGORIES.BRAINROT]: '#FF6B6B',
    [CATEGORIES.MIXED]: '#A0A0C8',
    [CATEGORIES.UNKNOWN]: '#636E72',
  };
  if (colors[category]) return colors[category];

  // Generate a consistent pseudo-random color based on string hash
  let hash = 0;
  for (let i = 0; i < category.length; i++) {
    hash = category.charCodeAt(i) + ((hash << 5) - hash);
  }
  // Ensure it's not too dark by ORing with a lighter base
  const colorInt = (hash & 0x00FFFFFF) | 0x404040;
  const c = colorInt.toString(16).toUpperCase();
  return '#' + '00000'.substring(0, 6 - c.length) + c;
}

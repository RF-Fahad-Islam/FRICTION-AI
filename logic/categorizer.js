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
  // Productivity
  { pattern: /github\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /stackoverflow\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /gitlab\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /docs\.google\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /notion\.so/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /figma\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /linear\.app/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /vercel\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /trello\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /slack\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /zoom\.us/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /teams\.microsoft\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.85 },
  { pattern: /jira\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /bitbucket\.org/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /meet\.google\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /app\.diagrams\.net/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.95 },
  { pattern: /miro\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /overleaf\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.9 },
  { pattern: /canva\.com/, category: CATEGORIES.PRODUCTIVITY, confidence: 0.75 },

  // Learning
  { pattern: /coursera\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /udemy\.com/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /khanacademy\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /edx\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /leetcode\.com/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /hackerrank\.com/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /medium\.com/, category: CATEGORIES.MIXED, confidence: 0.5 },
  { pattern: /dev\.to/, category: CATEGORIES.LEARNING, confidence: 0.85 },
  { pattern: /wikipedia\.org/, category: CATEGORIES.LEARNING, confidence: 0.85 },
  { pattern: /w3schools\.com/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /developer\.mozilla\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /geeksforgeeks\.org/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /freecodecamp\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /javascript\.info/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /python\.org/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /rust-lang\.org/, category: CATEGORIES.LEARNING, confidence: 0.9 },
  { pattern: /brilliant\.org/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /pluralsight\.com/, category: CATEGORIES.LEARNING, confidence: 0.95 },
  { pattern: /duolingo\.com/, category: CATEGORIES.LEARNING, confidence: 0.95 },

  // Brainrot (highest priority)
  { pattern: /youtube\.com\/shorts/, category: CATEGORIES.BRAINROT, confidence: 0.98 },
  { pattern: /instagram\.com\/(reels|reel)/, category: CATEGORIES.BRAINROT, confidence: 0.98 },
  { pattern: /tiktok\.com/, category: CATEGORIES.BRAINROT, confidence: 0.98 },
  { pattern: /snapchat\.com\/spotlight/, category: CATEGORIES.BRAINROT, confidence: 0.9 },
  { pattern: /facebook\.com\/(reels|reel|watch)/, category: CATEGORIES.BRAINROT, confidence: 0.95 },
  { pattern: /9gag\.com/, category: CATEGORIES.BRAINROT, confidence: 0.85 },
  { pattern: /worldstarhiphop\.com/, category: CATEGORIES.BRAINROT, confidence: 0.9 },

  // Entertainment
  { pattern: /youtube\.com/, category: CATEGORIES.MIXED, confidence: 0.5 },
  { pattern: /netflix\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.95 },
  { pattern: /twitch\.tv/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.9 },
  { pattern: /disneyplus\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.95 },
  { pattern: /spotify\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.8 },
  { pattern: /hulu\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.95 },
  { pattern: /primevideo\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.95 },
  { pattern: /crunchyroll\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.95 },
  { pattern: /ign\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.8 },
  { pattern: /gamespot\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.8 },
  { pattern: /steamcommunity\.com/, category: CATEGORIES.ENTERTAINMENT, confidence: 0.75 },

  // Time Waste
  { pattern: /twitter\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.8 },
  { pattern: /x\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.8 },
  { pattern: /reddit\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.7 },
  { pattern: /facebook\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.75 },
  { pattern: /instagram\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.8 },
  { pattern: /pinterest\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.8 },
  { pattern: /tumblr\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.8 },
  { pattern: /buzzfeed\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.85 },
  { pattern: /quora\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.7 },
  { pattern: /discord\.com/, category: CATEGORIES.TIME_WASTE, confidence: 0.65 },
  { pattern: /linkedin\.com/, category: CATEGORIES.MIXED, confidence: 0.5 },
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

/**
 * Storage Adapter (Module M12)
 * Unified storage interface — localStorage for extension/dashboard sync.
 */
const STORAGE_PREFIX = 'sf_';

/**
 * Storage keys
 */
export const KEYS = {
  PROFILE: `${STORAGE_PREFIX}profile`,
  SESSIONS: `${STORAGE_PREFIX}sessions`,
  VISITS: `${STORAGE_PREFIX}visits`,
  FRICTION_LOG: `${STORAGE_PREFIX}friction_log`,
  SUMMARIES: `${STORAGE_PREFIX}summaries`,
  CHAT_HISTORY: `${STORAGE_PREFIX}chat_history`,
  CHAT_MEMORY: `${STORAGE_PREFIX}chat_memory`,
  SETTINGS: `${STORAGE_PREFIX}settings`,
};

/** Max items per collection to prevent localStorage bloat */
const LIMITS = {
  [KEYS.SESSIONS]: 100,
  [KEYS.VISITS]: 500,
  [KEYS.FRICTION_LOG]: 200,
  [KEYS.SUMMARIES]: 30,
  [KEYS.CHAT_HISTORY]: 50,
};

/**
 * Get a value from storage.
 * @param {string} key
 * @param {*} defaultValue
 * @returns {*}
 */
export function get(key, defaultValue = null) {
  // If we're in a Chrome extension, we might want to use chrome.storage.local
  // But since get() is sync, we check localStorage first.
  // We will add a sync process to keep localStorage and chrome.storage in sync.
  try {
    const raw = localStorage.getItem(key);
    if (raw === null) return defaultValue;
    return JSON.parse(raw);
  } catch {
    return defaultValue;
  }
}

/**
 * Set a value in storage.
 * @param {string} key
 * @param {*} value
 */
export function set(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
    
    // Sync to chrome.storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: value });
    }
  } catch (e) {
    console.warn('[Storage] Write failed:', e.message);
    if (e.name === 'QuotaExceededError') {
      pruneOldData();
      localStorage.setItem(key, JSON.stringify(value));
    }
  }
}

/**
 * Append an item to an array in storage (with limit enforcement).
 * @param {string} key
 * @param {*} item
 */
export function append(key, item) {
  const arr = get(key, []);
  arr.push(item);

  const limit = LIMITS[key];
  if (limit && arr.length > limit) {
    arr.splice(0, arr.length - limit);
  }

  try {
    localStorage.setItem(key, JSON.stringify(arr));
    
    // Sync to chrome.storage if available
    if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
      chrome.storage.local.set({ [key]: arr });
    }

  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      pruneOldData();
      localStorage.setItem(key, JSON.stringify(arr));
    }
  }
}

/**
 * Sync entire storage from chrome.storage.local to localStorage.
 * Call this on app initialization.
 */
export async function syncFromChrome() {
  if (typeof chrome === 'undefined' || !chrome.storage || !chrome.storage.local) return;

  return new Promise((resolve) => {
    chrome.storage.local.get(null, (data) => {
      Object.entries(data).forEach(([key, value]) => {
        if (key.startsWith(STORAGE_PREFIX)) {
          localStorage.setItem(key, JSON.stringify(value));
        }
      });
      resolve();
    });
  });
}

/**
 * Update a stored object by merging new fields.
 * @param {string} key
 * @param {object} updates
 */
export function update(key, updates) {
  const current = get(key, {});
  set(key, { ...current, ...updates });
}

/**
 * Remove a key from storage.
 * @param {string} key
 */
export function remove(key) {
  localStorage.removeItem(key);
  if (typeof chrome !== 'undefined' && chrome.storage && chrome.storage.local) {
    chrome.storage.local.remove(key);
  }
}

/**
 * Clear all Study Friction data from storage.
 */
export function clearAll() {
  Object.values(KEYS).forEach(key => localStorage.removeItem(key));
}

/**
 * Get total storage usage for Study Friction data.
 * @returns {{ usedBytes: number, itemCount: number }}
 */
export function getStorageStats() {
  let usedBytes = 0;
  let itemCount = 0;

  Object.values(KEYS).forEach(key => {
    const raw = localStorage.getItem(key);
    if (raw) {
      usedBytes += raw.length * 2; // UTF-16
      itemCount++;
    }
  });

  return { usedBytes, itemCount };
}

/**
 * Prune oldest entries to free storage space.
 */
function pruneOldData() {
  Object.entries(LIMITS).forEach(([key, limit]) => {
    const arr = get(key, []);
    if (arr.length > limit / 2) {
      set(key, arr.slice(-Math.floor(limit / 2)));
    }
  });
}

/**
 * Export all data as a JSON object (for backup/migration).
 * @returns {object}
 */
export function exportAll() {
  const data = {};
  Object.entries(KEYS).forEach(([name, key]) => {
    data[name] = get(key);
  });
  return data;
}

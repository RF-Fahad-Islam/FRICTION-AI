/**
 * Storage Adapter (Module M12)
 * Unified storage interface — localStorage for MVP, swappable to Supabase.
 */
import { supabase } from '@/lib/supabaseClient'

const STORAGE_PREFIX = 'sf_';

let currentUser = null;
supabase.auth.getSession().then(({ data: { session } }) => {
  currentUser = session?.user || null;
});
supabase.auth.onAuthStateChange((_event, session) => {
  currentUser = session?.user || null;
});

// Helper to push to Supabase without blocking UI
async function syncToSupabase(table, payload) {
  if (!currentUser) return;
  try {
    // If payload doesn't have a user_id, attach it
    const data = Array.isArray(payload) 
      ? payload.map(p => ({ ...p, user_id: currentUser.id }))
      : { ...payload, user_id: currentUser.id };
    
    // Profiles table is keyed by 'id'
    if (table === 'profiles') {
      await supabase.from(table).upsert({ id: currentUser.id, ...data });
    } else {
      await supabase.from(table).insert(data);
    }
  } catch (err) {
    console.warn(`[Storage] Failed to sync ${table} to Supabase:`, err.message);
  }
}

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
    
    // Sync specific keys to Supabase
    if (key === KEYS.PROFILE) {
      syncToSupabase('profiles', value);
    }
  } catch (e) {
    console.warn('[Storage] Write failed:', e.message);
    // If quota exceeded, try to prune old data
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

  // Enforce limits
  const limit = LIMITS[key];
  if (limit && arr.length > limit) {
    arr.splice(0, arr.length - limit);
  }

  try {
    localStorage.setItem(key, JSON.stringify(arr));
    
    // Async sync the single item to Supabase to avoid pushing whole array
    if (key === KEYS.SESSIONS) syncToSupabase('sessions', item);
    if (key === KEYS.VISITS) syncToSupabase('visits', item);
    if (key === KEYS.FRICTION_LOG) syncToSupabase('friction_events', item);

  } catch (e) {
    if (e.name === 'QuotaExceededError') {
      pruneOldData();
      localStorage.setItem(key, JSON.stringify(arr));
    }
  }
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

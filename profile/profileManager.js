/**
 * Profile Manager (Module M10)
 * Manages user profile creation, updates, and retrieval.
 */

import * as storage from '../storage/storageAdapter.js';
import { KEYS } from '../storage/storageAdapter.js';

/**
 * Default profile schema.
 */
export function createDefaultProfile() {
  return {
    userId: generateUserId(),
    version: 1,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),

    behavior: {
      frictionTolerance: 2,       // 1 (lenient) to 5 (strict)
      avgScrollSession: 0,        // seconds
      avgFocusSession: 0,         // seconds
      peakDistractionTime: '',    // e.g., "21:00-00:00"
      highRiskSites: [],          // domains
      focusPatterns: [],          // e.g., ["productive_morning"]
      totalSessions: 0,
      brainrotRate: 0.5,          // 0-1
      _siteCounts: {},            // internal tracking
    },

    preferences: {
      tone: 'balanced',           // 'strict' | 'balanced' | 'chill'
      goal: 'study',              // 'study' | 'work' | 'relax_balance'
      frictionStyle: 'overlay',   // 'overlay' | 'delay' | 'both'
      pomodoroLength: 25,         // minutes
      breakLength: 5,             // minutes
      aiEnabled: true,
      notificationsEnabled: true,
    },

    history: {
      lastWeekScores: [],         // brainrot scores, max 7
      frictionResponses: {
        ignored: 0,
        obeyed: 0,
        exitedEarly: 0,
      },
    },
  };
}

/**
 * Get the current user profile (creates default if none exists).
 * @returns {object}
 */
export function getProfile() {
  let profile = storage.get(KEYS.PROFILE);
  if (!profile) {
    profile = createDefaultProfile();
    storage.set(KEYS.PROFILE, profile);
  }
  return profile;
}

/**
 * Save/update the user profile.
 * @param {object} profile
 */
export function saveProfile(profile) {
  storage.set(KEYS.PROFILE, {
    ...profile,
    updatedAt: new Date().toISOString(),
  });
}

/**
 * Update specific profile fields (deep merge for nested objects).
 * @param {object} updates - Partial profile update
 */
export function updateProfile(updates) {
  const current = getProfile();

  // Deep merge behavior and preferences
  const merged = {
    ...current,
    ...updates,
    behavior: {
      ...current.behavior,
      ...(updates.behavior || {}),
    },
    preferences: {
      ...current.preferences,
      ...(updates.preferences || {}),
    },
    history: {
      ...current.history,
      ...(updates.history || {}),
      frictionResponses: {
        ...current.history.frictionResponses,
        ...(updates.history?.frictionResponses || {}),
      },
    },
    updatedAt: new Date().toISOString(),
  };

  saveProfile(merged);
  return merged;
}

/**
 * Update a single preference.
 * @param {string} key
 * @param {*} value
 */
export function setPreference(key, value) {
  return updateProfile({
    preferences: { [key]: value },
  });
}

/**
 * Reset profile to defaults (keeps userId).
 */
export function resetProfile() {
  const current = getProfile();
  const fresh = createDefaultProfile();
  fresh.userId = current.userId;
  saveProfile(fresh);
  return fresh;
}

/**
 * Get a summary of the user's behavior for AI context.
 * @returns {string}
 */
export function getProfileSummary() {
  const p = getProfile();
  const b = p.behavior;
  const pref = p.preferences;
  const h = p.history;

  const avgScore = h.lastWeekScores.length > 0
    ? Math.round(h.lastWeekScores.reduce((a, b) => a + b, 0) / h.lastWeekScores.length)
    : 'N/A';

  return [
    `Goal: ${pref.goal}`,
    `Tone: ${pref.tone}`,
    `Friction tolerance: ${b.frictionTolerance}/5`,
    `Avg brainrot score (7d): ${avgScore}`,
    `Brainrot rate: ${Math.round(b.brainrotRate * 100)}%`,
    `High-risk sites: ${b.highRiskSites.join(', ') || 'none'}`,
    `Peak distraction: ${b.peakDistractionTime || 'not detected'}`,
    `Focus patterns: ${b.focusPatterns.join(', ') || 'none detected'}`,
    `Total sessions: ${b.totalSessions}`,
  ].join('\n');
}

function generateUserId() {
  return 'user_' + Date.now().toString(36) + Math.random().toString(36).substr(2, 6);
}

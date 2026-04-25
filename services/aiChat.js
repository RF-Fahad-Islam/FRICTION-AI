/**
 * AI Chat Service (Module M11)
 * Handles chat interactions with AI API + fallback templates.
 */

import { chatPrompt, parseAiResponse } from './aiPrompts.js';
import { getProfile, updateProfile, getProfileSummary } from '../profile/profileManager.js';
import * as storage from '../storage/storageAdapter.js';
import { KEYS } from '../storage/storageAdapter.js';

const API_TIMEOUT = 15000;

/**
 * Send a chat message and get a response.
 * @param {string} message - User's message
 * @param {string} [apiKey] - OpenAI API key (optional)
 * @returns {Promise<{ text: string, actions: object[], source: string }>}
 */
export async function sendMessage(message, apiKey = null) {
  // Save user message
  appendChatMessage('user', message);

  const profile = getProfile();
  const profileSummary = getProfileSummary();
  const chatHistory = getChatHistory();
  const sessions = storage.get(KEYS.SESSIONS, []);

  let response;

  if (apiKey) {
    try {
      response = await callAiChat(message, profileSummary, chatHistory, sessions, apiKey);
    } catch (err) {
      console.warn('[Chat] AI API failed, using fallback:', err.message);
      response = generateFallbackResponse(message, profile);
    }
  } else {
    response = generateFallbackResponse(message, profile);
  }

  // Process any actions from the response
  if (response.actions && response.actions.length > 0) {
    applyActions(response.actions);
  }

  // Save assistant message
  appendChatMessage('assistant', response.text, response.actions);

  return response;
}

/**
 * Call the AI API for chat.
 */
async function callAiChat(message, profileSummary, chatHistory, sessions, apiKey) {
  const todayStats = {
    reelTime: storage.get('sf_reel_time', 0),
    reelCount: storage.get('sf_reel_count', 0),
    brainrotScore: storage.get('sf_history_scores', [])?.slice(-1)[0] || 0
  };

  // Get today's block bypasses
  const blockLogs = storage.get('sf_block_logs', []);
  const today = new Date().toISOString().split('T')[0];
  const todayBypasses = blockLogs.filter(b => b.timestamp && b.timestamp.startsWith(today));

  const prompt = chatPrompt(
    message,
    profileSummary,
    chatHistory.map(m => ({ role: m.role, content: m.content })),
    sessions.slice(-3),
    todayStats,
    todayBypasses
  );

  try {
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(prompt),
      signal: AbortSignal.timeout(API_TIMEOUT),
    });

    if (!res.ok) throw new Error(`API error: ${res.status}`);
    const data = await res.json();
    const rawText = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
    const parsed = parseAiResponse(rawText);

    return { ...parsed, source: 'ai' };
  } catch (err) {
    throw err;
  }
}

/**
 * Generate a fallback response without AI API.
 */
function generateFallbackResponse(message, profile) {
  const lower = message.toLowerCase();
  const b = profile.behavior;
  const p = profile.preferences;

  // Pattern matching for common intents
  if (lower.includes('distract') || lower.includes('why')) {
    const topSite = b.highRiskSites[0] || 'social media';
    const peakTime = b.peakDistractionTime || 'late evening';
    return {
      text: `Based on your data, your brainrot rate is ${Math.round(b.brainrotRate * 100)}%. Your biggest trigger is ${topSite}, especially during ${peakTime}. Try starting a Pomodoro session to build momentum.`,
      actions: [],
      source: 'fallback',
    };
  }

  if (lower.includes('strict') || lower.includes('harder')) {
    const newTolerance = Math.min((b.frictionTolerance || 2) + 1, 5);
    return {
      text: `Understood! I've increased your friction to level ${newTolerance}/5. I'll be more aggressive about interrupting brainrot sessions.`,
      actions: [{ frictionTolerance: newTolerance }],
      source: 'fallback',
    };
  }

  if (lower.includes('gentle') || lower.includes('interrupt') || lower.includes('chill')) {
    const newTolerance = Math.max((b.frictionTolerance || 2) - 1, 1);
    return {
      text: `Got it, I'll ease up. Friction set to ${newTolerance}/5. I'll still track your browsing but won't interrupt as much.`,
      actions: [{ frictionTolerance: newTolerance }],
      source: 'fallback',
    };
  }

  if (lower.includes('focus') || lower.includes('help') || lower.includes('study')) {
    return {
      text: `Let's do this! Start a ${p.pomodoroLength}-minute Pomodoro session. I'll keep distractions blocked. Your best focus pattern is ${b.focusPatterns[0] || 'morning sessions'}.`,
      actions: [],
      source: 'fallback',
    };
  }

  if (lower.includes('stats') || lower.includes('score') || lower.includes('how am i')) {
    const avgScore = b.brainrotRate
      ? Math.round(b.brainrotRate * 100)
      : 50;
    return {
      text: `Here's your snapshot: Brainrot rate: ${avgScore}%, Avg session: ${b.avgScrollSession || 0}s, Sessions: ${b.totalSessions || 0}. ${avgScore > 50 ? 'Room for improvement!' : 'Looking good!'}`,
      actions: [],
      source: 'fallback',
    };
  }

  // Default
  return {
    text: `I'm your focus coach. Ask me things like "Why am I distracted?", "Be stricter", "Help me focus", or "Show my stats". I'll use your real browsing data to help.`,
    actions: [],
    source: 'fallback',
  };
}

/**
 * Apply profile actions from chat response.
 */
function applyActions(actions) {
  for (const action of actions) {
    if (action.frictionTolerance !== undefined) {
      updateProfile({ behavior: { frictionTolerance: action.frictionTolerance } });
    }
    if (action.tone !== undefined) {
      updateProfile({ preferences: { tone: action.tone } });
    }
    if (action.pomodoroLength !== undefined) {
      updateProfile({ preferences: { pomodoroLength: action.pomodoroLength } });
    }
    if (action.goal !== undefined) {
      updateProfile({ preferences: { goal: action.goal } });
    }
  }
}

/**
 * Get chat history.
 */
export function getChatHistory() {
  return storage.get(KEYS.CHAT_HISTORY, []);
}

/**
 * Append a message to chat history.
 */
function appendChatMessage(role, content, actions = []) {
  storage.append(KEYS.CHAT_HISTORY, {
    id: Date.now().toString(36) + Math.random().toString(36).substr(2, 5),
    role,
    content,
    actions,
    timestamp: new Date().toISOString(),
  });
}

/**
 * Clear chat history.
 */
export function clearChatHistory() {
  storage.set(KEYS.CHAT_HISTORY, []);
}

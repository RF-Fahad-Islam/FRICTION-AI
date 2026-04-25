/**
 * Background Service Worker (Module M1 — Extension Core)
 * Routes messages between content scripts, popup, and storage.
 */

// Brainrot URL patterns
const BRAINROT_PATTERNS = [
  { pattern: /instagram\.com\/reels/, score: 40 },
  { pattern: /youtube\.com\/shorts/, score: 40 },
  { pattern: /tiktok\.com/, score: 40 },
  { pattern: /twitter\.com/, score: 25 },
  { pattern: /x\.com/, score: 25 },
  { pattern: /reddit\.com/, score: 20 },
  { pattern: /facebook\.com\/(reel|reels|watch)/, score: 40 },
];

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'BRAINROT_DETECTED':
      handleBrainrotDetected(msg.payload, sender.tab);
      break;
    case 'GET_AI_PROMPT':
      getDynamicAiPrompt(msg.payload).then(sendResponse);
      return true;
    case 'FRICTION_RESPONSE':
      logFrictionResponse(msg.payload);
      break;
    case 'LOG_SCROLL_REASON':
      logScrollReason(msg.payload);
      break;
    case 'REEL_WATCHED':
    case 'UPDATE_REEL_COUNT':
      chrome.storage.local.get('sf_reel_count', (data) => {
        const total = (data.sf_reel_count || 0) + 1;
        chrome.storage.local.set({ sf_reel_count: total });
      });
      if (currentSession) {
        currentSession.reelCount = (currentSession.reelCount || 0) + 1;
      }
      break;
    case 'GET_FRICTION_CONFIG':
      getFrictionConfig(msg.payload.url).then(sendResponse);
      return true; // async response
    case 'GET_PROFILE':
      chrome.storage.local.get('sf_profile', (data) => {
        sendResponse(data.sf_profile || null);
      });
      return true;
  }
});

// Tab URL monitoring
let activeTabInfo = { url: null, domain: null, isBrainrot: false };
let currentSession = null; // { startTime, domain, duration, reelCount, reasons: [] }

function extractDomain(url) {
  try {
    return new URL(url).hostname;
  } catch (e) {
    return null;
  }
}

function updateActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    if (tabs && tabs.length > 0 && tabs[0].url) {
      const url = tabs[0].url;
      if (url.startsWith('chrome://') || url.startsWith('edge://')) {
        activeTabInfo = { url: null, domain: null, isBrainrot: false };
        return;
      }
      const domain = extractDomain(url);
      if (!domain) return;
      
      let isBrainrot = false;
      for (const p of BRAINROT_PATTERNS) {
        if (p.pattern.test(url)) {
          isBrainrot = true;
          break;
        }
      }
      activeTabInfo = { url, domain, isBrainrot };
    } else {
      activeTabInfo = { url: null, domain: null, isBrainrot: false };
    }
  });
}

chrome.tabs.onActivated.addListener(updateActiveTab);
chrome.windows.onFocusChanged.addListener((windowId) => {
  if (windowId === chrome.windows.WINDOW_ID_NONE) {
    activeTabInfo = { url: null, domain: null, isBrainrot: false };
  } else {
    updateActiveTab();
  }
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if ((changeInfo.status === 'complete' || changeInfo.url) && tab.url) {
    checkUrl(tab.url, tabId);
    updateActiveTab();
  }
});

// Periodic tracking every 1 second
setInterval(() => {
  if (activeTabInfo.domain) {
    // 1. Update cumulative domain activity
    chrome.storage.local.get(['sf_daily_activity', 'sf_reel_time'], (data) => {
      let activity = data.sf_daily_activity || {};
      let reelTime = data.sf_reel_time || 0;
      
      if (!activity[activeTabInfo.domain]) {
        activity[activeTabInfo.domain] = { timeSpent: 0, isBrainrot: activeTabInfo.isBrainrot };
      }
      activity[activeTabInfo.domain].isBrainrot = activeTabInfo.isBrainrot || activity[activeTabInfo.domain].isBrainrot;
      activity[activeTabInfo.domain].timeSpent += 1;
      
      if (activeTabInfo.isBrainrot) {
        reelTime += 1;
      }
      
      chrome.storage.local.set({ 
        sf_daily_activity: activity,
        sf_reel_time: reelTime
      });
    });

    // 2. Global Session Tracking (All sites)
    if (currentSession && currentSession.domain !== activeTabInfo.domain) {
      endSession();
    }

    if (!currentSession) {
      currentSession = {
        startTime: new Date().toISOString(),
        domain: activeTabInfo.domain,
        url: activeTabInfo.url,
        duration: 0,
        reelCount: 0,
        reasons: [],
        isBrainrot: activeTabInfo.isBrainrot
      };
    }
    currentSession.duration += 1;
    if (activeTabInfo.isBrainrot) {
      currentSession.isBrainrot = true;
    }
  } else if (currentSession) {
    endSession();
  }
}, 1000);

async function endSession() {
  if (!currentSession) return;
  currentSession.endTime = new Date().toISOString();
  
  const data = await chrome.storage.local.get('sf_sessions');
  const sessions = data.sf_sessions || [];
  sessions.push(currentSession);
  
  // Keep last 100 sessions
  if (sessions.length > 100) sessions.shift();
  
  await chrome.storage.local.set({ sf_sessions: sessions });
  currentSession = null;
}

function checkUrl(url, tabId) {
  let isBrainrot = false;
  for (const p of BRAINROT_PATTERNS) {
    if (p.pattern.test(url)) {
      isBrainrot = true;
      chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_DETECTION',
        payload: { baseScore: p.score, url },
      }).catch(() => {}); // Tab may not have content script
      break;
    }
  }
  
  if (!isBrainrot) {
    chrome.tabs.sendMessage(tabId, {
      type: 'DEACTIVATE_DETECTION'
    }).catch(() => {});
  }
}

async function handleBrainrotDetected(payload, tab) {
  // Log event
  const events = (await chrome.storage.local.get('sf_friction_log')).sf_friction_log || [];
  events.push({
    ...payload,
    tabId: tab?.id,
    timestamp: new Date().toISOString(),
  });
  if (events.length > 200) events.splice(0, events.length - 200);
  await chrome.storage.local.set({ sf_friction_log: events });
}

async function getFrictionConfig(url) {
  const profileData = await chrome.storage.local.get(['sf_profile', 'sf_reel_count', 'sf_reel_time', 'sf_scroll_reasons']);
  const profile = profileData.sf_profile;
  const tolerance = profile?.behavior?.frictionTolerance || 2;
  const reelCount = profileData.sf_reel_count || 0;
  const reelTime = profileData.sf_reel_time || 0;
  const reasons = profileData.sf_scroll_reasons || [];
  const lastReason = reasons.length > 0 ? reasons[reasons.length - 1].reason : 'unknown';

  let level = 2;
  let aiMessage = "Baseline friction applied.";

  // AI Decision Logic
  const apiKey = profile?.preferences?.apiKey;
  if (apiKey) {
    try {
      // For speed, we simulate the AI decision prompt but we could call an actual endpoint here
      // Real implementation would fetch from a service or directly call Gemini
      level = calculateAiFriction(reelCount, reelTime, lastReason, tolerance);
      aiMessage = `AI adjusted friction to level ${level} based on your ${reelCount} reels.`;
    } catch (e) {
      level = calculateHeuristicFriction(url, tolerance);
    }
  } else {
    level = calculateHeuristicFriction(url, tolerance, reelCount);
    aiMessage = `Adaptive friction (Level ${level}) active.`;
  }

  const configs = {
    1: { scrollDelay: 200, overlayOpacity: 0.1, cooldown: 0, popup: null, aiMessage },
    2: { scrollDelay: 500, overlayOpacity: 0.2, cooldown: 30, popup: 'intent', aiMessage },
    3: { scrollDelay: 1200, overlayOpacity: 0.4, cooldown: 60, popup: 'warning', aiMessage },
    4: { scrollDelay: 2500, overlayOpacity: 0.6, cooldown: 120, popup: 'warning', aiMessage },
    5: { scrollDelay: 5000, overlayOpacity: 0.8, cooldown: 300, popup: 'cooldown', aiMessage },
  };

  return { level, config: configs[level] || configs[2] };
}

function calculateAiFriction(reels, time, lastReason, tolerance) {
  // Simulated AI logic: more reels + bad reason = higher friction
  let base = tolerance;
  if (reels > 15) base += 2;
  else if (reels > 8) base += 1;
  
  if (['boredom', 'procrastinating'].includes(lastReason)) base += 1;
  if (time > 1800) base += 1; // 30 mins
  
  return Math.min(Math.max(1, base), 5);
}

function calculateHeuristicFriction(url, tolerance, reels = 0) {
  let level = tolerance;
  for (const p of BRAINROT_PATTERNS) {
    if (p.pattern.test(url)) {
      level = Math.min(tolerance + (p.score > 30 ? 1 : 0) + (reels > 10 ? 1 : 0), 5);
      break;
    }
  }
  return level;
}

function logFrictionResponse(payload) {
  chrome.storage.local.get('sf_friction_log', (data) => {
    const log = data.sf_friction_log || [];
    log.push({ ...payload, timestamp: new Date().toISOString() });
    if (log.length > 200) log.splice(0, log.length - 200);
    chrome.storage.local.set({ sf_friction_log: log });
  });
}

function logScrollReason(payload) {
  chrome.storage.local.get('sf_scroll_reasons', (data) => {
    const reasons = data.sf_scroll_reasons || [];
    reasons.push({ ...payload, timestamp: new Date().toISOString() });
    if (reasons.length > 1000) reasons.splice(0, reasons.length - 1000); // keep last 1000 reasons
    chrome.storage.local.set({ sf_scroll_reasons: reasons });
  });
  if (currentSession) {
    currentSession.reasons = currentSession.reasons || [];
    currentSession.reasons.push(payload.reason);
  }
}

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(prompt)
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error?.message || `API Error: ${res.status}`);
    }

    const data = await res.json();
    return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  } catch (e) {
    console.error('Gemini API Call Failed:', e);
    throw e;
  }
}

async function getDynamicAiPrompt({ reels, timeSpent }) {
  const profile = (await chrome.storage.local.get('sf_profile')).sf_profile;
  const apiKey = profile?.preferences?.apiKey;
  const tone = profile?.preferences?.tone || 'balanced';
  const reasons = (await chrome.storage.local.get('sf_scroll_reasons')).sf_scroll_reasons || [];
  const lastReason = reasons.length > 0 ? reasons[reasons.length - 1].reason : 'unknown';

  if (!apiKey) {
    const fallbackPrompts = [
      `You've watched ${reels} reels. Is your brain feeling a bit mushy yet?`,
      `${reels} reels in ${Math.round(timeSpent / 60)} minutes. The scroll is winning.`,
      `Stop at ${reels}. Don't let the algorithm consume your focus.`,
      `That's ${reels} dopamine hits. Time to step back into reality.`,
      `Your future self is watching you watch these ${reels} reels. Proceed?`
    ];
    return { text: fallbackPrompts[Math.floor(Math.random() * fallbackPrompts.length)] };
  }

  try {
    const { frictionMessagePrompt } = await import('./services/aiPrompts.js');
    const prompt = frictionMessagePrompt(reels, timeSpent, tone, lastReason);
    const response = await callGemini(apiKey, prompt);
    return { text: response.trim() };
  } catch (e) {
    console.error('AI Prompt Error:', e);
    return { text: `You've hit ${reels} reels. Time to evaluate your intent.` };
  }
}

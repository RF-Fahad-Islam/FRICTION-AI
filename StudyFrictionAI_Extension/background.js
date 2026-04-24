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
  { pattern: /facebook\.com\/watch/, score: 30 },
];

// Listen for messages from content scripts
chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  switch (msg.type) {
    case 'BRAINROT_DETECTED':
      handleBrainrotDetected(msg.payload, sender.tab);
      break;
    case 'FRICTION_RESPONSE':
      logFrictionResponse(msg.payload);
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
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    checkUrl(tab.url, tabId);
  }
});

function checkUrl(url, tabId) {
  for (const p of BRAINROT_PATTERNS) {
    if (p.pattern.test(url)) {
      chrome.tabs.sendMessage(tabId, {
        type: 'ACTIVATE_DETECTION',
        payload: { baseScore: p.score, url },
      }).catch(() => {}); // Tab may not have content script
      return;
    }
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
  const profile = (await chrome.storage.local.get('sf_profile')).sf_profile;
  const tolerance = profile?.behavior?.frictionTolerance || 2;

  // Simple friction level calculation
  let level = 2;
  for (const p of BRAINROT_PATTERNS) {
    if (p.pattern.test(url)) {
      level = Math.min(tolerance + (p.score > 30 ? 1 : 0), 5);
      break;
    }
  }

  const configs = {
    1: { scrollDelay: 200, overlayOpacity: 0.1, cooldown: 0, popup: null },
    2: { scrollDelay: 500, overlayOpacity: 0.2, cooldown: 30, popup: 'intent' },
    3: { scrollDelay: 1000, overlayOpacity: 0.4, cooldown: 60, popup: 'warning' },
    4: { scrollDelay: 2000, overlayOpacity: 0.6, cooldown: 120, popup: 'warning' },
    5: { scrollDelay: 5000, overlayOpacity: 0.8, cooldown: 300, popup: 'cooldown' },
  };

  return { level, config: configs[level] || configs[2] };
}

function logFrictionResponse(payload) {
  chrome.storage.local.get('sf_friction_log', (data) => {
    const log = data.sf_friction_log || [];
    log.push({ ...payload, timestamp: new Date().toISOString() });
    chrome.storage.local.set({ sf_friction_log: log });
  });
}

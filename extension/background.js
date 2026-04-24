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
    case 'LOG_SCROLL_REASON':
      logScrollReason(msg.payload);
      break;
    case 'REEL_WATCHED':
      chrome.storage.local.get('sf_reels_watched', (data) => {
        chrome.storage.local.set({ sf_reels_watched: (data.sf_reels_watched || 0) + 1 });
      });
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
    chrome.storage.local.get(['sf_daily_activity', 'sf_reel_time'], (data) => {
      let activity = data.sf_daily_activity || {};
      let reelTime = data.sf_reel_time || 0;
      
      if (!activity[activeTabInfo.domain]) {
        activity[activeTabInfo.domain] = { timeSpent: 0, isBrainrot: activeTabInfo.isBrainrot };
      }
      // Update brainrot status if necessary
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
  }
}, 1000);

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
}

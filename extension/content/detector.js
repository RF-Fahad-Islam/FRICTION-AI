/**
 * Content Script: Brainrot Detector (Module M3)
 * Monitors scroll behavior and time on brainrot platforms.
 */

(function() {
  'use strict';

  let scrollCount = 0;
  let startTime = Date.now();
  let lastScrollTime = 0;
  let frictionConfig = null;
  let isActive = false;
  let checkInterval = null;
  
  function isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }

  // Listen for activation from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ACTIVATE_DETECTION') {
      activate(msg.payload);
    } else if (msg.type === 'DEACTIVATE_DETECTION') {
      deactivate();
    }
  });

  function activate(payload) {
    if (isActive) return;
    isActive = true;
    startTime = Date.now();
    scrollCount = 0;

    // Get friction config from background
    if (isContextValid()) {
      chrome.runtime.sendMessage(
        { type: 'GET_FRICTION_CONFIG', payload: { url: window.location.href } },
        (response) => {
          if (chrome.runtime.lastError) return;
          if (response) {
            frictionConfig = response;
            window.dispatchEvent(new CustomEvent('sf-friction-config', { detail: response }));
          }
        }
      );
    }

    // Monitor scrolling (use capture so friction.js doesn't hide it)
    window.addEventListener('scroll', onScroll, { passive: true, capture: true });
    window.addEventListener('wheel', onWheel, { passive: true, capture: true });
    document.addEventListener('touchmove', onScroll, { passive: true, capture: true });

    // Periodic brainrot check
    checkInterval = setInterval(checkBrainrot, 10000); // every 10s
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    window.removeEventListener('scroll', onScroll, { capture: true });
    window.removeEventListener('wheel', onWheel, { capture: true });
    document.removeEventListener('touchmove', onScroll, { capture: true });
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    window.dispatchEvent(new CustomEvent('sf-friction-deactivate'));
  }

  function onScroll() {
    scrollCount++;
    lastScrollTime = Date.now();
  }

  function onWheel() {
    scrollCount++;
    lastScrollTime = Date.now();
  }

  function checkBrainrot() {
    const timeSpent = (Date.now() - startTime) / 1000;
    const score = calculateScore(scrollCount, timeSpent);

    if (score >= 50) {
      if (isContextValid()) {
        chrome.runtime.sendMessage({
          type: 'BRAINROT_DETECTED',
          payload: {
            url: window.location.href,
            score,
            scrollCount,
            timeSpent: Math.round(timeSpent),
          },
        });
      }

      // Trigger friction UI
      window.dispatchEvent(new CustomEvent('sf-brainrot-alert', {
        detail: { score, scrollCount, timeSpent: Math.round(timeSpent) },
      }));
    }
  }

  function calculateScore(scrolls, time) {
    const scrollScore = Math.min(scrolls / 50, 1) * 30;
    const timeScore = Math.min(time / 600, 1) * 30;
    const baseScore = 40; // We're already on a brainrot site
    return Math.round(Math.min(baseScore + scrollScore + timeScore, 100));
  }

  // Cleanup on page unload
  window.addEventListener('beforeunload', () => {
    isActive = false;
    if (checkInterval) clearInterval(checkInterval);
  });
})();

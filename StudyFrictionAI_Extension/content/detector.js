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

  // Listen for activation from background
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === 'ACTIVATE_DETECTION') {
      activate(msg.payload);
    }
  });

  function activate(payload) {
    if (isActive) return;
    isActive = true;
    startTime = Date.now();
    scrollCount = 0;

    // Get friction config from background
    chrome.runtime.sendMessage(
      { type: 'GET_FRICTION_CONFIG', payload: { url: window.location.href } },
      (response) => {
        if (response) {
          frictionConfig = response;
          window.dispatchEvent(new CustomEvent('sf-friction-config', { detail: response }));
        }
      }
    );

    // Monitor scrolling
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('wheel', onWheel, { passive: true });
    document.addEventListener('touchmove', onScroll, { passive: true });

    // Periodic brainrot check
    checkInterval = setInterval(checkBrainrot, 10000); // every 10s
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
      chrome.runtime.sendMessage({
        type: 'BRAINROT_DETECTED',
        payload: {
          url: window.location.href,
          score,
          scrollCount,
          timeSpent: Math.round(timeSpent),
        },
      });

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

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
  let currentUrl = location.href;

  function isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        handleNewReel();
        videoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  const urlObserver = new MutationObserver(() => {
    if (location.href !== currentUrl) {
      currentUrl = location.href;
      handleNewReel();
    }
    
    // Observe new video elements
    document.querySelectorAll('video:not([data-sf-observed])').forEach(v => {
      v.setAttribute('data-sf-observed', 'true');
      videoObserver.observe(v);
    });
  });

  function handleNewReel() {
    scrollCount++;
    lastScrollTime = Date.now();
    if (isContextValid()) {
      chrome.runtime.sendMessage({ type: 'REEL_WATCHED' });
    }

    if (scrollCount === 15) {
      window.dispatchEvent(new CustomEvent('sf-brainrot-alert', {
        detail: { score: 100, scrollCount, timeSpent: 0, forceIntent: true },
      }));
    }
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
    currentUrl = location.href;

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

    // Start observing URL changes and video nodes
    urlObserver.observe(document.body, { childList: true, subtree: true });
    
    // Catch existing videos
    document.querySelectorAll('video:not([data-sf-observed])').forEach(v => {
      v.setAttribute('data-sf-observed', 'true');
      videoObserver.observe(v);
    });

    // Periodic brainrot check
    checkInterval = setInterval(checkBrainrot, 10000); // every 10s
  }

  function deactivate() {
    if (!isActive) return;
    isActive = false;
    urlObserver.disconnect();
    videoObserver.disconnect();
    
    if (checkInterval) {
      clearInterval(checkInterval);
      checkInterval = null;
    }
    window.dispatchEvent(new CustomEvent('sf-friction-deactivate'));
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

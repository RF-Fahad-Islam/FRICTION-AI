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
  let currentUrl = location.href; // Kept for legacy observer, but we'll use lastUrl for tracking
  let checkInterval = null;
  let lastReelTime = 0;

  // Track the current URL
  let lastUrl = location.href;
  let consecutiveReels = 0;

  // Lightweight polling for SPA dynamic URL changes
  setInterval(() => {
    if (location.href !== lastUrl) {
      lastUrl = location.href;
      
      // Explicitly check if it's a Reel/Short to avoid counting normal page navigation
      const path = location.pathname;
      const isReel = path.includes('/reels/') || path.includes('/reel/') || path.includes('/watch') || path.includes('/shorts/') || location.hostname.includes('tiktok.com');
      if (!isReel) return;

      const now = Date.now();
      // Debounce by 1.5 seconds to prevent double-counting rapid swipes
      if (now - lastReelTime < 1500) return;
      lastReelTime = now;

      // Update global scroll count for Brainrot Score
      scrollCount++;
      lastScrollTime = now;
      
      // Dispatch message to background script
      try {
        if (typeof chrome !== 'undefined' && chrome.runtime && chrome.runtime.id) {
          chrome.runtime.sendMessage({ type: 'REEL_WATCHED' });
        }
      } catch (e) {
        console.log('Context invalidated, please refresh');
      }

      // Intent Intercept Trigger
      consecutiveReels++;
      if (consecutiveReels >= 15) {
        // Trigger Intent Intercept overlay logic
        window.dispatchEvent(new CustomEvent('sf-brainrot-alert', {
          detail: { score: 100, scrollCount, timeSpent: 0, forceIntent: true },
        }));

        // Pause the video
        document.querySelectorAll('video').forEach(v => {
          if (!v.paused) v.pause();
        });

        // Reset the counter
        consecutiveReels = 0;
      }
    }
  }, 500);

  function isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }

  const videoObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      // Intersection observer kept active for DOM-only transitions, 
      // but URL interval handles the main logic.
      if (entry.isIntersecting) {
        // Optional fallback: If URL didn't change but video intersected
        videoObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.1 });

  const urlObserver = new MutationObserver(() => {
    // Observe new video elements
    document.querySelectorAll('video:not([data-sf-observed])').forEach(v => {
      v.setAttribute('data-sf-observed', 'true');
      videoObserver.observe(v);
    });
  });

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
    try {
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
    } catch (e) {
      console.log('Context invalidated, please refresh');
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
      try {
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
      } catch (e) {
        console.log('Context invalidated, please refresh');
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

  // Proactive initialization for first-load race conditions
  setTimeout(() => {
    if (!isActive) {
      const path = location.pathname;
      const isReel = path.includes('/reels/') || path.includes('/reel/') || path.includes('/watch') || path.includes('/shorts/') || location.hostname.includes('tiktok.com');
      
      // Abort self-activation if we are not explicitly on a reel path
      if (!isReel) return; 

      try {
        chrome.runtime.sendMessage(
          { type: 'GET_FRICTION_CONFIG', payload: { url: location.href } },
          (response) => {
            if (response && !isActive) {
              activate({ baseScore: 40, url: location.href });
            }
          }
        );
      } catch (e) {
        console.log('Context invalidated on self-activation');
      }
    }
  }, 500);
})();

/**
 * Content Script: Friction Engine (Module M2) — Full Implementation
 *
 * Features:
 *  1. Heavy Scrolling     — wheel events accumulate; only advances reel when bar fills
 *  2. Dopamine Desaturation — grayscale filter grows over time on-page
 *  3. Intent Intercept    — after 10 reels, scroll locks + reason prompt
 *  4. Relentless Transparency — persistent un-closable session timer on screen
 */

(function () {
  'use strict';

  // Add site-specific class for scoped CSS rules
  const hostname = window.location.hostname;
  if (hostname.includes('instagram.com')) document.documentElement.classList.add('sf-site-instagram');
  if (hostname.includes('facebook.com')) document.documentElement.classList.add('sf-site-facebook');
  if (hostname.includes('youtube.com')) document.documentElement.classList.add('sf-site-youtube');

  let config = null;

  function isContextValid() {
    return typeof chrome !== 'undefined' && !!chrome.runtime && !!chrome.runtime.id;
  }
  let overlayEl = null;
  let isInCooldown = false;
  let intentPopupCooldown = 0;
  let blockScrollHandler = null;

  // ─── Session tracking ──────────────────────────────────────────────────────
  let sessionStartTime = null;
  let currentDomain = null;
  let currentUrl = window.location.href;
  let reelCount = 0;        // consecutive reels watched
  let lastActiveTimestamp = Date.now();

  function getCurrentDynamicLevel() {
    const sessionMinutes = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 60000) : 0;
    
    let dynamicLevel = config ? parseInt(config.level, 10) : 1;
    dynamicLevel += Math.floor(sessionMinutes / 5); // slow: +1 every 5 mins
    dynamicLevel += Math.floor(reelCount / 15);     // slow: +1 every 15 reels
    
    return Math.min(Math.max(dynamicLevel, 1), 5);
  }


  // SPA Navigation Detection for Reel Counting (Accurate tracking)
  const checkUrlChange = () => {
    if (window.location.href !== currentUrl) {
      currentUrl = window.location.href;
      lastActiveTimestamp = Date.now();

      const isReelPath = (url) => url.includes('/shorts/') || url.includes('/reels/') || url.includes('/reel/') || url.includes('/watch');

      if (isReelPath(currentUrl)) {
        reelCount++;
        if (config && isContextValid()) {
          chrome.storage.local.set({ sf_current_friction_level: getCurrentDynamicLevel(), sf_last_active: Date.now() });
        }
        if (config && config.level >= 1) {
          document.body.classList.add('sf-hide-interactions');
          document.body.setAttribute('data-sf-domain', window.location.hostname);
        }
        if (isContextValid()) {
          chrome.runtime.sendMessage({ type: 'UPDATE_REEL_COUNT', payload: { count: reelCount } }).catch(() => { });
        }
        checkIntentIntercept();
      } else {
        document.body.classList.remove('sf-hide-interactions');
        window.dispatchEvent(new CustomEvent('sf-friction-deactivate'));
      }
    }
  };

  setInterval(checkUrlChange, 500); // High frequency check
  window.addEventListener('popstate', checkUrlChange);
  window.addEventListener('hashchange', checkUrlChange);

  const originalPushState = history.pushState;
  history.pushState = function () {
    originalPushState.apply(this, arguments);
    checkUrlChange();
  };
  const originalReplaceState = history.replaceState;
  history.replaceState = function () {
    originalReplaceState.apply(this, arguments);
    checkUrlChange();
  };

  // ─── DOM Elements ──────────────────────────────────────────────────────────
  let fillBarEl = null;
  let timerOverlayEl = null;
  let grayscaleLockEl = null;
  let previewEl = null;
  let grayscaleInterval = null;
  let timerInterval = null;

  // ═══════════════════════════════════════════════════════════════════════════
  //  ACTIVATION / DEACTIVATION
  // ═══════════════════════════════════════════════════════════════════════════

  window.addEventListener('sf-friction-config', (e) => {
    const newConfig = e.detail;
    const domain = window.location.hostname;
    const baseLevel = newConfig.level || 2;

    // Only reset session if we changed domains or it's a fresh start
    if (!sessionStartTime || domain !== currentDomain) {
      sessionStartTime = Date.now();
      currentDomain = domain;
      reelCount = 0;

      // Start/Restart effects
      startDopamineDesaturation();
      startTransparencyTimer();
    }

    config = newConfig;

    // Toggle interaction visibility (Dopamine Desaturation)
    const isReelPath = (url) => url.includes('/shorts/') || url.includes('/reels/') || url.includes('/reel/') || url.includes('/watch');
    if (isReelPath(window.location.href) && config.level >= 1) {
      document.body.classList.add('sf-hide-interactions');
      document.body.setAttribute('data-sf-domain', window.location.hostname);
    } else {
      document.body.classList.remove('sf-hide-interactions');
    }

    // Heavy Scrolling with dynamic friction based on session time
    const sessionTimeSeconds = sessionStartTime ? Math.floor((Date.now() - sessionStartTime) / 1000) : 0;
    applyScrollFriction(baseLevel, sessionTimeSeconds, reelCount);

    if (isContextValid()) {
      chrome.storage.local.set({ sf_current_friction_level: getCurrentDynamicLevel() });
    }
  });

  window.addEventListener('sf-friction-deactivate', () => {
    removeOverlay();
    removeScrollFriction();
    stopDopamineDesaturation();
    removeGrayscaleLock();
    removeTransparencyTimer();
    document.body.classList.remove('sf-hide-interactions');
    config = null;
    sessionStartTime = null;
    reelCount = 0;
    // Intent intercept is handled in checkIntentIntercept based on reelCount
  });

  // ═══════════════════════════════════════════════════════════════════════════
  //  1. HEAVY SCROLLING — Fill-bar must fill before advancing to next reel
  // ═══════════════════════════════════════════════════════════════════════════

  function applyScrollFriction(baseLevel, sessionTimeSeconds = 0, scrollCount = 0) {
    if (blockScrollHandler) return;
    let scrollAccumulator = 0;
    let isScrollUnlocked = false;
    let lastTouchY = 0;

    blockScrollHandler = (e) => {
      if (isScrollUnlocked) return;

      // 30-Minute Inactivity Reset
      if (Date.now() - lastActiveTimestamp >= 30 * 60 * 1000) {
        sessionStartTime = Date.now();
        reelCount = 0;
      }
      lastActiveTimestamp = Date.now();
      if (config && isContextValid()) {
        chrome.storage.local.set({ sf_current_friction_level: getCurrentDynamicLevel(), sf_last_active: Date.now() });
      }

      const level = getCurrentDynamicLevel();

      // Widen the gap massively between levels so L2 is genuinely harder than L1
      const baseDeltas = { 
        1: 250,   // Very easy (1-2 scroll notches)
        2: 800,   // Moderate / noticeable effort (distinctly harder)
        3: 1800,  // Hard (genuinely annoying)
        4: 3500,  // Very hard (requires significant dedicated swipes)
        5: 6000   // Maximum (violently hard to pass)
      };
      const baseDelta = baseDeltas[level] || 250;
      
      // Flatten the inter-level growth so difficulty jumps are dictated by the levels
      const requiredDelta = baseDelta;

      let delta = 0;

      if (e.type === 'wheel') {
        delta = Math.abs(e.deltaY);
        if (e.deltaY === 0) return;
      } else if (e.type === 'touchstart') {
        lastTouchY = e.touches[0].clientY;
        // Do not prevent default on touchstart to preserve tap/click functionality
        return;
      } else if (e.type === 'touchmove') {
        const currentY = e.touches[0].clientY;
        delta = Math.abs(currentY - lastTouchY);
        lastTouchY = currentY;
        if (delta === 0) return;
      } else {
        return;
      }

      scrollAccumulator += delta;
      const progress = Math.min(scrollAccumulator, requiredDelta);
      updateFillBar(progress, requiredDelta);

      // Conscious Preview: Scrape next reel title and show it
      if (progress > (requiredDelta * 0.3)) {
        const nextTitle = getNextReelTitle();
        if (nextTitle) showNextPreview(nextTitle);
      }

      if (scrollAccumulator >= requiredDelta) {
        scrollAccumulator = 0;
        hideFillBar();
        hideNextPreview();
        isScrollUnlocked = true;
        // Reduce unlock window to 400ms to prevent multi-swiping frictionless reels
        setTimeout(() => { isScrollUnlocked = false; }, 400); 
        return; // Allow the scroll event to pass through natively
      } else {
        // Aggressively prevent default on the actual target to block scroll snapping containers
        e.preventDefault();
        e.stopPropagation();
      }
    };

    document.addEventListener('wheel', blockScrollHandler, { passive: false, capture: true });
    document.addEventListener('touchstart', blockScrollHandler, { passive: false, capture: true });
    document.addEventListener('touchmove', blockScrollHandler, { passive: false, capture: true });
    document.addEventListener('keydown', keydownBlocker, { passive: false, capture: true });
  }

  function keydownBlocker(e) {
    // 30-Minute Inactivity Reset
    if (Date.now() - lastActiveTimestamp >= 30 * 60 * 1000) {
      sessionStartTime = Date.now();
      reelCount = 0;
    }
    lastActiveTimestamp = Date.now();

    const blockedKeys = ['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown'];
    if (blockedKeys.includes(e.code)) {
      e.preventDefault();
      e.stopPropagation();
      createFillBar();
      fillBarEl.classList.add('sf-visible');
      setTimeout(() => { if (!blockScrollHandler) hideFillBar(); }, 800);
    }
  }

  function removeScrollFriction() {
    if (!blockScrollHandler) return;
    document.removeEventListener('wheel', blockScrollHandler, { capture: true });
    document.removeEventListener('touchstart', blockScrollHandler, { capture: true });
    document.removeEventListener('touchmove', blockScrollHandler, { capture: true });
    document.removeEventListener('keydown', keydownBlocker, { capture: true });
    blockScrollHandler = null;
    hideFillBar();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  2. DOPAMINE DESATURATION — Page goes gray over time
  // ═══════════════════════════════════════════════════════════════════════════

  function startDopamineDesaturation() {
    stopDopamineDesaturation();
    // Starts at 0%, reaches 80% after 10 minutes, then stays there
    const totalMs = 10 * 60 * 1000; // 10 minutes

    grayscaleInterval = setInterval(() => {
      if (!sessionStartTime) return;
      
      const currentLevel = getCurrentDynamicLevel();
      if (currentLevel < 5) {
        applyGrayscaleToPage(0);
        return;
      }

      const elapsed = Date.now() - sessionStartTime;
      const pct = Math.min(elapsed / totalMs, 1);
      // Use a power curve so the effect is subtle at first, then strong
      const grayscale = Math.round(Math.pow(pct, 0.7) * 80);
      document.documentElement.style.setProperty('--sf-page-grayscale', `${grayscale}%`);
      applyGrayscaleToPage(grayscale);
    }, 2000); // Update every 2s
  }

  function applyGrayscaleToPage(grayscalePct) {
    // Apply to html element so it covers the whole page
    if (grayscalePct === 0) {
      document.documentElement.style.filter = '';
    } else {
      document.documentElement.style.filter = `grayscale(${grayscalePct}%)`;
    }
    document.documentElement.style.transition = 'filter 2s ease';
  }

  function stopDopamineDesaturation() {
    if (grayscaleInterval) {
      clearInterval(grayscaleInterval);
      grayscaleInterval = null;
    }
    // Restore color
    document.documentElement.style.filter = '';
    document.documentElement.style.transition = '';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  3. INTENT INTERCEPT — Lock after 10 consecutive reels
  // ═══════════════════════════════════════════════════════════════════════════

  function checkIntentIntercept() {
    const currentLevel = getCurrentDynamicLevel();
    if (currentLevel < 2) return;

    // Apply grayscale layer after 10 reels
    if (reelCount >= 10 && currentLevel === 5) {
      showGrayscaleLock();
    }

    // Hard-lock at 10th reel
    if (reelCount >= 10 && Date.now() > intentPopupCooldown) {
      if (isContextValid()) {
        chrome.runtime.sendMessage({
          type: 'GET_AI_PROMPT',
          payload: { reels: reelCount, timeSpent: (Date.now() - sessionStartTime) / 1000 }
        }, (response) => {
          if (response && response.text) {
            showIntentIntercept(response.text);
          } else {
            showIntentIntercept();
          }
        });
      } else {
        showIntentIntercept();
      }
    }
  }



  function showIntentIntercept(dynamicMessage) {
    if (document.getElementById('sf-overlay')) return;

    const message = dynamicMessage || `You've watched <strong>${reelCount} reels</strong>. Is this intentional?`;

    overlayEl = createOverlay(`
      <div class="sf-card sf-card-intercept">
        <div class="sf-icon">🧠</div>
        <h2>Intent Check</h2>
        <p class="sf-score">${message}</p>
        <p class="sf-subtext">Why are you continuing to scroll?</p>
        <div class="sf-buttons">
          <button class="sf-btn sf-btn-secondary" data-action="boredom">😐 Boredom</button>
          <button class="sf-btn sf-btn-secondary" data-action="procrastinating">😬 Procrastinating</button>
          <button class="sf-btn sf-btn-secondary" data-action="mood_off">😔 Mood Off / Stressed</button>
          <button class="sf-btn sf-btn-primary" data-action="break">✅ Planned Break</button>
          <button class="sf-btn sf-btn-secondary" data-action="learning">📚 Actually Learning</button>
        </div>
      </div>
    `, 0.9);

    overlayEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const reason = btn.dataset.action;
        if (isContextValid()) {
          chrome.runtime.sendMessage({
            type: 'LOG_SCROLL_REASON',
            payload: { reason, reelCount, url: window.location.href },
          });
        }

        // Unlock — add a cooldown before intercept fires again

        intentPopupCooldown = Date.now() + (reason === 'break' || reason === 'learning' ? 300000 : 120000);
        removeOverlay();
        removeGrayscaleLock();
      });
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  4. RELENTLESS TRANSPARENCY — Persistent un-closable session timer
  // ═══════════════════════════════════════════════════════════════════════════

  function startTransparencyTimer() {
    removeTransparencyTimer();

    timerOverlayEl = document.createElement('div');
    timerOverlayEl.id = 'sf-transparency-timer';
    timerOverlayEl.className = 'sf-transparency-timer';
    timerOverlayEl.innerHTML = `
      <div class="sf-timer-inner">
        <span class="sf-timer-label" id="sf-timer-category"></span>
        <span class="sf-timer-clock" id="sf-timer-clock">00:00</span>
      </div>
    `;
    document.body.appendChild(timerOverlayEl);

    // Force the element to stay (fight removal attempts)
    const observer = new MutationObserver(() => {
      if (!document.getElementById('sf-transparency-timer') && sessionStartTime) {
        document.body.appendChild(timerOverlayEl);
      }
    });
    observer.observe(document.body, { childList: true });

    timerInterval = setInterval(() => {
      if (!sessionStartTime) return;
      const elapsed = Math.floor((Date.now() - sessionStartTime) / 1000);
      const clockEl = document.getElementById('sf-timer-clock');
      if (clockEl) {
        clockEl.textContent = formatTime(elapsed);

        // Intensify feedback after 5 minutes
        if (elapsed > 300) {
          clockEl.classList.add('sf-pulsing');
        } else {
          clockEl.classList.remove('sf-pulsing');
        }
      }
    }, 1000);
  }

  function removeTransparencyTimer() {
    if (timerInterval) {
      clearInterval(timerInterval);
      timerInterval = null;
    }
    const el = document.getElementById('sf-transparency-timer');
    if (el) el.remove();
    timerOverlayEl = null;
  }

  function formatTime(seconds) {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  }

  function updateTimerCategory(category) {
    const labelEl = document.getElementById('sf-timer-category');
    if (labelEl) {
      const labels = {
        productivity: '💼 Productive',
        learning: '📚 Learning',
        entertainment: '🎬 Entertainment',
        timeWaste: '⏳ Time Waste',
        brainrot: '🧟 Brainrot',
        mixed: '🔀 Mixed',
        unknown: '❓ Unknown'
      };
      labelEl.textContent = labels[category] || labels.unknown;
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  WARNING / COOLDOWN OVERLAYS (existing)
  // ═══════════════════════════════════════════════════════════════════════════

  function showWarningOverlay(data) {
    if (document.getElementById('sf-overlay')) return;
    overlayEl = createOverlay(`
      <div class="sf-card sf-card-warning">
        <div class="sf-icon">⚠️</div>
        <h2>You're doomscrolling</h2>
        <p class="sf-score">Brainrot Score: <strong class="sf-danger">${data.score}</strong>/100</p>
        <p class="sf-subtext">You've scrolled ${data.scrollCount} times in ${Math.round(data.timeSpent / 60)} minutes.</p>
        <p class="sf-subtext">Is this really what you want to be doing?</p>
        <div class="sf-buttons">
          <button class="sf-btn sf-btn-primary" data-action="stop">I'll stop now</button>
          <button class="sf-btn sf-btn-secondary" data-action="5more">5 more minutes</button>
        </div>
      </div>
    `, 0.5);

    overlayEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        if (isContextValid()) {
          chrome.runtime.sendMessage({
            type: 'FRICTION_RESPONSE',
            payload: { action, response: action === 'stop' ? 'obeyed' : 'ignored', url: window.location.href },
          });
        }
        if (action === 'stop') {
          history.back();
        } else {
          intentPopupCooldown = Date.now() + 300000;
        }
        removeOverlay();
      });
    });
  }

  function showCooldownOverlay(data) {
    if (document.getElementById('sf-overlay')) return;
    isInCooldown = true;
    let countdown = config?.config?.cooldown || 60;

    overlayEl = createOverlay(`
      <div class="sf-card sf-card-cooldown">
        <div class="sf-icon">🧊</div>
        <h2>Cooldown Active</h2>
        <p class="sf-score">Score: <strong class="sf-danger">${data.score}</strong> — Take a breather.</p>
        <div class="sf-countdown" id="sf-countdown">${formatTime(countdown)}</div>
        <p class="sf-subtext sf-quote">"The ability to focus is the most important skill for the 21st century."</p>
      </div>
    `, 0.85);

    const countdownEl = overlayEl.querySelector('#sf-countdown');
    const timer = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = formatTime(countdown);
      if (countdown <= 0) {
        clearInterval(timer);
        isInCooldown = false;
        removeOverlay();
      }
    }, 1000);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  FILL BAR HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function createFillBar() {
    if (!fillBarEl) {
      fillBarEl = document.createElement('div');
      fillBarEl.className = 'sf-scroll-fill-bar';
      const inner = document.createElement('div');
      inner.className = 'sf-scroll-fill-inner';
      fillBarEl.appendChild(inner);
      document.body.appendChild(fillBarEl);
    }
  }

  function updateFillBar(progress, max) {
    createFillBar();
    fillBarEl.classList.add('sf-visible');
    const inner = fillBarEl.querySelector('.sf-scroll-fill-inner');
    const pct = Math.min(100, Math.max(0, (progress / max) * 100));
    inner.style.width = `${pct}%`;
  }

  function hideFillBar() {
    if (fillBarEl) {
      fillBarEl.classList.remove('sf-visible');
      const inner = fillBarEl.querySelector('.sf-scroll-fill-inner');
      if (inner) inner.style.width = '0%';
    }
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  GRAYSCALE LOCK HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function showGrayscaleLock() {
    if (!grayscaleLockEl) {
      grayscaleLockEl = document.createElement('div');
      grayscaleLockEl.id = 'sf-grayscale-lock';
      grayscaleLockEl.className = 'sf-grayscale-lock';
      document.body.appendChild(grayscaleLockEl);
    }
    // Small delay to ensure transition works if just created
    requestAnimationFrame(() => grayscaleLockEl.classList.add('sf-active'));
  }

  function removeGrayscaleLock() {
    if (grayscaleLockEl) {
      grayscaleLockEl.classList.remove('sf-active');
      // Keep element for reuse, just hide it
    }
    // Also clear any filters on documentElement
    document.documentElement.style.filter = '';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  OVERLAY HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function createOverlay(innerHTML, opacity) {
    const el = document.createElement('div');
    el.id = 'sf-overlay';
    el.className = 'sf-overlay';
    el.style.setProperty('--sf-opacity', opacity);
    el.innerHTML = innerHTML;
    document.body.appendChild(el);
    requestAnimationFrame(() => el.classList.add('sf-visible'));
    return el;
  }

  function removeOverlay() {
    const el = document.getElementById('sf-overlay');
    if (el) {
      el.classList.remove('sf-visible');
      setTimeout(() => el.remove(), 300);
    }
    overlayEl = null;
  }

  // ═══════════════════════════════════════════════════════════════════════════
  //  CONSCIOUS PREVIEW HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  function getNextReelTitle() {
    try {
      // YouTube Shorts: Find active renderer, then look at next sibling
      const activeRenderer = document.querySelector('ytd-reel-video-renderer[active]');
      if (activeRenderer) {
        const nextRenderer = activeRenderer.nextElementSibling;
        if (nextRenderer && nextRenderer.tagName === 'YTD-REEL-VIDEO-RENDERER') {
          const titleEl = nextRenderer.querySelector('h2.title yt-formatted-string');
          if (titleEl) return titleEl.textContent;
        }
      }

      // Instagram: Adjacent articles
      const articles = Array.from(document.querySelectorAll('article'));
      const activeIndex = articles.findIndex(a => {
        const rect = a.getBoundingClientRect();
        return rect.top >= -100 && rect.top <= 100;
      });
      if (activeIndex !== -1 && articles[activeIndex + 1]) {
        const next = articles[activeIndex + 1];
        const meta = next.querySelector('span[dir="auto"]') || next.querySelector('h1') || next.querySelector('img[alt]');
        if (meta) return meta.textContent || meta.alt;
      }
    } catch (e) { console.error('Scraping error:', e); }
    return null;
  }

  function showNextPreview(title) {
    if (!previewEl) {
      previewEl = document.createElement('div');
      previewEl.className = 'sf-next-preview';
      document.body.appendChild(previewEl);
    }
    previewEl.innerHTML = `<span class="sf-preview-label">Next Up:</span> <span>${title}</span>`;
    previewEl.classList.add('sf-visible');
  }

  function hideNextPreview() {
    if (previewEl) previewEl.classList.remove('sf-visible');
  }

  // Soft Block Message Handler
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === 'SHOW_SOFT_BLOCK') {
      showSoftBlock(msg.payload);
    }
  });

  function showSoftBlock({ domain }) {
    if (document.getElementById('sf-overlay')) return;

    overlayEl = createOverlay(`
      <div class="sf-card sf-card-blocked">
        <div class="sf-icon">🚫</div>
        <h2>Site Blocked</h2>
        <p class="sf-score"><strong>${domain}</strong> is on your blocklist.</p>
        <p class="sf-subtext">Why are you visiting this site?</p>
        <div class="sf-buttons">
          <button class="sf-btn sf-btn-secondary" data-action="productive">💼 Productive Task</button>
          <button class="sf-btn sf-btn-secondary" data-action="quick_check">👀 Quick Check (2min)</button>
          <button class="sf-btn sf-btn-primary" data-action="add_time">⏱️ Add 10 mins</button>
          <button class="sf-btn sf-btn-secondary" data-action="take_break">🧘 Take a Break</button>
        </div>
      </div>
    `, 0.85);

    overlayEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        const reason = action;
        let duration = 0;
        
        if (action === 'quick_check') duration = 2;
        else if (action === 'add_time') duration = 10;
        
        if (isContextValid()) {
          chrome.runtime.sendMessage({
            type: 'BLOCK_BYPASS',
            payload: { domain, reason, duration }
          });
        }

        if (action === 'take_break') {
          history.back();
        }
        
        removeOverlay();
      });
    });
  }

})();

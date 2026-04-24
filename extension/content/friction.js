/**
 * Content Script: Friction Engine (Module M2)
 * Applies scroll delays, warning overlays, and cooldown screens.
 */

(function() {
  'use strict';

  let config = null;
  let overlayEl = null;
  let isInCooldown = false;
  let intentPopupCooldown = 0;
  let blockScrollHandler = null;

  // Receive friction config
  window.addEventListener('sf-friction-config', (e) => {
    config = e.detail;
    if (config.level >= 2) {
      applyScrollFriction(config.level);
    }
  });

  window.addEventListener('sf-friction-deactivate', () => {
    removeOverlay();
    removeScrollFriction();
    config = null;
  });

  // React to brainrot alerts
  window.addEventListener('sf-brainrot-alert', (e) => {
    if (isInCooldown || Date.now() < intentPopupCooldown) return;
    const { score } = e.detail;

    if (!config) return;

    if (config.level >= 4) {
      showCooldownOverlay(e.detail);
    } else if (config.level >= 3) {
      showWarningOverlay(e.detail);
    } else if (config.level >= 2) {
      showIntentPopup(e.detail);
    }
  });

  let fillBarEl = null;
  let isFillBarActive = false;

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
    const percentage = Math.min(100, Math.max(0, (progress / max) * 100));
    inner.style.width = `${percentage}%`;
  }

  function hideFillBar() {
    if (fillBarEl) {
      fillBarEl.classList.remove('sf-visible');
      const inner = fillBarEl.querySelector('.sf-scroll-fill-inner');
      if (inner) inner.style.width = '0%';
    }
  }

  /** Apply scroll friction by capturing wheel/touch events and requiring physical distance */
  function applyScrollFriction(level) {
    if (blockScrollHandler) return; // Already applied
    
    let currentScrollProgress = 0;
    // Base distance is 1500px, scaled by friction level
    const targetScrollDistance = level * 1500; 

    blockScrollHandler = (e) => {
      // Accumulate progress
      const delta = e.deltaY || (e.touches && e.touches[0].clientY) || 0;
      
      // If delta is 0 or it's not a wheel event with deltaY, we just block it and don't progress
      if (e.type === 'wheel') {
        currentScrollProgress += delta;
      }
      
      // Clamp progress
      currentScrollProgress = Math.max(0, Math.min(currentScrollProgress, targetScrollDistance));
      
      if (currentScrollProgress >= targetScrollDistance) {
        // Bar is full! Let this ONE scroll event pass through
        currentScrollProgress = 0; // Reset for next time
        hideFillBar();
        return true; // Browser handles it
      } else {
        // Block the scroll
        e.preventDefault();
        e.stopPropagation();
        updateFillBar(currentScrollProgress, targetScrollDistance);
        return false;
      }
    };

    document.addEventListener('wheel', blockScrollHandler, { passive: false, capture: true });
    // For touchmove, it's trickier to calculate delta, so we just block it to force swiping many times or not support touch swipe for now.
    document.addEventListener('touchmove', blockScrollHandler, { passive: false, capture: true });
    document.addEventListener('keydown', keydownHandler, { passive: false, capture: true });
  }

  function keydownHandler(e) {
    // Strictly block space, arrow keys, and page up/down on addictive platforms
    if (['ArrowUp', 'ArrowDown', 'Space', 'PageUp', 'PageDown'].includes(e.code)) {
      if (blockScrollHandler) {
        e.preventDefault();
        e.stopPropagation();
        // Give visual feedback that keyboard nav is blocked
        createFillBar();
        fillBarEl.classList.add('sf-visible');
        setTimeout(() => hideFillBar(), 1000);
      }
    }
  }

  function removeScrollFriction() {
    if (!blockScrollHandler) return;
    document.removeEventListener('wheel', blockScrollHandler, { capture: true });
    document.removeEventListener('touchmove', blockScrollHandler, { capture: true });
    document.removeEventListener('keydown', keydownHandler, { capture: true });
    blockScrollHandler = null;
    hideFillBar();
  }

  /** Show intent popup: "Why are you scrolling?" */
  function showIntentPopup(data) {
    if (document.getElementById('sf-overlay')) return;
    overlayEl = createOverlay(`
      <div class="sf-card">
        <div class="sf-icon">⚡</div>
        <h2>Why are you scrolling?</h2>
        <p class="sf-score">Brainrot Score: <strong>${data.score}</strong>/100</p>
        <div class="sf-buttons" style="display: flex; flex-direction: column; gap: 8px; margin-top: 15px;">
          <button class="sf-btn sf-btn-secondary" data-action="procrastinating">Procrastinating</button>
          <button class="sf-btn sf-btn-secondary" data-action="mood_off">Mood Off / Stressed</button>
          <button class="sf-btn sf-btn-secondary" data-action="boredom">Boredom</button>
          <button class="sf-btn sf-btn-primary" data-action="break">Planned Break</button>
        </div>
      </div>
    `, 0.6);

    overlayEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const reason = btn.dataset.action;
        chrome.runtime.sendMessage({
          type: 'LOG_SCROLL_REASON',
          payload: { reason, url: window.location.href },
        });
        
        // Cooldown based on response
        if (reason === 'break') {
          intentPopupCooldown = Date.now() + 300000; // 5 mins for break
        } else {
          intentPopupCooldown = Date.now() + 60000; // 1 min for bad reasons
        }
        removeOverlay();
      });
    });
  }

  /** Show warning overlay */
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
        chrome.runtime.sendMessage({
          type: 'FRICTION_RESPONSE',
          payload: { action, response: action === 'stop' ? 'obeyed' : 'ignored', url: window.location.href },
        });
        if (action === 'stop') {
          history.back();
        } else {
          // User chose 5 more minutes, set 5 min cooldown
          intentPopupCooldown = Date.now() + 300000;
        }
        removeOverlay();
      });
    });
  }

  /** Show cooldown screen */
  function showCooldownOverlay(data) {
    if (document.getElementById('sf-overlay')) return;
    isInCooldown = true;
    let countdown = config?.config?.cooldown || 60;

    overlayEl = createOverlay(`
      <div class="sf-card sf-card-cooldown">
        <div class="sf-icon">🧊</div>
        <h2>Cooldown Active</h2>
        <p class="sf-score">Score: <strong class="sf-danger">${data.score}</strong> — Take a breather.</p>
        <div class="sf-countdown" id="sf-countdown">${formatCountdown(countdown)}</div>
        <p class="sf-subtext sf-quote">"The ability to focus is the most important skill for the 21st century."</p>
      </div>
    `, 0.85);

    const countdownEl = overlayEl.querySelector('#sf-countdown');
    const timer = setInterval(() => {
      countdown--;
      if (countdownEl) countdownEl.textContent = formatCountdown(countdown);
      if (countdown <= 0) {
        clearInterval(timer);
        isInCooldown = false;
        removeOverlay();
      }
    }, 1000);
  }

  function formatCountdown(s) {
    return `${Math.floor(s / 60)}:${(s % 60).toString().padStart(2, '0')}`;
  }

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
})();

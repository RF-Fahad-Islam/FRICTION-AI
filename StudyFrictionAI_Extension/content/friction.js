/**
 * Content Script: Friction Engine (Module M2)
 * Applies scroll delays, warning overlays, and cooldown screens.
 */

(function() {
  'use strict';

  let config = null;
  let overlayEl = null;
  let isInCooldown = false;

  // Receive friction config
  window.addEventListener('sf-friction-config', (e) => {
    config = e.detail;
    if (config.level >= 2) {
      applyScrollDelay(config.config.scrollDelay);
    }
  });

  // React to brainrot alerts
  window.addEventListener('sf-brainrot-alert', (e) => {
    if (isInCooldown) return;
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

  /** Apply scroll delay by intercepting wheel events */
  function applyScrollDelay(delayMs) {
    let lastScroll = 0;
    document.addEventListener('wheel', (e) => {
      const now = Date.now();
      if (now - lastScroll < delayMs) {
        e.preventDefault();
        e.stopPropagation();
      } else {
        lastScroll = now;
      }
    }, { passive: false, capture: true });
  }

  /** Show intent popup: "What are you doing here?" */
  function showIntentPopup(data) {
    if (document.getElementById('sf-overlay')) return;
    overlayEl = createOverlay(`
      <div class="sf-card">
        <div class="sf-icon">⚡</div>
        <h2>What are you doing here?</h2>
        <p class="sf-score">Brainrot Score: <strong>${data.score}</strong>/100</p>
        <p class="sf-subtext">${data.scrollCount} scrolls in ${Math.round(data.timeSpent / 60)}min</p>
        <div class="sf-buttons">
          <button class="sf-btn sf-btn-primary" data-action="studying">I'm studying</button>
          <button class="sf-btn sf-btn-secondary" data-action="browsing">Just browsing</button>
          <button class="sf-btn sf-btn-danger" data-action="break">Taking a break</button>
        </div>
      </div>
    `, 0.3);

    overlayEl.querySelectorAll('[data-action]').forEach(btn => {
      btn.addEventListener('click', () => {
        const action = btn.dataset.action;
        chrome.runtime.sendMessage({
          type: 'FRICTION_RESPONSE',
          payload: { action, response: action === 'studying' ? 'obeyed' : 'ignored', url: window.location.href },
        });
        if (action === 'studying') {
          window.close();
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

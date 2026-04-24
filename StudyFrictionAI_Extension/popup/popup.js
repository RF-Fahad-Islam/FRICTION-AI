/**
 * Popup Script (Extension UI)
 */

document.addEventListener('DOMContentLoaded', async () => {
  // 1. Get current tab
  chrome.tabs.query({ active: true, currentWindow: true }, async (tabs) => {
    const tab = tabs[0];
    if (tab && tab.url) {
      try {
        const urlObj = new URL(tab.url);
        document.getElementById('siteName').textContent = urlObj.hostname;

        // Get friction config for this URL
        chrome.runtime.sendMessage({ type: 'GET_FRICTION_CONFIG', payload: { url: tab.url } }, (response) => {
          if (response && response.level) {
            document.getElementById('frictionLevel').textContent = `${response.level}/5`;
          }
        });
      } catch (e) {
        document.getElementById('siteName').textContent = 'Invalid URL';
      }
    } else {
      document.getElementById('siteName').textContent = 'No active tab';
    }
  });

  // 2. Fetch stats from storage
  chrome.storage.local.get(['sf_profile', 'sf_sessions'], (data) => {
    const profile = data.sf_profile;
    const sessions = data.sf_sessions || [];

    // Calculate today's sessions
    const today = new Date().toDateString();
    const todaySessions = sessions.filter(s => new Date(s.startedAt).toDateString() === today);
    
    document.getElementById('sessionCount').textContent = todaySessions.length;

    if (profile) {
      document.getElementById('focusScore').textContent = Math.max(0, 100 - (profile.behavior?.brainrotRate || 0)) + '%';
      
      // Calculate average brainrot score for today
      const scores = todaySessions.map(s => s.totalBrainrotScore).filter(s => s > 0);
      const avgBrainrot = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : 0;
      document.getElementById('brainrotScore').textContent = avgBrainrot + '%';
    }
  });
});

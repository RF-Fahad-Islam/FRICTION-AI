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

        // The friction level display was removed from the popup, but we keep the logic here if needed.
      } catch (e) {
        document.getElementById('siteName').textContent = 'Invalid URL';
      }
    } else {
      document.getElementById('siteName').textContent = 'No active tab';
    }
  });

  // 2. Fetch stats from storage periodically
  function updateStats() {
    chrome.storage.local.get(['sf_daily_activity', 'sf_reel_time', 'sf_reels_watched'], (data) => {
      const activity = data.sf_daily_activity || {};
      const reelTime = data.sf_reel_time || 0;
      const reelsWatched = data.sf_reels_watched || 0;
      
      const mins = Math.floor(reelTime / 60).toString().padStart(2, '0');
      const secs = (reelTime % 60).toString().padStart(2, '0');
      document.getElementById('reelTime').textContent = `${mins}:${secs}`;
      
      document.getElementById('reelsWatched').textContent = reelsWatched;
      
      let brainrotTime = 0;
      let totalTime = 0;
      Object.values(activity).forEach(a => {
        totalTime += a.timeSpent || 0;
        if (a.isBrainrot) {
          brainrotTime += a.timeSpent || 0;
        }
      });
      
      let brainrotScore = 0;
      if (totalTime > 0) {
        brainrotScore = Math.round((brainrotTime / totalTime) * 100);
      }
      
      document.getElementById('brainrotScore').textContent = `${brainrotScore}%`;
      document.getElementById('focusScore').textContent = `${Math.max(0, 100 - brainrotScore)}%`;
    });
  }
  
  updateStats();
  setInterval(updateStats, 1000);
});

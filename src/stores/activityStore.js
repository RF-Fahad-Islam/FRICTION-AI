import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'
import { get, KEYS } from '../../storage/storageAdapter.js'

export const useActivityStore = defineStore('activity', () => {
  const reelTime = ref(0)
  const dailyActivity = ref({})
  const todayBrainrotScore = ref(0)
  const reelCount = ref(0)
  const hourlyReels = ref({})
  const hourlyMetrics = ref({})
  const sessions = ref([])
  
  function fetchStats() {
    // Prefer storageAdapter to handle both localStorage and chrome.storage
    reelTime.value = get(KEYS.REEL_TIME, 0)
    reelCount.value = get(KEYS.REEL_COUNT, 0)
    dailyActivity.value = get(KEYS.VISITS, {}) // Note: visits used for daily_activity in adapter mapping
    
    // Check if we need to use direct keys if mapping is different
    // In activityStore original, it used: sf_reel_time, sf_daily_activity, sf_reel_count, sf_hourly_reels, sf_history_scores, sf_sessions, sf_hourly_metrics
    // Let's use the explicit KEYS we just added
    reelTime.value = get(KEYS.REEL_TIME, 0)
    reelCount.value = get(KEYS.REEL_COUNT, 0)
    dailyActivity.value = get('sf_daily_activity', {}) 
    hourlyReels.value = get(KEYS.HOURLY_REELS, {})
    hourlyMetrics.value = get(KEYS.HOURLY_METRICS, {})
    sessions.value = get(KEYS.SESSIONS, [])
    
    let brainrotTime = 0
    let totalTime = 0
    
    Object.keys(dailyActivity.value).forEach(domain => {
       const time = dailyActivity.value[domain].timeSpent || 0
       totalTime += time
       if (dailyActivity.value[domain].isBrainrot) {
         brainrotTime += time
       }
    })
    
    if (totalTime > 0) {
      todayBrainrotScore.value = Math.round((brainrotTime / totalTime) * 100)
    } else {
      todayBrainrotScore.value = 0
    }

    updateHistoryScores(todayBrainrotScore.value)
  }

  function updateHistoryScores(currentScore) {
    let scores = get(KEYS.HISTORY_SCORES, [40, 45, 42, 38, 41, 39, 0])
    scores[scores.length - 1] = currentScore
    // We don't necessarily want to save back every 2 seconds if it's the same
    // but the original code did it.
  }

  // Reactive storage listener
  if (typeof window !== 'undefined') {
    window.addEventListener('sf_storage_updated', () => {
      fetchStats()
    })
  }

  onMounted(() => {
    fetchStats()
    // We can keep the polling as a fallback, but the event listener is better
    setInterval(fetchStats, 5000) 
  })

  return {
    reelTime, reelCount, dailyActivity, todayBrainrotScore, hourlyReels, hourlyMetrics, sessions, fetchStats
  }
})

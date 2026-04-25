import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'

export const useActivityStore = defineStore('activity', () => {
  const reelTime = ref(0)
  const dailyActivity = ref({})
  const todayBrainrotScore = ref(0)
  const reelCount = ref(0)
  const hourlyReels = ref({})
  
  function fetchStats() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['sf_reel_time', 'sf_daily_activity', 'sf_reel_count', 'sf_hourly_reels', 'sf_history_scores'], (data) => {
        reelTime.value = data.sf_reel_time || 0
        reelCount.value = data.sf_reel_count || 0
        dailyActivity.value = data.sf_daily_activity || {}
        hourlyReels.value = data.sf_hourly_reels || {}
        
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

        // Update history in profile/local storage for the chart
        updateHistoryScores(todayBrainrotScore.value)
      })
    }
  }

  function updateHistoryScores(currentScore) {
    chrome.storage.local.get('sf_history_scores', (data) => {
      let scores = data.sf_history_scores || [40, 45, 42, 38, 41, 39, 0] // Default with some variation
      
      // Update today's score (last element)
      scores[scores.length - 1] = currentScore
      
      // Save back
      chrome.storage.local.set({ sf_history_scores: scores })
    })
  }

  onMounted(() => {
    fetchStats()
    setInterval(fetchStats, 2000) // Poll for updates every 2s
  })

  return {
    reelTime, reelCount, dailyActivity, todayBrainrotScore, hourlyReels, fetchStats
  }
})

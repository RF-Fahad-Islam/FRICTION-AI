import { defineStore } from 'pinia'
import { ref, onMounted } from 'vue'

export const useActivityStore = defineStore('activity', () => {
  const reelTime = ref(0)
  const dailyActivity = ref({})
  const todayBrainrotScore = ref(0)
  
  function fetchStats() {
    if (typeof chrome !== 'undefined' && chrome.storage) {
      chrome.storage.local.get(['sf_reel_time', 'sf_daily_activity'], (data) => {
        reelTime.value = data.sf_reel_time || 0
        dailyActivity.value = data.sf_daily_activity || {}
        
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
      })
    }
  }

  onMounted(() => {
    fetchStats()
    setInterval(fetchStats, 2000) // Poll for updates every 2s
  })

  return {
    reelTime, dailyActivity, todayBrainrotScore, fetchStats
  }
})

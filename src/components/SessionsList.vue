<script setup>
import { ref, onMounted } from 'vue'

const sessions = ref([])

function fetchSessions() {
  if (typeof chrome !== 'undefined' && chrome.storage) {
    chrome.storage.local.get('sf_sessions', (data) => {
      sessions.value = (data.sf_sessions || []).reverse() // Show newest first
    })
  } else {
    // Mock data for dev
    sessions.value = [
      {
        startTime: new Date().toISOString(),
        endTime: new Date().toISOString(),
        domain: 'youtube.com',
        duration: 125,
        reelCount: 12,
        reasons: ['boredom']
      },
      {
        startTime: new Date(Date.now() - 3600000).toISOString(),
        endTime: new Date(Date.now() - 3500000).toISOString(),
        domain: 'instagram.com',
        duration: 450,
        reelCount: 25,
        reasons: ['procrastinating']
      }
    ]
  }
}

function formatDuration(seconds) {
  if (seconds < 60) return `${seconds}s`
  const mins = Math.floor(seconds / 60)
  const secs = seconds % 60
  return `${mins}m ${secs}s`
}

function formatDate(isoString) {
  const d = new Date(isoString)
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

const REASON_LABELS = {
  procrastinating: 'Procrastinating',
  mood_off: 'Mood is Off',
  boredom: 'Just Boredom',
  break: 'Planned Break',
  learning: 'Actually Learning'
}

onMounted(() => {
  fetchHistory()
  setInterval(fetchSessions, 5000)
})

function fetchHistory() {
  fetchSessions()
}
</script>

<template>
  <div class="space-y-4">
    <div v-if="sessions.length === 0" class="glass-card p-12 text-center">
      <p class="text-text-muted">No brainrot sessions recorded yet.</p>
    </div>
    
    <div 
      v-for="(session, idx) in sessions" 
      :key="idx"
      class="glass-card p-5 flex flex-col md:flex-row md:items-center justify-between gap-4 border-l-4 border-danger/50"
    >
      <div class="flex items-center gap-4">
        <div class="w-12 h-12 rounded-xl bg-danger/10 flex items-center justify-center text-danger shrink-0">
          <svg class="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <h3 class="font-bold text-text-primary capitalize">{{ session.domain }}</h3>
          <p class="text-xs text-text-muted">{{ formatDate(session.startTime) }} • {{ session.reelCount }} reels watched</p>
        </div>
      </div>

      <div class="flex flex-wrap items-center gap-3">
        <div v-if="session.reasons && session.reasons.length > 0" class="flex gap-2">
          <span 
            v-for="reason in session.reasons" 
            :key="reason"
            class="px-2 py-1 bg-primary/20 text-primary-light text-[10px] font-bold uppercase rounded border border-primary/30"
          >
            {{ REASON_LABELS[reason] || reason }}
          </span>
        </div>
        <div class="text-right">
          <p class="text-lg font-mono font-bold text-danger">{{ formatDuration(session.duration) }}</p>
          <p class="text-[10px] text-text-muted uppercase tracking-tighter">In the void</p>
        </div>
      </div>
    </div>
  </div>
</template>

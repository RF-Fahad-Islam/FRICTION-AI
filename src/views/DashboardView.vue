<script setup>
import { ref, computed, onMounted } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { useProfileStore } from '../stores/profileStore.js'
import * as storage from '../../storage/storageAdapter.js'
import { KEYS } from '../../storage/storageAdapter.js'
import { CATEGORIES, getCategoryLabel, getCategoryColor } from '../../logic/categorizer.js'
import { summarizeLinks, batchClassifyLinks } from '../../services/aiClassifier.js'

// Components
import BrainrotChart from '../components/BrainrotChart.vue'
import ReasonsChart from '../components/ReasonsChart.vue'
import AnalyticsMindMap from '../components/AnalyticsMindMap.vue'
import SessionsList from '../components/SessionsList.vue'

const activityStore = useActivityStore()
const profileStore = useProfileStore()

const activeTab = ref('overview') // 'overview' | 'sessions' | 'insights' | 'history'

// Analytics Data
const visits = ref([])
const summaries = ref({})
const isSummarizing = ref({})
const isSyncing = ref(false)

onMounted(() => {
  visits.value = storage.get(KEYS.VISITS, [])
})

async function syncHistory() {
  if (typeof chrome === 'undefined' || !chrome.history) {
    alert('Browser history API not available (are you running as an extension?).')
    return
  }

  isSyncing.value = true
  try {
    const results = await chrome.history.search({ 
      text: '', 
      maxResults: 150, 
      startTime: Date.now() - 7 * 24 * 3600 * 1000 
    })
    
    let aiClassifications = {}
    const apiKey = profileStore.profile?.preferences?.apiKey
    if (apiKey) {
       aiClassifications = await batchClassifyLinks(results, apiKey)
    }
    
    const newVisits = results.map(item => {
      let cat = aiClassifications[item.url]
      let confidence = 0.9
      if (!cat) {
        cat = CATEGORIES.UNKNOWN
      }
      return {
        url: item.url,
        title: item.title,
        timestamp: new Date(item.lastVisitTime || Date.now()).toISOString(),
        timeSpent: 0,
        category: cat,
        confidence: confidence
      }
    })

    storage.set(KEYS.VISITS, newVisits)
    visits.value = newVisits
  } catch (err) {
    console.error('Failed to sync history:', err)
  } finally {
    isSyncing.value = false
  }
}

// Group visits by category
const groupedVisits = computed(() => {
  const groups = {}
  visits.value.forEach(visit => {
    const cat = visit.category || CATEGORIES.UNKNOWN
    if (!groups[cat]) groups[cat] = []
    groups[cat].push(visit)
  })
  return groups
})

const activeCategories = computed(() => {
  return Object.keys(groupedVisits.value).filter(k => groupedVisits.value[k].length > 0)
})

const expandedCategory = ref(null)

const focusScore = computed(() => Math.max(0, 100 - (activityStore.todayBrainrotScore || 0)))

const stats = computed(() => [
  {
    label: 'Focus Score',
    value: focusScore.value,
    suffix: '%',
    color: focusScore.value >= 70 ? 'text-success' : focusScore.value >= 40 ? 'text-warning' : 'text-danger',
    bg: 'from-primary/20 to-accent/10',
  },
  {
    label: 'Brainrot Score',
    value: activityStore.todayBrainrotScore,
    suffix: '%',
    color: activityStore.todayBrainrotScore <= 30 ? 'text-success' : activityStore.todayBrainrotScore <= 60 ? 'text-warning' : 'text-danger',
    bg: 'from-danger/20 to-warning/10',
  },
  {
    label: 'Reel Time',
    value: Math.floor((activityStore.reelTime || 0) / 60),
    suffix: 'min',
    color: 'text-accent',
    bg: 'from-accent/20 to-primary/10',
  },
  {
    label: 'Reel Count',
    value: activityStore.reelCount || 0,
    suffix: '',
    color: 'text-primary-light',
    bg: 'from-primary-light/20 to-primary/10',
  },
])

async function generateSummary(category) {
  if (isSummarizing.value[category]) return
  const categoryVisits = groupedVisits.value[category]
  if (categoryVisits.length === 0) return
  isSummarizing.value[category] = true
  try {
    const apiKey = profileStore.profile?.preferences?.apiKey
    const res = await summarizeLinks(categoryVisits.slice(0, 50), category, apiKey)
    summaries.value[category] = res.summary
  } catch (error) {
    summaries.value[category] = 'Failed to generate summary.'
  } finally {
    isSummarizing.value[category] = false
  }
}
</script>

<template>
  <div class="p-6 lg:p-8 space-y-6 animate-fade-in">
    <!-- Header with Tabs -->
    <div class="flex flex-col md:flex-row md:items-end justify-between gap-4">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Dashboard</h1>
        <p class="text-text-muted mt-1">Unified attention & behavior insights</p>
      </div>
      
      <div class="flex bg-surface-800 p-1 rounded-xl border border-white/5">
        <button 
          v-for="tab in ['overview', 'sessions', 'insights', 'history']" 
          :key="tab"
          @click="activeTab = tab"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
          :class="activeTab === tab ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-primary'"
        >
          {{ tab }}
        </button>
      </div>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in">
      <!-- Stats Grid -->
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div
          v-for="stat in stats"
          :key="stat.label"
          class="glass-card p-5 relative overflow-hidden"
        >
          <div class="absolute inset-0 bg-gradient-to-br opacity-50" :class="stat.bg"></div>
          <div class="relative">
            <p class="text-xs text-text-muted uppercase tracking-wider mb-2">{{ stat.label }}</p>
            <div class="flex items-baseline gap-1">
              <span class="text-3xl font-bold" :class="stat.color">{{ stat.value }}</span>
              <span class="text-sm text-text-muted">{{ stat.suffix }}</span>
            </div>
          </div>
        </div>
      </div>

      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-2">
          <BrainrotChart />
        </div>
        <div class="lg:col-span-1">
          <ReasonsChart />
        </div>
      </div>
    </div>
    <!-- Sessions Tab -->
    <div v-if="activeTab === 'sessions'" class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text-primary">Recent Brainrot Sessions</h2>
        <p class="text-sm text-text-muted italic">Every entry is a moment captured in the void.</p>
      </div>
      <SessionsList />
    </div>
    <!-- Insights Tab -->
    <div v-if="activeTab === 'insights'" class="space-y-6 animate-fade-in">
      <div class="glass-card p-6">
        <div class="flex items-center justify-between mb-6">
          <h2 class="text-lg font-semibold text-text-primary">Interest Mind Map</h2>
          <button 
            @click="syncHistory" 
            :disabled="isSyncing"
            class="text-xs px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-text-secondary transition-all"
          >
            {{ isSyncing ? 'Processing...' : 'Refresh Insights' }}
          </button>
        </div>
        <div class="h-[500px]">
          <AnalyticsMindMap :visits="visits" />
        </div>
      </div>
    </div>

    <!-- History Tab -->
    <div v-if="activeTab === 'history'" class="space-y-6 animate-fade-in">
      <div class="flex items-center justify-between">
        <h2 class="text-lg font-semibold text-text-primary">Categorized History</h2>
        <button 
          @click="syncHistory"
          :disabled="isSyncing"
          class="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary-light text-sm font-medium rounded-lg transition-colors flex items-center gap-2"
        >
          <svg v-if="isSyncing" class="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <svg v-else class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          {{ isSyncing ? 'Syncing...' : 'Sync History' }}
        </button>
      </div>

      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div 
          v-for="category in activeCategories" 
          :key="category"
          class="glass-card transition-all duration-300 overflow-hidden"
          :class="{ 'ring-1 ring-primary/50 shadow-lg': expandedCategory === category }"
        >
          <div 
            class="p-5 cursor-pointer flex items-start gap-4"
            @click="expandedCategory = expandedCategory === category ? null : category"
          >
            <div 
              class="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
              :style="{ backgroundColor: getCategoryColor(category) + '20', color: getCategoryColor(category) }"
            >
              <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 2H4v7h12V8z" clip-rule="evenodd" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="font-semibold text-text-primary capitalize text-sm">{{ getCategoryLabel(category) }}</h3>
              <p class="text-xs text-text-muted mt-0.5">{{ groupedVisits[category].length }} visits</p>
            </div>
          </div>

          <div v-show="expandedCategory === category" class="border-t border-white/5 bg-black/20">
            <div class="p-3 bg-primary/5">
              <div class="flex items-center justify-between mb-2">
                <span class="text-[10px] uppercase tracking-wider text-primary-light font-bold">AI Analysis</span>
                <button 
                  @click.stop="generateSummary(category)"
                  class="text-[10px] px-2 py-0.5 rounded bg-primary/20 text-primary-light"
                  :disabled="isSummarizing[category]"
                >
                  {{ isSummarizing[category] ? 'Wait...' : 'Generate' }}
                </button>
              </div>
              <p class="text-xs text-text-secondary leading-relaxed">
                {{ summaries[category] || 'No summary yet.' }}
              </p>
            </div>
            <div class="p-2 max-h-48 overflow-y-auto custom-scrollbar">
              <a 
                v-for="(visit, idx) in groupedVisits[category].slice(0, 20)" 
                :key="idx"
                :href="visit.url"
                target="_blank"
                class="block p-1.5 rounded hover:bg-white/5 text-[11px] text-text-muted truncate transition-colors"
              >
                {{ visit.title || visit.url }}
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

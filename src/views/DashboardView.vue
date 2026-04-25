<script setup>
import { ref, computed, onMounted } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { useProfileStore } from '../stores/profileStore.js'
import * as storage from '../../storage/storageAdapter.js'
import { KEYS } from '../../storage/storageAdapter.js'
import { CATEGORIES, getCategoryLabel, getCategoryColor, categorize, needsAiFallback } from '../../logic/categorizer.js'
import { summarizeLinks, batchClassifyLinks } from '../../services/aiClassifier.js'

// Components
import BrainrotChart from '../components/BrainrotChart.vue'
import ReasonsChart from '../components/ReasonsChart.vue'
import AnalyticsMindMap from '../components/AnalyticsMindMap.vue'
import SessionsList from '../components/SessionsList.vue'
import HourlyReelsChart from '../components/HourlyReelsChart.vue'
import FrictionProfile from '../components/FrictionProfile.vue'

const showApiKeyModal = ref(false)
const tempApiKey = ref('')

const activityStore = useActivityStore()
const profileStore = useProfileStore()

const tabs = [
  { id: 'overview', name: 'Intelligence', icon: '📊' },
  { id: 'history', name: 'History', icon: '🕒' },
  { id: 'sessions', name: 'Sessions', icon: '💻' },
  { id: 'settings', name: 'Settings', icon: '⚙️' }
]
const activeTab = ref('overview') // 'overview' | 'sessions' | 'insights' | 'history' | 'settings'

// Analytics Data
const visits = ref([])
const summaries = ref({})
const isSummarizing = ref({})
const isSyncing = ref(false)

// Settings tab state
const tempGoal = ref(profileStore.profile?.behavior?.dailyBrainrotGoal || 30)
const newBlockedDomain = ref('')
const blockedDomains = ref(profileStore.profile?.preferences?.blockedDomains || [])

onMounted(() => {
  visits.value = storage.get(KEYS.VISITS, [])
  tempApiKey.value = profileStore.profile?.preferences?.apiKey || ''
})

function saveApiKey() {
  if (!tempApiKey.value) return
  profileStore.setPreference('apiKey', tempApiKey.value)
  showApiKeyModal.value = false
  alert('API Key saved successfully! AI Friction is now active.')
}

function saveGoal() {
  profileStore.update({ behavior: { dailyBrainrotGoal: tempGoal.value } })
  profileStore.refresh()
  alert('Goal saved!')
}

function addBlockedDomain() {
  if (!newBlockedDomain.value) return
  const domain = newBlockedDomain.value.trim().toLowerCase()
  if (!blockedDomains.value.includes(domain)) {
    blockedDomains.value.push(domain)
    profileStore.update({ preferences: { blockedDomains: blockedDomains.value } })
  }
  newBlockedDomain.value = ''
}

function removeBlockedDomain(idx) {
  blockedDomains.value.splice(idx, 1)
  profileStore.update({ preferences: { blockedDomains: blockedDomains.value } })
}

function confirmReset() {
  if (confirm('Are you sure you want to reset all settings?')) {
    profileStore.reset()
    profileStore.refresh()
    blockedDomains.value = []
    tempGoal.value = 30
    alert('Settings reset to defaults.')
  }
}

async function syncHistory() {
  if (typeof chrome === 'undefined' || !chrome.history) {
    alert('Browser history API not available (are you running as an extension?).');
    return;
  }

  isSyncing.value = true;
  try {
    const results = await chrome.history.search({ 
      text: '', 
      maxResults: 150, 
      startTime: Date.now() - 7 * 24 * 3600 * 1000 
    });

    // 1. Initial Rule-Based Categorization
    const initialVisits = results.map(item => {
      const ruleResult = categorize(item.url, item.title);
      return {
        url: item.url,
        title: item.title,
        timestamp: new Date(item.lastVisitTime || Date.now()).toISOString(),
        timeSpent: 0,
        category: ruleResult.category,
        confidence: ruleResult.confidence,
        needsAi: needsAiFallback(ruleResult)
      };
    });

    // 2. Identify links that need AI classification
    const linksToClassify = initialVisits.filter(v => v.needsAi).map(v => ({ url: v.url, title: v.title }));
    
    let aiResults = {};
    const apiKey = profileStore.profile?.preferences?.apiKey;
    
    if (apiKey && linksToClassify.length > 0) {
      aiResults = await batchClassifyLinks(linksToClassify, apiKey);
    }

    // 3. Final Merge
    const finalVisits = initialVisits.map(v => {
      if (v.needsAi && aiResults[v.url]) {
        return { ...v, category: aiResults[v.url], confidence: 0.9, source: 'ai' };
      }
      return v;
    });

    storage.set(KEYS.VISITS, finalVisits);
    visits.value = finalVisits;
  } catch (err) {
    console.error('Failed to sync history:', err);
  } finally {
    isSyncing.value = false;
  }
}

// Group visits by category and aggregate identical ones
const groupedVisits = computed(() => {
  const groups = {}
  if (!visits.value || !Array.isArray(visits.value)) return groups;

  visits.value.forEach(visit => {
    if (!visit) return
    const cat = visit.category || CATEGORIES.UNKNOWN
    if (!groups[cat]) groups[cat] = []
    
    // Aggregate by domain and title to avoid repetition
    const existing = groups[cat].find(v => v.url === visit.url || (v.title === visit.title && v.title))
    if (existing) {
      existing.count = (existing.count || 1) + 1
    } else {
      groups[cat].push({ ...visit, count: 1 })
    }
  })
  
  // Sort groups by count descending
  Object.keys(groups).forEach(cat => {
    groups[cat].sort((a, b) => (b.count || 0) - (a.count || 0))
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
    if (!apiKey) {
      showApiKeyModal.value = true
      return
    }
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
          v-for="tab in tabs" 
          :key="tab.id"
          @click="activeTab = tab.id"
          class="px-4 py-1.5 rounded-lg text-sm font-medium transition-all capitalize"
          :class="activeTab === tab.id ? 'bg-primary text-white shadow-lg' : 'text-text-muted hover:text-text-primary'"
        >
          {{ tab.name }}
        </button>
      </div>
    </div>

    <!-- Overview Tab -->
    <div v-if="activeTab === 'overview'" class="space-y-6 animate-fade-in">
      <!-- Stats Grid -->
      <div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="glass-card p-5 group hover:border-primary/30 transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Focus Score</span>
            <span class="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09z"/>
              </svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-text-primary">{{ 100 - activityStore.todayBrainrotScore }}%</div>
          <div class="text-xs text-text-muted mt-1 group-hover:text-primary-light transition-colors">
            {{ activityStore.todayBrainrotScore > 50 ? 'Needs improvement' : 'Great focus!' }}
          </div>
        </div>
        
        <div class="glass-card p-5 group hover:border-danger/30 transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Brainrot</span>
            <span class="w-8 h-8 rounded-lg bg-danger/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-danger" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 14l2 4 2-4H8zm8 2a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-danger">{{ activityStore.todayBrainrotScore }}%</div>
          <div class="text-xs text-text-muted mt-1">Time in void</div>
        </div>
        
        <div class="glass-card p-5 group hover:border-accent/30 transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Reels</span>
            <span class="w-8 h-8 rounded-lg bg-accent/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-accent" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"/>
              </svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-accent">{{ activityStore.reelCount }}</div>
          <div class="text-xs text-text-muted mt-1">Watched today</div>
        </div>
        
        <div class="glass-card p-5 group hover:border-warning/30 transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-xs font-medium text-text-muted uppercase tracking-wider">Time</span>
            <span class="w-8 h-8 rounded-lg bg-warning/20 flex items-center justify-center">
              <svg class="w-4 h-4 text-warning" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </span>
          </div>
          <div class="text-3xl font-bold text-warning">{{ Math.floor(activityStore.reelTime / 60) }}m</div>
          <div class="text-xs text-text-muted mt-1">In the void</div>
        </div>
      </div>

      <!-- Charts Grid -->
      <div class="grid lg:grid-cols-2 gap-6">
        <div class="lg:col-span-1">
          <BrainrotChart />
        </div>
        <div class="lg:col-span-1">
          <HourlyReelsChart />
        </div>
      </div>
      
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <ReasonsChart />
        </div>
        <div class="lg:col-span-2">
          <FrictionProfile />
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

    <!-- Settings Tab -->
    <div v-if="activeTab === 'settings'" class="space-y-6 animate-fade-in">
      <h2 class="text-lg font-semibold text-text-primary">Settings</h2>
      
      <!-- Friction Level -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-semibold text-text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
          Friction Level
        </h3>
        <p class="text-sm text-text-muted">Higher friction makes brainrot sites harder to consume.</p>
        
        <div class="space-y-3">
          <div class="flex items-center justify-between">
            <span class="text-sm text-text-secondary">Tolerance Level</span>
            <span class="text-lg font-bold text-primary-light">{{ profileStore.frictionTolerance }}</span>
          </div>
          <input 
            type="range" 
            min="1" 
            max="5" 
            :value="profileStore.frictionTolerance"
            @input="(e) => { profileStore.update({ behavior: { frictionTolerance: parseInt(e.target.value) } }); profileStore.refresh(); }"
            class="w-full h-2 bg-surface-700 rounded-lg appearance-none cursor-pointer accent-primary"
          />
          <div class="flex justify-between text-[10px] text-text-muted">
            <span>1 - Gentle</span>
            <span>3 - Moderate</span>
            <span>5 - Heavy</span>
          </div>
        </div>
      </div>

      <!-- AI Personality -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-semibold text-text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.625 12a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H8.25m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0H12m4.125 0a.375.375 0 11-.75 0 .375.375 0 01.75 0zm0 0h-.375M21 12c0 4.556-4.03 8.25-9 8.25a9.764 9.764 0 01-2.555-.337A5.972 5.972 0 015.41 20.97a5.969 5.969 0 01-.474-.065 4.48 4.48 0 00.978-2.025c.09-.457-.133-.901-.467-1.226C3.93 16.178 3 14.189 3 12c0-4.556 4.03-8.25 9-8.25s9 3.694 9 8.25z"/>
          </svg>
          AI Coach Personality
        </h3>
        
        <div class="grid grid-cols-3 gap-3">
          <button 
            v-for="toneOption in ['empathetic', 'firm', 'direct']"
            :key="toneOption"
            @click="profileStore.updateTone(toneOption)"
            class="p-3 rounded-lg border transition-all text-center"
            :class="profileStore.tone === toneOption 
              ? 'bg-primary/20 border-primary text-primary-light' 
              : 'bg-white/5 border-white/10 text-text-secondary hover:bg-white/10'"
          >
            <span class="capitalize text-sm font-medium">{{ toneOption }}</span>
          </button>
        </div>
      </div>

      <!-- Goals -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-semibold text-text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          Daily Goal
        </h3>
        
        <div class="space-y-3">
          <div class="flex items-center gap-4">
            <input 
              type="number" 
              v-model.number="tempGoal"
              class="w-20 bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-center text-lg font-bold focus:outline-none focus:ring-2 focus:ring-primary/50"
              min="0" 
              max="100"
            />
            <span class="text-text-secondary">% brainrot target</span>
          </div>
          <button 
            @click="saveGoal"
            class="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary-light text-sm font-medium rounded-lg transition-colors"
          >
            Save Goal
          </button>
        </div>
      </div>

      <!-- Blocklist -->
      <div class="glass-card p-6 space-y-4">
        <h3 class="font-semibold text-text-primary flex items-center gap-2">
          <svg class="w-5 h-5 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
          </svg>
          Blocked Domains
        </h3>
        
        <div class="flex gap-2">
          <input 
            v-model="newBlockedDomain"
            type="text" 
            placeholder="add domain..."
            class="flex-1 bg-surface-900 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
            @keyup.enter="addBlockedDomain"
          />
          <button 
            @click="addBlockedDomain"
            class="px-4 py-2 bg-primary/20 hover:bg-primary/30 text-primary-light text-sm font-medium rounded-lg transition-colors"
          >
            Add
          </button>
        </div>
        
        <div class="flex flex-wrap gap-2">
          <span 
            v-for="(domain, idx) in blockedDomains" 
            :key="idx"
            class="inline-flex items-center gap-1 px-2 py-1 bg-red-500/20 text-red-300 rounded-full text-xs"
          >
            {{ domain }}
            <button @click="removeBlockedDomain(idx)" class="hover:text-red-100">&times;</button>
          </span>
          <span v-if="blockedDomains.length === 0" class="text-text-muted text-sm">No blocked domains</span>
        </div>
      </div>

      <!-- Reset -->
      <div class="glass-card p-6">
        <button 
          @click="confirmReset"
          class="w-full px-4 py-3 bg-red-500/20 hover:bg-red-500/30 text-red-300 text-sm font-medium rounded-lg transition-colors"
        >
          Reset All Settings
        </button>
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
                class="group flex items-center justify-between p-1.5 rounded hover:bg-white/5 text-[11px] text-text-muted transition-colors"
              >
                <span class="truncate pr-2">{{ visit.title || visit.url }}</span>
                <span v-if="visit.count > 1" class="shrink-0 px-1.5 py-0.5 rounded-full bg-white/5 text-[9px] group-hover:bg-primary/20 group-hover:text-primary-light transition-colors">
                  {{ visit.count }}
                </span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- API Key Modal -->
    <div v-if="showApiKeyModal" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
      <div class="glass-card max-w-md w-full p-8 space-y-6 shadow-2xl border-primary/20">
        <div class="text-center">
          <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-text-primary">Gemini API Key Required</h2>
          <p class="text-sm text-text-muted mt-2">
            To use AI classification and summaries, please provide your Gemini API key.
            It is stored locally on your device.
          </p>
        </div>

        <div class="space-y-4">
          <input 
            v-model="tempApiKey"
            type="password" 
            placeholder="Paste your API key here..."
            class="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
          />
          <div class="flex gap-3">
            <button 
              @click="showApiKeyModal = false"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-text-secondary transition-all"
            >
              Cancel
            </button>
            <button 
              @click="saveApiKey"
              class="flex-1 px-4 py-2.5 rounded-xl text-sm font-medium bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all"
            >
              Save Key
            </button>
          </div>
        </div>

        <p class="text-[10px] text-center text-text-muted">
          Don't have a key? Get one for free at <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary-light hover:underline">Google AI Studio</a>.
        </p>
      </div>
    </div>
  </div>
</template>

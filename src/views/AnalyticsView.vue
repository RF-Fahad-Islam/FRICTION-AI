<script setup>
import { ref, computed, onMounted } from 'vue'
import * as storage from '../../storage/storageAdapter.js'
import { KEYS } from '../../storage/storageAdapter.js'
import { categorize, getCategoryLabel, getCategoryColor, CATEGORIES } from '../../logic/categorizer.js'
import { summarizeLinks, batchClassifyLinks } from '../../services/aiClassifier.js'
import { useProfileStore } from '../stores/profileStore.js'
import ReasonsChart from '../components/ReasonsChart.vue'
import AnalyticsMindMap from '../components/AnalyticsMindMap.vue'

const profileStore = useProfileStore()
const visits = ref([])
const summaries = ref({})
const isSummarizing = ref({})
const isSyncing = ref(false)
const apiKeyInput = ref(profileStore.profile?.preferences?.apiKey || '')
const showApiSettings = ref(!profileStore.profile?.preferences?.apiKey)

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
    
    // Categorize and map visits
    const newVisits = results.map(item => {
      let cat = aiClassifications[item.url]
      let confidence = 0.9 // High confidence for AI
      if (!cat) {
        const localCat = categorize(item.url, item.title)
        cat = localCat.category
        confidence = localCat.confidence
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

    // Store the updated visits
    storage.set(KEYS.VISITS, newVisits)
    visits.value = newVisits
  } catch (err) {
    console.error('Failed to sync history:', err)
  } finally {
    isSyncing.value = false
  }
}

function saveApiKey() {
  profileStore.setPreference('apiKey', apiKeyInput.value)
  showApiSettings.value = false
}

// Group visits by category
const groupedVisits = computed(() => {
  const groups = {}
  if (!visits.value || !Array.isArray(visits.value)) return groups;
  
  visits.value.forEach(visit => {
    if (!visit) return
    const cat = visit.category || CATEGORIES.UNKNOWN
    if (!groups[cat]) {
      groups[cat] = []
    }
    groups[cat].push(visit)
  })
  
  // Sort by recent first in each category
  Object.keys(groups).forEach(key => {
    groups[key].sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
  })
  
  return groups
})

// Categories that actually have visits
const activeCategories = computed(() => {
  return Object.keys(groupedVisits.value).filter(k => {
    const group = groupedVisits.value[k];
    return group && group.length > 0;
  })
})

const expandedCategory = ref(null)

function toggleFolder(category) {
  expandedCategory.value = expandedCategory.value === category ? null : category
}

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

function handleReclassify({ domain, category }) {
  console.log(`Reclassified ${domain} to ${category}`)
}
</script>

<template>
  <div class="p-6 lg:p-8 space-y-6 animate-fade-in">
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-2xl font-bold text-text-primary">Browsing Analytics</h1>
        <p class="text-text-muted mt-1">Folders of your history with AI-generated insights</p>
      </div>
      <div class="flex items-center gap-3">
        <button 
          @click="showApiSettings = !showApiSettings"
          class="px-4 py-2 text-sm font-medium rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-text-secondary"
        >
          AI Settings
        </button>
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
    </div>

    <!-- API Key Settings -->
    <div v-if="showApiSettings" class="glass-card p-5 border-l-4 border-l-primary/50 animate-fade-in">
      <h3 class="text-lg font-medium text-text-primary mb-2">Gemini AI Integration</h3>
      <p class="text-sm text-text-muted mb-4">
        Enter your Gemini API key to enable AI categorizations and history summaries. Your key is stored locally in your browser.
      </p>
      <div class="flex gap-3">
        <input 
          v-model="apiKeyInput"
          type="password"
          placeholder="AIzaSy..."
          class="flex-1 bg-surface-800 border border-white/10 rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-primary/50"
        />
        <button 
          @click="saveApiKey"
          class="px-6 py-2 bg-primary hover:bg-primary-hover text-white font-medium rounded-lg shadow-lg shadow-primary/20 transition-all"
        >
          Save Key
        </button>
      </div>
    </div>

    <!-- Empty State -->
    <div v-if="visits.length === 0" class="glass-card p-12 text-center">
      <div class="w-16 h-16 mx-auto mb-4 rounded-2xl bg-surface-800 border border-white/10 flex items-center justify-center">
        <svg class="w-8 h-8 text-text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 6v6m0 0v6m0-6h6m-6 0H6"/>
        </svg>
      </div>
      <h3 class="text-lg font-medium text-text-primary mb-1">No Browsing History</h3>
      <p class="text-sm text-text-muted">Start browsing to see your history grouped and analyzed here.</p>
    </div>

    <div v-else class="space-y-6">
      <!-- Advanced Visualizations -->
      <div class="grid lg:grid-cols-3 gap-6">
        <div class="lg:col-span-1">
          <ReasonsChart />
        </div>
        <div class="lg:col-span-2">
          <AnalyticsMindMap :visits="visits" @reclassify="handleReclassify" />
        </div>
      </div>

      <!-- Folders Grid -->
      <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
      <div 
        v-for="category in activeCategories" 
        :key="category"
        class="glass-card transition-all duration-300"
        :class="{ 'ring-1 ring-primary/50 shadow-lg shadow-primary/10': expandedCategory === category }"
      >
        <!-- Folder Header -->
        <div 
          class="p-5 cursor-pointer flex items-start gap-4"
          @click="toggleFolder(category)"
        >
          <div 
            class="w-12 h-12 rounded-xl flex items-center justify-center shrink-0 shadow-inner"
            :style="{ backgroundColor: getCategoryColor(category) + '20', color: getCategoryColor(category) }"
          >
            <svg class="w-6 h-6" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h6a2 2 0 012 2v7a2 2 0 01-2 2H4a2 2 0 01-2-2V6zm14 2H4v7h12V8z" clip-rule="evenodd" />
            </svg>
          </div>
          <div class="flex-1">
            <h3 class="font-semibold text-text-primary capitalize">{{ getCategoryLabel(category) }}</h3>
            <p class="text-xs text-text-muted mt-0.5">{{ groupedVisits[category].length }} visits</p>
          </div>
          <div class="shrink-0 text-text-muted">
            <svg class="w-5 h-5 transition-transform duration-300" :class="{ 'rotate-180': expandedCategory === category }" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        <!-- Folder Content (Expanded) -->
        <div v-show="expandedCategory === category" class="border-t border-white/5 bg-black/20">
          
          <!-- AI Summary Section -->
          <div class="p-4 border-b border-white/5 bg-primary/5">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-sm font-medium text-primary-light flex items-center gap-1.5">
                <svg class="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                AI Summary
              </h4>
              <button 
                @click.stop="generateSummary(category)"
                class="px-2.5 py-1 text-xs rounded-md bg-primary/20 hover:bg-primary/30 text-primary-light transition-colors"
                :disabled="isSummarizing[category]"
              >
                {{ isSummarizing[category] ? 'Generating...' : (summaries[category] ? 'Regenerate' : 'Generate') }}
              </button>
            </div>
            
            <div v-if="isSummarizing[category]" class="text-sm text-text-muted animate-pulse">
              Analyzing contents...
            </div>
            <div v-else-if="summaries[category]" class="text-sm text-text-secondary leading-relaxed">
              {{ summaries[category] }}
            </div>
            <div v-else class="text-xs text-text-muted italic">
              Click generate to get an AI summary of these links. Requires API key.
            </div>
          </div>

          <!-- Links List -->
          <div class="p-2 max-h-64 overflow-y-auto custom-scrollbar">
            <a 
              v-for="(visit, idx) in groupedVisits[category]" 
              :key="idx"
              :href="visit.url"
              target="_blank"
              class="flex items-center gap-3 p-2 rounded-lg hover:bg-white/5 transition-colors group"
            >
              <div class="w-8 h-8 rounded bg-surface-800 flex items-center justify-center shrink-0 border border-white/5">
                <img :src="`https://www.google.com/s2/favicons?domain=${visit.url}&sz=32`" class="w-4 h-4 opacity-70 group-hover:opacity-100" />
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm text-text-primary truncate">{{ visit.title || visit.url }}</p>
                <p class="text-xs text-text-muted truncate mt-0.5">{{ visit.url }}</p>
              </div>
              <div class="text-xs text-text-muted shrink-0 w-12 text-right">
                {{ visit.timeSpent ? Math.round(visit.timeSpent) + 's' : '' }}
              </div>
            </a>
          </div>
        </div>
      </div>
    </div>
    </div>
  </div>
</template>

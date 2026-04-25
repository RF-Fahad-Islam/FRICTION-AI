<script setup>
import { computed, ref, onMounted } from 'vue'
import { useProfileStore } from '../stores/profileStore.js'
import { useActivityStore } from '../stores/activityStore.js'
import BlockBypassChart from '../components/BlockBypassChart.vue'

const profileStore = useProfileStore()
const activityStore = useActivityStore()

const b = computed(() => profileStore.profile?.behavior || {})
const p = computed(() => profileStore.profile?.preferences || {})
const h = computed(() => profileStore.profile?.history || {})

const dailyActivity = computed(() => activityStore.dailyActivity || {})
const totalTime = computed(() => {
  let total = 0
  Object.values(dailyActivity.value).forEach(d => total += d.timeSpent || 0)
  return total
})

const avgWeekScore = computed(() => {
  const scores = h.value.lastWeekScores || []
  return scores.length > 0 ? Math.round(scores.reduce((a, c) => a + c, 0) / scores.length) : activityStore.todayBrainrotScore || 0
})

const frictionStats = computed(() => {
  const r = h.value.frictionResponses || { ignored: 0, obeyed: 0, exitedEarly: 0 }
  const total = r.ignored + r.obeyed + r.exitedEarly
  return {
    ...r,
    total,
    obeyRate: total > 0 ? Math.round((r.obeyed / total) * 100) : 0,
  }
})

const insights = computed(() => {
  const list = []
  const brainrotScore = activityStore.todayBrainrotScore || 0
  const highRisk = Object.entries(dailyActivity.value)
    .filter(([_, d]) => d.isBrainrot)
    .sort((a, b) => (b[1]?.timeSpent || 0) - (a[1]?.timeSpent || 0))
    .slice(0, 3)

  if (brainrotScore > 60) list.push({ type: 'warning', text: `Your brainrot rate is high at ${brainrotScore}%. Consider increasing friction.` })
  else if (brainrotScore < 30) list.push({ type: 'success', text: `Great focus! Your brainrot rate is only ${brainrotScore}%.` })
  
  if (highRisk.length > 0) {
    const topSite = highRisk[0][0]
    const topTime = Math.round((highRisk[0][1]?.timeSpent || 0) / 60)
    list.push({ type: 'warning', text: `Top brainrot site: ${topSite} (${topTime}m)` })
  }

  if (b.value.peakDistractionTime) list.push({ type: 'info', text: `You tend to get distracted during ${b.value.peakDistractionTime}.` })
  if (b.value.focusPatterns?.includes('productive_morning')) list.push({ type: 'success', text: 'You\'re consistently productive in the mornings!' })
  if (b.value.highRiskSites?.length > 0) list.push({ type: 'warning', text: `High-risk sites: ${b.value.highRiskSites.join(', ')}` })
  if (frictionStats.value.obeyRate > 70) list.push({ type: 'success', text: `You respond well to friction (${frictionStats.value.obeyRate}% compliance).` })
  if (list.length === 0) list.push({ type: 'info', text: 'Start browsing to generate personalized insights!' })
  return list
})

const insightColors = { warning: 'border-warning/30 bg-warning/5', success: 'border-success/30 bg-success/5', info: 'border-primary/30 bg-primary/5' }
const insightIcons = { warning: '⚠', success: '✓', info: 'ℹ' }
</script>

<template>
  <div class="p-6 lg:p-8 space-y-6 animate-fade-in">
    <div>
      <h1 class="text-2xl font-bold text-text-primary">Insights</h1>
      <p class="text-text-muted mt-1">AI-powered behavioral analysis</p>
    </div>

    <!-- Profile Overview -->
    <div class="grid sm:grid-cols-3 gap-4">
      <div class="glass-card p-5">
        <p class="text-xs text-text-muted uppercase tracking-wider mb-1">Friction Level</p>
        <p class="text-2xl font-bold text-primary-light">{{ b.frictionTolerance || 2 }}/5</p>
        <p class="text-xs text-text-muted mt-1">{{ ['','Gentle','Moderate','Strong','Aggressive','Maximum'][b.frictionTolerance || 2] }}</p>
      </div>
      <div class="glass-card p-5">
        <p class="text-xs text-text-muted uppercase tracking-wider mb-1">Avg Weekly Score</p>
        <p class="text-2xl font-bold" :class="avgWeekScore <= 40 ? 'text-success' : 'text-danger'">{{ avgWeekScore }}%</p>
        <p class="text-xs text-text-muted mt-1">brainrot average</p>
      </div>
      <div class="glass-card p-5">
        <p class="text-xs text-text-muted uppercase tracking-wider mb-1">Friction Compliance</p>
        <p class="text-2xl font-bold text-accent">{{ frictionStats.obeyRate }}%</p>
        <p class="text-xs text-text-muted mt-1">{{ frictionStats.obeyed }}/{{ frictionStats.total }} obeyed</p>
      </div>
    </div>

    <!-- Insights -->
    <div class="glass-card p-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Behavioral Insights</h2>
      <div class="space-y-3">
        <div
          v-for="(insight, i) in insights"
          :key="i"
          class="p-4 rounded-xl border"
          :class="insightColors[insight.type]"
        >
          <div class="flex items-start gap-3">
            <span class="text-lg">{{ insightIcons[insight.type] }}</span>
            <p class="text-sm text-text-primary">{{ insight.text }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Block Bypass Stats -->
    <div class="glass-card p-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Block Bypass Analysis</h2>
      <p class="text-sm text-text-muted mb-4">See which blocked sites you've accessed and why.</p>
      <BlockBypassChart />
    </div>

    <!-- Preferences -->
    <div class="glass-card p-6">
      <h2 class="text-lg font-semibold text-text-primary mb-4">Your Preferences</h2>
      <div class="grid sm:grid-cols-2 gap-4">
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p class="text-xs text-text-muted uppercase mb-1">Tone</p>
          <p class="text-sm text-text-primary capitalize">{{ p.tone || 'balanced' }}</p>
        </div>
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p class="text-xs text-text-muted uppercase mb-1">Goal</p>
          <p class="text-sm text-text-primary capitalize">{{ p.goal || 'study' }}</p>
        </div>
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p class="text-xs text-text-muted uppercase mb-1">Pomodoro Length</p>
          <p class="text-sm text-text-primary">{{ p.pomodoroLength || 25 }} minutes</p>
        </div>
        <div class="p-4 rounded-xl bg-white/[0.03] border border-white/5">
          <p class="text-xs text-text-muted uppercase mb-1">Peak Distraction</p>
          <p class="text-sm text-text-primary">{{ b.peakDistractionTime || 'Not detected yet' }}</p>
        </div>
      </div>
    </div>
  </div>
</template>

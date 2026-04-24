<script setup>
import { computed } from 'vue'
import { useActivityStore } from '../stores/activityStore.js'
import { useProfileStore } from '../stores/profileStore.js'
import BrainrotChart from '../components/BrainrotChart.vue'

const activityStore = useActivityStore()
const profileStore = useProfileStore()

const focusScore = computed(() => {
  return Math.max(0, 100 - (activityStore.todayBrainrotScore || 0))
})

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
    label: 'Tracked Sites',
    value: Object.keys(activityStore.dailyActivity || {}).length,
    suffix: '',
    color: 'text-primary-light',
    bg: 'from-primary-light/20 to-primary/10',
  },
])
</script>

<template>
  <div class="p-6 lg:p-8 space-y-6 animate-fade-in">
    <!-- Header -->
    <div>
      <h1 class="text-2xl font-bold text-text-primary">Dashboard</h1>
      <p class="text-text-muted mt-1">Your attention analytics at a glance</p>
    </div>

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

    <!-- Main Content Grid -->
    <div class="grid lg:grid-cols-1 gap-6">
      <!-- Chart -->
      <div>
        <BrainrotChart />
      </div>
    </div>
  </div>
</template>

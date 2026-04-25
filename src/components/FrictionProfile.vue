<script setup>
import { computed } from 'vue'
import { useProfileStore } from '../stores/profileStore.js'

const profileStore = useProfileStore()

const profileType = computed(() => profileStore.profile?.behavior?.type || 'Shadow Voyager')
const tolerance = computed(() => profileStore.profile?.behavior?.frictionTolerance || 2)
const lastUpdate = computed(() => {
  const date = profileStore.profile?.behavior?.lastProfileUpdate
  return date ? new Date(date).toLocaleDateString() : 'Never'
})

const badgeColor = computed(() => {
  switch (profileType.value) {
    case 'Dopamine Chaser': return 'bg-red-500/20 text-red-400 border-red-500/30'
    case 'Night Owl Scroller': return 'bg-purple-500/20 text-purple-400 border-purple-500/30'
    case 'Work Procrastinator': return 'bg-amber-500/20 text-amber-400 border-amber-500/30'
    case 'Mindful Browser': return 'bg-green-500/20 text-green-400 border-green-500/30'
    default: return 'bg-gray-500/20 text-gray-400 border-gray-500/30'
  }
})

const icon = computed(() => {
  switch (profileType.value) {
    case 'Dopamine Chaser': return '🔥'
    case 'Night Owl Scroller': return '🌙'
    case 'Work Procrastinator': return '💼'
    case 'Mindful Browser': return '🧘'
    default: return '👤'
  }
})
</script>

<template>
  <div class="glass-card p-6 h-full border-primary/20 relative overflow-hidden group">
    <div class="absolute -right-4 -top-4 text-6xl opacity-10 group-hover:scale-110 transition-transform">
      {{ icon }}
    </div>
    
    <div class="relative z-10">
      <h2 class="text-sm font-medium text-text-muted uppercase tracking-wider mb-2">Behavioral Profile</h2>
      <div class="flex items-center gap-3 mb-4">
        <span class="text-3xl">{{ icon }}</span>
        <div>
          <div class="text-xl font-bold text-text-primary">{{ profileType }}</div>
          <div :class="['inline-block px-2 py-0.5 rounded-full text-[10px] font-bold border mt-1', badgeColor]">
            AUTO-GENERATED
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <div>
          <div class="flex justify-between text-xs mb-1.5">
            <span class="text-text-muted">Friction Aggression</span>
            <span class="text-primary-light font-medium">{{ tolerance }}/5</span>
          </div>
          <div class="h-1.5 bg-surface-900 rounded-full overflow-hidden">
            <div 
              class="h-full bg-gradient-to-r from-primary to-primary-light transition-all duration-1000"
              :style="{ width: `${(tolerance / 5) * 100}%` }"
            ></div>
          </div>
        </div>

        <div class="grid grid-cols-2 gap-4 pt-2">
          <div class="bg-surface-900/50 p-3 rounded-xl border border-white/5">
            <div class="text-[10px] text-text-muted uppercase font-bold mb-1">Status</div>
            <div class="text-sm text-text-primary font-medium">Adapting</div>
          </div>
          <div class="bg-surface-900/50 p-3 rounded-xl border border-white/5">
            <div class="text-[10px] text-text-muted uppercase font-bold mb-1">Last Update</div>
            <div class="text-sm text-text-primary font-medium">{{ lastUpdate }}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

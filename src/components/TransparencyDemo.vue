<script setup>
import { ref, computed, onUnmounted } from 'vue'
import { useIntersectionObserver } from '@vueuse/core'
import { Play } from 'lucide-vue-next'

const target = ref(null)
const secondsElapsed = ref(0)
let intervalId = null

const formattedTime = computed(() => {
  const m = Math.floor(secondsElapsed.value / 60).toString().padStart(2, '0')
  const s = (secondsElapsed.value % 60).toString().padStart(2, '0')
  return `${m}:${s}`
})

useIntersectionObserver(
  target,
  ([{ isIntersecting }]) => {
    if (isIntersecting) {
      if (!intervalId) {
        intervalId = setInterval(() => {
          secondsElapsed.value++
        }, 1000)
      }
    } else {
      if (intervalId) {
        clearInterval(intervalId)
        intervalId = null
      }
    }
  },
  { threshold: 0.1 }
)

onUnmounted(() => {
  if (intervalId) clearInterval(intervalId)
})
</script>

<template>
  <div ref="target" class="relative w-full max-w-sm aspect-video rounded-2xl overflow-hidden border-4 border-gray-900 bg-gray-900 shadow-2xl flex items-center justify-center group">
    
    <!-- Mock Video Background -->
    <div class="absolute inset-0 bg-gradient-to-br from-gray-800 to-black opacity-80"></div>
    
    <!-- Play Icon Mock -->
    <div class="absolute inset-0 flex items-center justify-center pointer-events-none">
      <Play class="w-16 h-16 text-white/10" />
    </div>

    <!-- The Relentless Timer -->
    <div class="relative z-10 font-mono text-5xl md:text-6xl font-black text-red-500/80 drop-shadow-[0_0_15px_rgba(239,68,68,0.5)] tracking-tighter">
      {{ formattedTime }}
    </div>

    <!-- Overlay controls mock -->
    <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
      <div class="h-full bg-red-500/50" :style="{ width: `${(secondsElapsed % 60) / 60 * 100}%` }"></div>
    </div>
  </div>
</template>

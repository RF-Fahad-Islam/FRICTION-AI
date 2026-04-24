<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'

const container = ref(null)
const scrollTop = ref(0)
const isAutoScrolling = ref(true)
let animationFrameId = null

const gradients = [
  'from-blue-400 to-indigo-500',
  'from-pink-400 to-rose-500',
  'from-amber-400 to-orange-500',
  'from-emerald-400 to-teal-500',
  'from-purple-400 to-fuchsia-500'
]

const getGradient = (i) => gradients[(i - 1) % gradients.length]

const handleScroll = (e) => {
  scrollTop.value = e.target.scrollTop
}

const frictionLevel = computed(() => {
  if (scrollTop.value < 150) return 'Low'
  if (scrollTop.value < 400) return 'Medium'
  return 'High'
})

// Calculate resistance. As they scroll further, we apply a translateY that pushes the content up slightly,
// or we just use a CSS transition that delays the visual update, creating a "laggy" feel.
const resistanceStyle = computed(() => {
  if (frictionLevel.value === 'Low') {
    return { transform: 'scale(1)', filter: 'grayscale(0%)', transition: 'all 0.1s ease-out' }
  } else if (frictionLevel.value === 'Medium') {
    return { transform: 'scale(0.98)', filter: 'grayscale(30%) blur(1px)', transition: 'all 0.3s ease-out' }
  } else {
    return { transform: 'scale(0.95)', filter: 'grayscale(80%) blur(2px)', transition: 'all 0.8s cubic-bezier(0.1, 0.7, 1.0, 0.1)' }
  }
})

// Auto-scroll logic that slows down progressively
let scrollSpeed = 1.5
const autoScroll = () => {
  if (isAutoScrolling.value && container.value) {
    // Progressively slow down the auto-scroll based on scroll depth to simulate friction
    if (scrollTop.value > 400) {
      scrollSpeed = 0.2 // Heavy friction
    } else if (scrollTop.value > 150) {
      scrollSpeed = 0.8 // Medium friction
    } else {
      scrollSpeed = 1.5 // Low friction
    }
    
    container.value.scrollTop += scrollSpeed
    
    // Loop back to top if reached the end (approx 5 reels * 232px - 256px container = ~900px)
    if (container.value.scrollTop >= container.value.scrollHeight - container.value.clientHeight - 5) {
      container.value.scrollTop = 0
      scrollSpeed = 1.5
    }
  }
  animationFrameId = requestAnimationFrame(autoScroll)
}

const pauseAutoScroll = () => { isAutoScrolling.value = false }
const resumeAutoScroll = () => { isAutoScrolling.value = true }

onMounted(() => {
  animationFrameId = requestAnimationFrame(autoScroll)
})

onUnmounted(() => {
  if (animationFrameId) cancelAnimationFrame(animationFrameId)
})
</script>

<template>
  <div class="relative w-56 h-80 rounded-2xl overflow-hidden border-[6px] border-gray-900 bg-gray-900 shadow-2xl group flex-shrink-0"
       @mouseenter="pauseAutoScroll"
       @mouseleave="resumeAutoScroll"
       @touchstart="pauseAutoScroll"
       @touchend="resumeAutoScroll">
    
    <!-- Dynamic Badge -->
    <div class="absolute top-3 left-1/2 -translate-x-1/2 z-20 bg-black/80 backdrop-blur-md text-xs font-bold px-3 py-1.5 rounded-full whitespace-nowrap border transition-colors duration-500"
         :class="{ 
           'text-green-400 border-green-500/30': frictionLevel === 'Low', 
           'text-yellow-400 border-yellow-500/30': frictionLevel === 'Medium', 
           'text-red-400 border-red-500/30': frictionLevel === 'High' 
         }">
      Friction Level: {{ frictionLevel }}
    </div>

    <!-- Scroll Container -->
    <!-- Hide scrollbar using custom CSS classes (defined in style.css or inline) -->
    <div ref="container" 
         class="h-full w-full overflow-y-auto no-scrollbar"
         style="scrollbar-width: none; -ms-overflow-style: none;"
         @scroll="handleScroll">
         
         <!-- Reels wrapper -->
         <div class="flex flex-col gap-3 p-2" :style="resistanceStyle">
            <!-- 5 dummy reels -->
            <div v-for="i in 5" :key="i" 
                 class="w-full h-[260px] shrink-0 rounded-xl bg-gradient-to-br shadow-inner flex flex-col justify-end p-4 text-white" 
                 :class="getGradient(i)">
              <div class="w-2/3 h-4 bg-white/30 rounded-full mb-2 backdrop-blur-sm"></div>
              <div class="w-1/2 h-3 bg-white/20 rounded-full backdrop-blur-sm"></div>
            </div>
         </div>
    </div>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
</style>

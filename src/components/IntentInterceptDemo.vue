<script setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import Button from './ui/button/Button.vue'

const container = ref(null)
const reelCount = ref(0)
const isLocked = computed(() => reelCount.value >= 10)

const colors = [
  'bg-blue-400', 'bg-red-400', 'bg-green-400', 'bg-yellow-400', 'bg-purple-400',
  'bg-pink-400', 'bg-indigo-400', 'bg-teal-400', 'bg-orange-400', 'bg-cyan-400', 'bg-rose-400'
]

const getGradient = (i) => colors[(i - 1) % colors.length]

let lastScrollTop = 0
const handleScroll = (e) => {
  if (isLocked.value) {
    // If locked, prevent scrolling by forcing scroll back
    e.target.scrollTop = lastScrollTop
    return
  }
  
  const currentScrollTop = e.target.scrollTop
  // Assuming each reel is roughly 220px tall (h-52 = 208px + gap)
  const currentReel = Math.floor(currentScrollTop / 220)
  
  if (currentReel > reelCount.value && currentReel <= 10) {
    reelCount.value = currentReel
  }
  
  lastScrollTop = currentScrollTop
}

const unlock = () => {
  reelCount.value = 0
  if (container.value) {
    container.value.scrollTop = 0
    lastScrollTop = 0
  }
}
</script>

<template>
  <div class="relative w-56 h-80 rounded-2xl border-[6px] border-gray-900 bg-gray-900 shadow-2xl flex-shrink-0"
       :class="{'overflow-hidden': isLocked}">
    
    <!-- Header/Nav mock -->
    <div class="absolute top-0 left-0 right-0 h-10 bg-gradient-to-b from-black/50 to-transparent z-10 flex items-center px-4">
      <div class="text-white text-xs font-bold">Feed</div>
      <div class="ml-auto text-white/70 text-xs">{{ reelCount }}/10</div>
    </div>

    <!-- Feed Container -->
    <div ref="container" 
         class="h-full w-full overflow-y-auto no-scrollbar scroll-smooth"
         :class="{'overflow-hidden': isLocked}"
         style="scrollbar-width: none; -ms-overflow-style: none;"
         @scroll="handleScroll">
         
         <!-- Reels wrapper -->
         <div class="flex flex-col gap-2 pb-64">
            <!-- Render 15 dummy reels so there's enough to scroll past 10 -->
            <div v-for="i in 15" :key="i" 
                 class="w-full h-[212px] shrink-0 rounded-lg shadow-inner flex items-center justify-center text-white/50 font-bold text-2xl relative overflow-hidden" 
                 :class="getGradient(i)">
                 <!-- Play icon mock -->
                 <div class="w-12 h-12 rounded-full bg-black/20 backdrop-blur flex items-center justify-center">
                   <div class="w-0 h-0 border-t-8 border-t-transparent border-l-[12px] border-l-white border-b-8 border-b-transparent ml-1"></div>
                 </div>
            </div>
         </div>
    </div>

    <!-- Intercept Modal -->
    <transition name="fade">
      <div v-if="isLocked" class="absolute inset-0 z-30 bg-black/40 backdrop-blur-md flex flex-col items-center justify-center p-4">
        <div class="bg-white/10 border border-white/20 p-5 rounded-xl backdrop-blur-lg w-full shadow-2xl">
          <h4 class="text-white font-bold text-center mb-1 text-sm">Scroll Locked</h4>
          <p class="text-white/80 text-xs text-center mb-4">Why are you watching the next one?</p>
          
          <div class="flex flex-col gap-2">
            <Button size="sm" variant="secondary" class="w-full bg-white/20 text-white hover:bg-white/30 border-none text-xs h-8" @click="unlock">
              Bored
            </Button>
            <Button size="sm" variant="secondary" class="w-full bg-white/20 text-white hover:bg-white/30 border-none text-xs h-8" @click="unlock">
              Procrastinating
            </Button>
            <Button size="sm" variant="secondary" class="w-full bg-white/20 text-white hover:bg-white/30 border-none text-xs h-8" @click="unlock">
              Learning
            </Button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<style scoped>
.no-scrollbar::-webkit-scrollbar {
  display: none;
}
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}
.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}
</style>

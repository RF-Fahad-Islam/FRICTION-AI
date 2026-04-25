<script setup>
import { Play, Download, Apple } from 'lucide-vue-next'
import Button from './ui/button/Button.vue'
</script>

<template>
  <div class="w-full flex flex-col md:flex-row items-center justify-between min-h-[60vh] relative mb-16 overflow-hidden md:overflow-visible">
    
    <!-- Left Column: Animated Emojis (Blue Blob Focus) -->
    <div class="hidden md:flex w-1/4 relative justify-center items-center h-full pointer-events-none">
      
      <!-- Main Blue Blob -->
      <div class="absolute animate-float w-56 h-56 z-10 [animation-delay:0ms]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-2xl">
          <path fill="#3B82F6" d="M45.7,-76.3C58.9,-69.3,69.1,-55.3,77.5,-41C85.9,-26.7,92.5,-12.1,90.2,1.5C87.9,15.1,76.6,27.7,66.9,39.6C57.2,51.5,49.1,62.8,37.8,70.6C26.5,78.4,12.1,82.8,-1.7,85.5C-15.5,88.2,-28.9,89.3,-41.8,83.9C-54.7,78.5,-67.1,66.6,-76.4,52.3C-85.7,38,-91.9,21.3,-92.3,4.4C-92.7,-12.5,-87.3,-29.6,-77.1,-43.3C-66.9,-57,-51.9,-67.3,-37.2,-73.2C-22.5,-79.1,-8.1,-80.6,6.8,-88.7C21.7,-96.8,43.4,-111.5,45.7,-76.3Z" transform="translate(100 100)" />
          <!-- Simple Cute Face -->
          <circle cx="75" cy="95" r="7" fill="#000" />
          <circle cx="115" cy="95" r="7" fill="#000" />
          <path d="M 85 115 Q 95 128 105 115" stroke="#000" stroke-width="5" fill="transparent" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Yellow Coin -->
      <div class="absolute bottom-10 left-0 animate-float-fast w-14 h-14 bg-yellow-400 rounded-full border-[5px] border-yellow-500 flex items-center justify-center drop-shadow-lg [animation-delay:300ms]">
        <div class="w-6 h-6 border-4 border-yellow-500 rounded-full"></div>
      </div>

      <!-- Red Heart -->
      <div class="absolute top-0 right-4 animate-float-reverse w-12 h-12 text-red-500 drop-shadow-md [animation-delay:800ms]">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z"/>
        </svg>
      </div>

      <!-- Star -->
      <div class="absolute -left-10 top-1/4 animate-float-fast w-10 h-10 text-yellow-300 drop-shadow-sm [animation-delay:1200ms]">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z"/>
        </svg>
      </div>
      
      <!-- Sparkle -->
      <div class="absolute bottom-20 -right-8 animate-float w-8 h-8 text-indigo-300 [animation-delay:250ms]">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/></svg>
      </div>
      
      <!-- Pill -->
      <div class="absolute -bottom-8 right-10 animate-float-reverse w-12 h-6 bg-cyan-400 rounded-full shadow-sm rotate-45 [animation-delay:600ms]"></div>
    </div>

    <!-- Center Column: Content -->
    <div class="w-full md:w-1/2 flex flex-col items-center text-center z-20 px-4 mt-20 md:mt-0 relative">
      <h1 class="text-5xl md:text-7xl lg:text-8xl font-bold font-serif text-gray-900 tracking-tight mb-6 leading-[1.1]">
        Take back<br/>your time.
      </h1>
      <p class="text-xl md:text-2xl text-gray-600 max-w-2xl mb-10 leading-relaxed">
        Mindless scrolling steals hours. The Friction Engine puts intentionality back into your digital life.
      </p>
      
      <div class="flex flex-col sm:flex-row items-center gap-4">
        <Button size="lg" class="rounded-full bg-gray-900 hover:bg-gray-800 text-white shadow-xl shadow-gray-900/20 px-8 py-6 text-lg w-full sm:w-auto h-auto flex gap-2">
          <Apple class="w-5 h-5" />
          Download Extension
        </Button>
        <Button size="lg" variant="secondary" class="rounded-full bg-gray-100 hover:bg-gray-200 text-gray-900 px-8 py-6 text-lg w-full sm:w-auto h-auto flex gap-2">
          <Play class="w-5 h-5" />
          Watch the Video
        </Button>
      </div>
    </div>

    <!-- Right Column: Animated Emojis (Green & Orange) -->
    <div class="hidden md:flex w-1/4 relative justify-center items-center h-full pointer-events-none">
      
      <!-- Green Blob -->
      <div class="absolute top-10 right-4 animate-float-fast w-44 h-44 z-10 [animation-delay:500ms]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-xl">
          <path fill="#22C55E" d="M52.3,-74.6C66,-64.4,74.1,-46.8,77.7,-29.1C81.3,-11.4,80.4,6.4,73.8,21.8C67.2,37.2,54.9,50.2,40.6,60.6C26.3,71,10.1,78.8,-5.5,86.1C-21.1,93.4,-36.1,80.3,-47.9,68.2C-59.7,56.1,-68.3,45,-75.2,31.7C-82.1,18.4,-87.3,2.9,-83.4,-10.8C-79.5,-24.5,-66.5,-36.4,-53.4,-47.5C-40.3,-58.6,-27.1,-68.9,-11.4,-75.3C4.3,-81.7,19.9,-84.2,34.8,-80.7C49.7,-77.2,63.9,-69.7,52.3,-74.6Z" transform="translate(100 100)" />
          <!-- Face -->
          <circle cx="95" cy="85" r="5" fill="#000" />
          <circle cx="125" cy="85" r="5" fill="#000" />
          <path d="M 105 100 Q 110 108 115 100" stroke="#000" stroke-width="4" fill="transparent" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Spiky Orange/Red Blob -->
      <div class="absolute bottom-10 left-0 animate-float-reverse w-48 h-48 z-10 [animation-delay:900ms]">
        <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" class="drop-shadow-xl">
          <path fill="#F97316" d="M36.7,-58.1C47.2,-48.5,55.1,-37,60.4,-24.1C65.7,-11.2,68.4,3.1,65.8,16.5C63.2,29.9,55.3,42.4,44.5,51C33.7,59.6,20,64.3,6.3,64.4C-7.4,64.5,-21,60,-33.4,53C-45.8,46,-57,36.5,-63.1,24.1C-69.2,11.7,-70.2,-3.6,-66,-17C-61.8,-30.4,-52.4,-41.9,-41.1,-51.3C-29.8,-60.7,-16.6,-68,-2.2,-64.8C12.2,-61.6,26.2,-67.7,36.7,-58.1Z" transform="translate(100 100) scale(-1, 1)" />
          <!-- Face -->
          <circle cx="85" cy="95" r="6" fill="#000" />
          <circle cx="115" cy="95" r="6" fill="#000" />
          <path d="M 95 110 Q 100 120 105 110" stroke="#000" stroke-width="4" fill="transparent" stroke-linecap="round" />
        </svg>
      </div>

      <!-- Chat Bubble -->
      <div class="absolute top-1/4 left-0 animate-float w-12 h-12 text-blue-400 drop-shadow-md [animation-delay:400ms]">
        <svg viewBox="0 0 24 24" fill="currentColor">
          <path d="M20 2H4C2.9 2 2 2.9 2 4v18l4-4h14c1.1 0 2-.9 2-2V4C22 2.9 21.1 2 20 2z"/>
        </svg>
      </div>

      <!-- Sparkle -->
      <div class="absolute bottom-1/3 -right-8 animate-float-fast w-10 h-10 text-pink-400 drop-shadow-sm [animation-delay:1100ms]">
        <svg viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L15 9L22 12L15 15L12 22L9 15L2 12L9 9L12 2Z"/></svg>
      </div>

      <!-- Squiggle/Abstract -->
      <div class="absolute -top-4 right-1/4 animate-float-reverse w-12 h-6 border-b-4 border-r-4 border-indigo-500 rounded-br-full rotate-12 [animation-delay:1400ms]"></div>
      
    </div>

  </div>
</template>

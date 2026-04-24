<script setup>
import { watchEffect } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import Header from './components/Header.vue'
import HeroSection from './components/HeroSection.vue'
import BentoGrid from './components/BentoGrid.vue'
import FeatureShowcase from './components/FeatureShowcase.vue'
import EfficiencyStats from './components/EfficiencyStats.vue'

const { y } = useWindowScroll()

// The friction engine logic
watchEffect(() => {
  // We want the grayscale to start at 0% at the top of the page (0px)
  // And reach 100% when scrolling down near the bottom of the second card (e.g. 1500px)
  // The user requested: 
  // "At 0px scroll, the entire page should be in full color (grayscale(0%))."
  // "As the user scrolls down through the two cards, dynamically increase the grayscale."
  
  const startScroll = 100;
  const endScroll = 1200;
  
  let percentage = (y.value - startScroll) / (endScroll - startScroll);
  
  if (percentage < 0) percentage = 0;
  if (percentage > 1) percentage = 1;
  
  document.body.style.setProperty('--page-grayscale', `${percentage * 100}%`);
})
</script>

<template>
  <div class="min-h-screen bg-white font-sans text-gray-900 selection:bg-blue-200">
    <Header />
    <main>
      <HeroSection />
      <BentoGrid />
      <FeatureShowcase />
    </main>
    <EfficiencyStats />
  </div>
</template>

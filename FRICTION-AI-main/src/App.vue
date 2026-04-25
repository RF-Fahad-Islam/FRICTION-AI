<script setup>
import { watchEffect } from 'vue'
import { useWindowScroll } from '@vueuse/core'
import Header from './components/Header.vue'
import HeroSection from './components/HeroSection.vue'
import BentoGrid from './components/BentoGrid.vue'
import FeatureShowcase from './components/FeatureShowcase.vue'
import EfficiencyStats from './components/EfficiencyStats.vue'
import InstallGuideModal from './components/InstallGuideModal.vue'
import { isInstallModalOpen } from './state'

const { y } = useWindowScroll()

// The friction engine logic
watchEffect(() => {
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
    <div class="grayscale-wrapper">
      <Header />
      <main>
        <HeroSection />
        <BentoGrid />
        <FeatureShowcase />
      </main>
      <EfficiencyStats />
    </div>
    
    <!-- Installation Guide Modal -->
    <InstallGuideModal 
      :is-open="isInstallModalOpen" 
      @close="isInstallModalOpen = false" 
    />
  </div>
</template>

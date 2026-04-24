<script setup>
import Card from './ui/card/Card.vue'
import IntentInterceptDemo from './IntentInterceptDemo.vue'
import TransparencyDemo from './TransparencyDemo.vue'
</script>

<template>
  <section class="container mx-auto px-6 py-12 flex flex-col items-center gap-16">
    <!-- Card 3: Intent Intercept (Text Left, Demo Right) -->
    <Card class="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-transparent hover:border-green-500 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-green-500/20 group relative bg-white">
      <div class="flex flex-col md:flex-row relative z-10">
        <div class="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 class="text-4xl font-serif font-bold text-gray-900 mb-6">Intent Intercept</h2>
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            After 10 consecutive reels, the scroll locks. A prompt appears asking: Why are you watching the next one? You must explicitly select if you are bored, procrastinating, or actually learning before continuing.
          </p>
        </div>
        <div class="md:w-1/2 bg-green-50 flex items-center justify-center p-8">
          <IntentInterceptDemo />
        </div>
      </div>
    </Card>

    <!-- Card 4: Relentless Transparency (Demo Left, Text Right) -->
    <Card class="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-transparent hover:border-red-500 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-red-500/20 group relative bg-white">
      <div class="flex flex-col md:flex-row-reverse relative z-10">
        <div class="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 class="text-4xl font-serif font-bold text-gray-900 mb-6">Relentless Transparency</h2>
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            No blocking, just brutal honesty. A persistent, un-closable timer is overlaid directly onto the video content, showing exactly how many minutes and seconds you have spent in the void.
          </p>
        </div>
        <div class="md:w-1/2 bg-red-50 flex items-center justify-center p-8">
          <TransparencyDemo />
        </div>
      </div>
    </Card>
  </section>
</template>

<script setup>
import Card from './ui/card/Card.vue'
import Button from './ui/button/Button.vue'
import attentionImg from '@/assets/images/attention_interrupter.png'
import dopamineImg from '@/assets/images/dopamine_fade.png'
</script>

<template>
  <section class="container mx-auto px-6 pt-40 pb-24 flex flex-col items-center gap-16">
    <div class="text-center max-w-3xl mb-8">
      <h1 class="text-5xl md:text-7xl font-bold font-serif text-gray-900 tracking-tight mb-6">
        Take back your time.
      </h1>
      <p class="text-xl text-gray-600">
        Mindless scrolling steals hours. The Friction Engine puts intentionality back into your digital life.
      </p>
    </div>

    <!-- Card 1: Attention Interrupter -->
    <Card class="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-transparent hover:border-blue-500 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-blue-500/20 group relative bg-white">
      <div class="absolute inset-0 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 opacity-0 group-hover:opacity-10 transition-opacity duration-500 animate-gradient"></div>
      <div class="flex flex-col md:flex-row relative z-10">
        <div class="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 class="text-4xl font-serif font-bold text-gray-900 mb-6">Attention Interrupter</h2>
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            Acknowledge your intent. We intercept mindless scrolling with a gentle pause, allowing you to decide if you really want to continue.
          </p>
          <div>
            <Button size="lg" class="rounded-full bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-500/30">
              Explore Interruption
            </Button>
          </div>
        </div>
        <div class="md:w-1/2 bg-blue-50 flex items-center justify-center p-8">
          <img :src="attentionImg" alt="Attention Interrupter" class="w-full h-auto object-cover rounded-2xl shadow-sm mix-blend-multiply" />
        </div>
      </div>
    </Card>

    <!-- Card 2: Dopamine Fade -->
    <Card class="w-full max-w-5xl rounded-3xl overflow-hidden border-2 border-transparent hover:border-purple-500 transition-all duration-500 hover:scale-[1.02] hover:shadow-2xl hover:shadow-purple-500/20 group relative bg-white">
      <div class="flex flex-col md:flex-row-reverse relative z-10">
        <div class="p-12 md:w-1/2 flex flex-col justify-center">
          <h2 class="text-4xl font-serif font-bold text-gray-900 mb-6 group-hover:bg-clip-text group-hover:text-transparent group-hover:bg-gradient-to-r group-hover:from-purple-600 group-hover:to-pink-600 transition-all">Dopamine Fade</h2>
          <p class="text-lg text-gray-600 mb-8 leading-relaxed">
            The world fades to gray, but your focus stays sharp. As you scroll aimlessly, vibrant colors drain away, breaking the addictive cycle.
          </p>
          <div>
            <Button size="lg" class="rounded-full bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/30">
              Try the Fade
            </Button>
          </div>
        </div>
        <div class="md:w-1/2 bg-purple-50 flex items-center justify-center p-8 relative overflow-hidden">
          <div class="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent opacity-50"></div>
          <img :src="dopamineImg" alt="Dopamine Fade" class="w-full h-auto object-cover rounded-2xl shadow-sm mix-blend-multiply relative z-10" />
        </div>
      </div>
    </Card>
  </section>
</template>

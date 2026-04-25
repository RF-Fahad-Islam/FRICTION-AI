<script setup>
import { Weight, Palette, Hand, Timer, Eye, ShieldCheck, Zap, BarChart3 } from 'lucide-vue-next'
</script>

<template>
  <section id="features" class="container mx-auto px-6 py-24">
    <div class="text-center mb-16">
      <h2 class="text-4xl font-serif font-bold text-gray-900 mb-4">Core Principles</h2>
      <p class="text-xl text-gray-600">The architecture of reclaiming your mind.</p>
    </div>

    <div class="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
      <!-- Feature 1 (Large) -->
      <div class="md:col-span-2 bg-red-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-red-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-red-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-red-500/30">
          <Weight class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Heavy Scrolling</h3>
          <p class="text-gray-600 leading-relaxed">
            We manipulate software response to physical scroll actions. As you scroll through shorts, we inject artificial latency and reduce scroll distance, making every swipe an intentional, physically heavy choice.
          </p>
        </div>
      </div>

      <!-- Feature 2 -->
      <div class="bg-yellow-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-yellow-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-yellow-400 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-yellow-400/30">
          <Palette class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-xl font-bold mb-3 text-gray-900">Dopamine Desaturation</h3>
          <p class="text-gray-600">
            The UI literally drains of color. As your session lengthens, we dynamically apply a grayscale filter to the webpage, breaking the addictive visual reward loop.
          </p>
        </div>
      </div>

      <!-- Feature 3 -->
      <div class="bg-green-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-green-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-green-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-green-500/30">
          <Hand class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-xl font-bold mb-3 text-gray-900">Intent Intercept</h3>
          <p class="text-gray-600">
            After 10 consecutive reels, the scroll locks. A prompt appears asking: Why are you watching the next one? You must explicitly select if you are bored, procrastinating, or actually learning before continuing.
          </p>
        </div>
      </div>

      <!-- Feature 4 (Large) -->
      <div class="md:col-span-2 bg-blue-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-blue-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-blue-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-blue-500/30">
          <Timer class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Relentless Transparency</h3>
          <p class="text-gray-600 leading-relaxed">
            No blocking, just brutal honesty. A persistent, un-closable timer is overlaid directly onto the video content, showing exactly how long you've been in the "void."
          </p>
        </div>
      </div>

      <!-- Feature 5 (Large) -->
      <div class="md:col-span-2 bg-pink-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-pink-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-pink-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-pink-500/30">
          <Eye class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Conscious Preview</h3>
          <p class="text-gray-600 leading-relaxed">
            Know what's coming. While you're fighting the current friction bar, we show you the title of the next reel, helping you decide if the effort is actually worth the reward before you even get there.
          </p>
        </div>
      </div>


      <!-- Feature 6 -->
      <div class="bg-indigo-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-indigo-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-indigo-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-indigo-500/30">
          <ShieldCheck class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-xl font-bold mb-3 text-gray-900">Soft Blocking</h3>
          <p class="text-gray-600">
            No more hard-blocking frustration. When a site is blocked, choose your intent: perform a productive task, a quick 2-minute check, or add 10 minutes—all while being logged for behavioral review.
          </p>
        </div>
      </div>

      <!-- Feature 7 -->
      <div class="bg-orange-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-orange-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-orange-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-orange-500/30">
          <Zap class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-xl font-bold mb-3 text-gray-900">Dynamic Escalation</h3>
          <p class="text-gray-600">
            The friction system evolves with your behavior. Friction levels automatically increase every 5 minutes on brainrot sites and during peak hours (10pm-2am) to fight late-night scrolling.
          </p>
        </div>
      </div>

      <!-- Feature 8 (Large) -->
      <div class="md:col-span-2 bg-cyan-50 rounded-3xl p-8 hover:shadow-xl transition-shadow border border-cyan-100 flex flex-col justify-between">
        <div class="w-14 h-14 bg-cyan-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-lg shadow-cyan-500/30">
          <BarChart3 class="w-7 h-7" />
        </div>
        <div>
          <h3 class="text-2xl font-bold mb-3 text-gray-900">Deep Analytics</h3>
          <p class="text-gray-600 leading-relaxed">
            Visualize your progress with Focus Scores, Brainrot intensity charts, and an AI-generated Interest Mind Map that groups your history into logical categories automatically.
          </p>
        </div>
      </div>
    </div>
  </section>
</template>


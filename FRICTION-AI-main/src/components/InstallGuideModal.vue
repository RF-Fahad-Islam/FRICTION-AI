<script setup>
import { X } from 'lucide-vue-next'
import { watch } from 'vue'

const props = defineProps({
  isOpen: Boolean
})

const emit = defineEmits(['close'])

// Prevent body scroll when modal is open
watch(() => props.isOpen, (newVal) => {
  if (newVal) {
    document.body.style.overflow = 'hidden'
  } else {
    document.body.style.overflow = ''
  }
}, { immediate: true })
</script>

<template>
  <Teleport to="body">
    <Transition
      enter-active-class="transition duration-300 ease-out"
      enter-from-class="opacity-0 scale-95"
      enter-to-class="opacity-100 scale-100"
      leave-active-class="transition duration-200 ease-in"
      leave-from-class="opacity-100 scale-100"
      leave-to-class="opacity-0 scale-95"
    >
      <div v-if="isOpen" class="fixed inset-0 z-[9999] flex items-center justify-center p-4 sm:p-6">
        <!-- Backdrop -->
        <div class="fixed inset-0 bg-gray-900/70 backdrop-blur-md" @click="emit('close')"></div>
        
        <!-- Modal Content -->
        <div class="relative z-10 w-full max-w-2xl bg-white rounded-[2.5rem] shadow-2xl overflow-hidden border border-gray-100 animate-in fade-in zoom-in duration-500">
          <div class="p-8 sm:p-12">
            <!-- Header -->
            <div class="flex justify-between items-start mb-8">
              <div>
                <h2 class="text-3xl font-serif font-bold text-gray-900 mb-2">Installation Guide</h2>
                <p class="text-gray-500 text-lg">Ready to reclaim your attention?</p>
              </div>
              <button @click="emit('close')" class="p-2 hover:bg-gray-100 rounded-full transition-colors">
                <X class="w-6 h-6 text-gray-400" />
              </button>
            </div>

            <!-- Steps -->
            <div class="space-y-8">
              <!-- Step 1 -->
              <div class="flex gap-6">
                <div class="flex-shrink-0 w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-blue-600 font-bold text-xl">1</div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-1">Unzip the File</h3>
                  <p class="text-gray-600 leading-relaxed text-lg">Extract the downloaded <code class="bg-gray-100 px-2 py-0.5 rounded text-blue-600 font-mono text-base">extension.zip</code> to a permanent folder on your computer.</p>
                </div>
              </div>

              <!-- Step 2 -->
              <div class="flex gap-6">
                <div class="flex-shrink-0 w-12 h-12 bg-purple-50 rounded-2xl flex items-center justify-center text-purple-600 font-bold text-xl">2</div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-1">Open Extensions Page</h3>
                  <p class="text-gray-600 leading-relaxed text-lg">Open Chrome and go to <code class="bg-gray-100 px-2 py-0.5 rounded text-purple-600 font-mono text-base">chrome://extensions</code></p>
                </div>
              </div>

              <!-- Step 3 -->
              <div class="flex gap-6">
                <div class="flex-shrink-0 w-12 h-12 bg-pink-50 rounded-2xl flex items-center justify-center text-pink-600 font-bold text-xl">3</div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-1">Enable Developer Mode</h3>
                  <p class="text-gray-600 leading-relaxed text-lg">Switch on the <span class="font-semibold text-gray-900">Developer mode</span> toggle in the top right corner.</p>
                </div>
              </div>

              <!-- Step 4 -->
              <div class="flex gap-6">
                <div class="flex-shrink-0 w-12 h-12 bg-green-50 rounded-2xl flex items-center justify-center text-green-600 font-bold text-xl">4</div>
                <div>
                  <h3 class="text-xl font-bold text-gray-900 mb-1">Load Unpacked</h3>
                  <p class="text-gray-600 leading-relaxed text-lg">Click <span class="font-semibold text-gray-900">Load unpacked</span> and select the folder you unzipped in Step 1.</p>
                </div>
              </div>
            </div>

            <!-- Footer Action -->
            <div class="mt-12">
              <button @click="emit('close')" class="w-full py-5 bg-gray-900 text-white rounded-2xl font-bold text-xl hover:bg-gray-800 transition-all hover:scale-[1.02] active:scale-95 shadow-xl shadow-gray-900/20">
                Got it, let's go!
              </button>
            </div>
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.font-mono {
  font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, "Liberation Mono", "Courier New", monospace;
}
</style>

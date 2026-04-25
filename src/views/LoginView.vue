<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const isLoading = ref(false)
const email = ref('')
const password = ref('')

const handleLogin = () => {
  isLoading.value = true
  setTimeout(() => {
    localStorage.setItem('sf_is_authenticated', 'true')
    router.push('/dashboard')
    isLoading.value = false
  }, 500)
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center bg-surface-900 p-4">
    <div class="max-w-md w-full bg-surface-800/50 backdrop-blur-xl border border-white/10 rounded-2xl p-8 shadow-2xl">
      <div class="flex items-center gap-3 mb-8 justify-center">
        <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
          <svg class="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z"/>
          </svg>
        </div>
        <h1 class="text-2xl font-bold text-text-primary">Study Friction</h1>
      </div>

      <h2 class="text-xl font-semibold text-text-primary mb-6 text-center">Local Access</h2>
      <p class="text-sm text-text-muted text-center mb-6">Database is disabled. Using local storage for current session.</p>

      <form @submit.prevent="handleLogin" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
          <input 
            v-model="email" 
            type="email" 
            class="w-full bg-surface-700/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            class="w-full bg-surface-700/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 mt-2"
        >
          {{ isLoading ? 'Entering...' : 'Enter Dashboard' }}
        </button>
      </form>
    </div>
  </div>
</template>

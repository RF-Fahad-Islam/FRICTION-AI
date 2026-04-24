<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { supabase } from '@/lib/supabaseClient'

const router = useRouter()
const isLoading = ref(false)
const email = ref('')
const password = ref('')
const isSignUp = ref(false)
const errorMsg = ref('')

const handleEmailAuth = async () => {
  isLoading.value = true
  errorMsg.value = ''
  
  try {
    let error
    if (isSignUp.value) {
      const res = await supabase.auth.signUp({ email: email.value, password: password.value })
      error = res.error
      if (!error && res.data?.user) {
        // Assume auto sign in or wait for email confirmation.
        // For local testing, usually auto signs in if no email confirmation is required.
      }
    } else {
      const res = await supabase.auth.signInWithPassword({ email: email.value, password: password.value })
      error = res.error
    }

    if (error) throw error
    router.push('/dashboard')
  } catch (e) {
    errorMsg.value = e.message || 'Authentication failed'
  } finally {
    isLoading.value = false
  }
}

const handleGoogleSignIn = async () => {
  isLoading.value = true
  errorMsg.value = ''
  try {
    // Note: If running inside a Chrome Extension popup/options page, you may need 
    // to use chrome.identity.launchWebAuthFlow instead of the standard redirect flow.
    // We try standard redirect here, assuming it's loaded as a web app or configured.
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: window.location.origin + window.location.pathname
      }
    })
    if (error) throw error
  } catch (e) {
    errorMsg.value = e.message || 'Google Sign-In failed'
    isLoading.value = false
  }
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

      <h2 class="text-xl font-semibold text-text-primary mb-6 text-center">
        {{ isSignUp ? 'Create an account' : 'Welcome back' }}
      </h2>

      <div v-if="errorMsg" class="mb-4 p-3 bg-red-500/20 border border-red-500/50 rounded-lg text-red-200 text-sm text-center">
        {{ errorMsg }}
      </div>

      <form @submit.prevent="handleEmailAuth" class="space-y-4">
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">Email</label>
          <input 
            v-model="email" 
            type="email" 
            required 
            class="w-full bg-surface-700/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label class="block text-sm font-medium text-text-secondary mb-1">Password</label>
          <input 
            v-model="password" 
            type="password" 
            required 
            class="w-full bg-surface-700/50 border border-white/10 rounded-xl px-4 py-3 text-text-primary focus:outline-none focus:border-primary/50 transition-colors"
            placeholder="••••••••"
          />
        </div>

        <button 
          type="submit" 
          :disabled="isLoading"
          class="w-full bg-primary hover:bg-primary-light text-white font-medium py-3 px-4 rounded-xl transition-colors disabled:opacity-50 disabled:cursor-not-allowed mt-2"
        >
          <span v-if="isLoading">Loading...</span>
          <span v-else>{{ isSignUp ? 'Sign Up' : 'Sign In' }}</span>
        </button>
      </form>

      <div class="my-6 flex items-center gap-3">
        <div class="flex-1 h-px bg-white/10"></div>
        <span class="text-sm text-text-muted">OR</span>
        <div class="flex-1 h-px bg-white/10"></div>
      </div>

      <button 
        @click="handleGoogleSignIn"
        :disabled="isLoading"
        class="w-full bg-surface-700 hover:bg-surface-600 border border-white/10 text-text-primary font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg class="w-5 h-5" viewBox="0 0 24 24">
          <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
          <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
          <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
          <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
        </svg>
        Continue with Google
      </button>

      <p class="text-center text-sm text-text-muted mt-6">
        {{ isSignUp ? 'Already have an account?' : "Don't have an account?" }}
        <button @click="isSignUp = !isSignUp; errorMsg = ''" class="text-primary hover:text-primary-light font-medium ml-1">
          {{ isSignUp ? 'Sign In' : 'Sign Up' }}
        </button>
      </p>
    </div>
  </div>
</template>

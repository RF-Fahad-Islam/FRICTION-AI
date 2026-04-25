<script setup>
import { ref, nextTick, watch, onMounted } from 'vue'
import { useChatStore } from '../stores/chatStore.js'
import { useActivityStore } from '../stores/activityStore.js'
import { useProfileStore } from '../stores/profileStore.js'

const chatStore = useChatStore()
const activityStore = useActivityStore()
const profileStore = useProfileStore()
const input = ref('')
const messagesContainer = ref(null)
const showApiKeyPrompt = ref(false)
const tempApiKey = ref('')

const suggestions = [
  'Why am I distracted?',
  'Help me focus',
  'Be stricter with me',
  'Show my stats',
]

onMounted(() => {
  activityStore.fetchStats()
  if (!profileStore.profile?.preferences?.apiKey) {
    showApiKeyPrompt.value = true
  }
})

async function send() {
  const text = input.value.trim()
  if (!text || chatStore.isLoading) return
  input.value = ''
  await chatStore.send(text)
  await nextTick()
  scrollToBottom()
}

function sendSuggestion(text) {
  input.value = text
  send()
}

function scrollToBottom() {
  if (messagesContainer.value) {
    messagesContainer.value.scrollTop = messagesContainer.value.scrollHeight
  }
}

function saveApiKey() {
  const key = tempApiKey.value.trim()
  if (key) {
    console.log('[ChatView] Saving API key...')
    profileStore.setPreference('apiKey', key)
    
    // Force a small delay to ensure storage writes complete
    setTimeout(() => {
      showApiKeyPrompt.value = false
      // Also notify chatStore if it hasn't caught the event
      chatStore.setApiKey(key)
    }, 100)
  }
}

watch(() => chatStore.messages.length, () => nextTick(scrollToBottom))
</script>

<template>
  <div class="flex flex-col h-screen">
    <!-- Header -->
    <div class="p-6 pb-4 border-b border-white/5">
      <h1 class="text-2xl font-bold text-text-primary">AI Focus Coach</h1>
      <p class="text-text-muted text-sm mt-1">Ask me anything about your focus habits</p>
    </div>

    <!-- Messages -->
    <div ref="messagesContainer" class="flex-1 overflow-y-auto p-6 space-y-4">
      <!-- Status Bar -->
      <div class="grid grid-cols-3 gap-3 mb-6 animate-slide-down">
        <div class="glass-card p-3 text-center border-b-2 border-primary">
          <div class="text-[10px] text-text-muted uppercase font-bold tracking-widest">Focus</div>
          <div class="text-xl font-bold text-text-primary">{{ 100 - activityStore.todayBrainrotScore }}%</div>
        </div>
        <div class="glass-card p-3 text-center border-b-2 border-accent">
          <div class="text-[10px] text-text-muted uppercase font-bold tracking-widest">Reels</div>
          <div class="text-xl font-bold text-accent">{{ activityStore.reelCount }}</div>
        </div>
        <div class="glass-card p-3 text-center border-b-2 border-secondary">
          <div class="text-[10px] text-text-muted uppercase font-bold tracking-widest">Time</div>
          <div class="text-xl font-bold text-secondary">{{ Math.floor(activityStore.reelTime / 60) }}m</div>
        </div>
      </div>
      <!-- Welcome message -->
      <div v-if="!chatStore.hasMessages" class="flex flex-col items-center justify-center h-full text-center">
        <div class="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-4 animate-float">
          <svg class="w-8 h-8 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="1.5">
            <path stroke-linecap="round" stroke-linejoin="round" d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.455 2.456L21.75 6l-1.036.259a3.375 3.375 0 00-2.455 2.456z"/>
          </svg>
        </div>
        <h2 class="text-xl font-semibold text-text-primary mb-2">Hey! I'm your focus coach.</h2>
        <p class="text-text-muted max-w-md mb-6">I analyze your browsing data and help you build better attention habits. Try asking me something!</p>
        <div class="flex flex-wrap justify-center gap-2">
          <button
            v-for="s in suggestions"
            :key="s"
            @click="sendSuggestion(s)"
            class="px-4 py-2 rounded-xl bg-white/5 text-text-secondary text-sm hover:bg-primary/15 hover:text-primary-light transition-colors cursor-pointer border border-white/5 hover:border-primary/20"
          >
            {{ s }}
          </button>
        </div>
      </div>

      <!-- Message bubbles -->
      <template v-for="msg in chatStore.messages" :key="msg.id">
        <div class="flex" :class="msg.role === 'user' ? 'justify-end' : 'justify-start'">
          <div
            class="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
            :class="msg.role === 'user'
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-700 text-text-primary rounded-bl-md border border-white/5'"
          >
            <!-- Use HTML for assistant messages if available -->
            <span v-if="msg.role === 'assistant' && msg.html" v-html="msg.html"></span>
            <span v-else>{{ msg.content }}</span>
            <!-- Actions indicator -->
            <div v-if="msg.actions?.length > 0" class="mt-2 pt-2 border-t border-white/10 text-xs text-success">
              ✓ Settings updated
            </div>
          </div>
        </div>
      </template>

      <!-- Loading -->
      <div v-if="chatStore.isLoading" class="flex justify-start">
        <div class="bg-surface-700 px-4 py-3 rounded-2xl rounded-bl-md border border-white/5">
          <div class="flex gap-1.5">
            <span class="w-2 h-2 rounded-full bg-primary-light animate-bounce" style="animation-delay:0ms"></span>
            <span class="w-2 h-2 rounded-full bg-primary-light animate-bounce" style="animation-delay:150ms"></span>
            <span class="w-2 h-2 rounded-full bg-primary-light animate-bounce" style="animation-delay:300ms"></span>
          </div>
        </div>
      </div>
    </div>

    <!-- Input -->
    <div class="p-4 border-t border-white/5 bg-surface-800">
      <!-- Quick suggestions -->
      <div v-if="chatStore.hasMessages" class="flex gap-2 mb-3 overflow-x-auto pb-1">
        <button
          v-for="s in suggestions"
          :key="s"
          @click="sendSuggestion(s)"
          class="px-3 py-1.5 rounded-lg bg-white/5 text-text-muted text-xs whitespace-nowrap hover:bg-primary/10 hover:text-primary-light transition-colors cursor-pointer shrink-0"
        >
          {{ s }}
        </button>
      </div>
      <form @submit.prevent="send" class="flex gap-3">
        <input
          v-model="input"
          type="text"
          placeholder="Ask me anything..."
          class="flex-1 px-4 py-3 rounded-xl bg-surface-700 border border-white/5 text-text-primary placeholder-text-muted focus:outline-none focus:border-primary/30 transition-colors"
          :disabled="chatStore.isLoading"
        />
        <button
          type="submit"
          :disabled="chatStore.isLoading || !input.trim()"
          class="px-5 py-3 rounded-xl bg-primary text-white font-medium hover:bg-primary-dark transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
            <path stroke-linecap="round" stroke-linejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5"/>
          </svg>
        </button>
      </form>
    </div>

    <!-- API Key Prompt Modal -->
    <div v-if="showApiKeyPrompt" class="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div class="glass-card max-w-md w-full p-8 space-y-6 shadow-2xl border-primary/20 animate-slide-up">
        <div class="text-center">
          <div class="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg class="w-8 h-8 text-primary-light" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
          </div>
          <h2 class="text-xl font-bold text-text-primary">Gemini API Key Required</h2>
          <p class="text-sm text-text-muted mt-2">Enter your Gemini API key for personalized AI coaching. Your key stays local.</p>
        </div>

        <div class="space-y-4">
          <input 
            v-model="tempApiKey"
            type="password" 
            placeholder="Paste your API key here..."
            class="w-full bg-surface-900 border border-white/10 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
            @keyup.enter="saveApiKey"
          />
          <button 
            @click="saveApiKey"
            class="w-full px-4 py-3 rounded-xl text-sm font-medium bg-primary hover:bg-primary-dark text-white shadow-lg shadow-primary/20 transition-all"
          >
            Save & Continue
          </button>
        </div>

        <p class="text-[10px] text-center text-text-muted">
          Get free key at <a href="https://aistudio.google.com/app/apikey" target="_blank" class="text-primary-light hover:underline">Google AI Studio</a>
        </p>
      </div>
    </div>
  </div>
</template>

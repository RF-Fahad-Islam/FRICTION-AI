<script setup>
import { ref, nextTick, watch } from 'vue'
import { useChatStore } from '../stores/chatStore.js'

const chatStore = useChatStore()
const input = ref('')
const messagesContainer = ref(null)

const suggestions = [
  'Why am I distracted?',
  'Help me focus',
  'Be stricter with me',
  'Show my stats',
]

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
            class="max-w-[75%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
            :class="msg.role === 'user'
              ? 'bg-primary text-white rounded-br-md'
              : 'bg-surface-700 text-text-primary rounded-bl-md border border-white/5'"
          >
            {{ msg.content }}
            <!-- Actions indicator -->
            <div v-if="msg.actions?.length > 0" class="mt-2 pt-2 border-t border-white/10 text-xs opacity-70">
              Settings updated
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
  </div>
</template>

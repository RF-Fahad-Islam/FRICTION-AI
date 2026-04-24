/**
 * Chat Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendMessage, getChatHistory, clearChatHistory } from '../../services/aiChat.js'
import { useProfileStore } from './profileStore.js'

export const useChatStore = defineStore('chat', () => {
  const messages = ref(getChatHistory())
  const isLoading = ref(false)
  const profileStore = useProfileStore()
  const apiKey = computed(() => profileStore.profile?.preferences?.apiKey || '')

  const hasMessages = computed(() => messages.value.length > 0)

  async function send(text) {
    if (!text.trim()) return
    isLoading.value = true
    try {
      await sendMessage(text, apiKey.value || null)
      messages.value = getChatHistory()
      // Refresh profile in case chat modified it
      const profileStore = useProfileStore()
      profileStore.refresh()
    } catch (err) {
      console.error('[Chat] Error:', err)
    } finally {
      isLoading.value = false
    }
  }

  function clear() {
    clearChatHistory()
    messages.value = []
  }

  function setApiKey(key) {
    profileStore.setPreference('apiKey', key)
  }

  return { messages, isLoading, apiKey, hasMessages, send, clear, setApiKey }
})

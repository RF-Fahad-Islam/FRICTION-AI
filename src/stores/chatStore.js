/**
 * Chat Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { sendMessage, getChatHistory, clearChatHistory } from '../../services/aiChat.js'
import { useProfileStore } from './profileStore.js'
import { KEYS } from '../../storage/storageAdapter.js'

export const useChatStore = defineStore('chat', () => {
  const messages = ref(getChatHistory())
  const isLoading = ref(false)
  const lastError = ref(null)
  const profileStore = useProfileStore()
  const apiKey = computed(() => profileStore.profile?.preferences?.apiKey || '')

  const hasMessages = computed(() => messages.value.length > 0)

  async function send(text) {
    if (!text.trim()) return
    isLoading.value = true
    lastError.value = null
    try {
      console.log('[Chat] Sending:', text, 'with API key:', apiKey.value ? 'yes' : 'no')
      await sendMessage(text, apiKey.value || null)
      messages.value = getChatHistory()
      const profileStore = useProfileStore()
      profileStore.refresh()
    } catch (err) {
      console.error('[Chat] Error:', err)
      lastError.value = err.message
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

  // Reactive storage listener
  if (typeof window !== 'undefined') {
    window.addEventListener('sf_storage_updated', (e) => {
      if (e.detail.key === KEYS.CHAT_HISTORY) {
        messages.value = e.detail.newValue || []
      }
    })
  }

  return { messages, isLoading, lastError, apiKey, hasMessages, send, clear, setApiKey }
})

/**
 * Profile Store (Pinia)
 */
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getProfile, updateProfile, resetProfile, getProfileSummary } from '../../profile/profileManager.js'

export const useProfileStore = defineStore('profile', () => {
  const profile = ref(getProfile())

  const frictionTolerance = computed(() => profile.value.behavior?.frictionTolerance || 2)
  const brainrotRate = computed(() => Math.round((profile.value.behavior?.brainrotRate || 0) * 100))
  const tone = computed(() => profile.value.preferences?.tone || 'balanced')
  const summary = computed(() => getProfileSummary())

  function refresh() { profile.value = getProfile() }
  function update(updates) { profile.value = updateProfile(updates) }
  function reset() { profile.value = resetProfile() }
  function setPreference(key, value) {
    profile.value = updateProfile({ preferences: { [key]: value } })
  }

  return { profile, frictionTolerance, brainrotRate, tone, summary, refresh, update, reset, setPreference }
})

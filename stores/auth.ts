import { defineStore } from 'pinia'
import type { AppUser } from '~/types'

export const useAuthStore = defineStore('auth', () => {
  const user  = ref<AppUser | null>(null)
  const ready = ref(false)   // true once Firebase has resolved the initial auth state

  const isLoggedIn    = computed(() => !!user.value)
  const householdId   = computed(() => user.value?.householdId ?? null)
  const displayName   = computed(() => user.value?.displayName ?? '')

  function setUser(data: AppUser) {
    user.value = data
  }

  function clearUser() {
    user.value = null
  }

  function setReady(val: boolean) {
    ready.value = val
  }

  return {
    user,
    ready,
    isLoggedIn,
    householdId,
    displayName,
    setUser,
    clearUser,
    setReady,
  }
})

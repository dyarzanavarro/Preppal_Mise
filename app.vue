<script setup lang="ts">
// Initialise auth listener once at the app root.
// This runs client-side only thanks to the .client plugin pattern.
const { initAuthListener } = useAuth()
const authStore = useAuthStore()
const router    = useRouter()

onMounted(() => {
  initAuthListener()
})

// Redirect root → planner once auth is ready
watch(
  [() => authStore.ready, () => authStore.isLoggedIn],
  ([ready, loggedIn]) => {
    if (!ready) return
    if (loggedIn && useRoute().path === '/') {
      router.replace('/planner')
    }
  },
  { immediate: true },
)
</script>

<template>
  <NuxtLayout>
    <NuxtPage />
  </NuxtLayout>
</template>

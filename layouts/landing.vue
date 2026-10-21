<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <header class="sticky top-0 z-40 glass border-b border-line">
      <div class="mx-auto max-w-6xl px-4 md:px-8 h-14 flex items-center justify-between">
        <NuxtLink to="/" class="text-lg font-semibold tracking-tight">Mise</NuxtLink>
        <div class="flex items-center gap-2">
          <NuxtLink v-if="authStore.isLoggedIn" to="/planner" class="btn-primary btn-sm">Open app</NuxtLink>
          <template v-else>
            <NuxtLink to="/auth/login" class="btn btn-sm hidden sm:inline-flex">Sign in</NuxtLink>
            <NuxtLink to="/auth/register" class="btn-primary btn-sm">Get started</NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <footer class="mt-auto border-t border-line">
      <div class="mx-auto max-w-6xl px-4 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-sm text-ink-2">
        <p><span class="font-semibold text-ink">Mise</span> · Household meal planning</p>
        <div class="flex gap-5">
          <NuxtLink to="/auth/register" class="hover:text-ink transition-colors">Get started</NuxtLink>
          <NuxtLink to="/auth/login" class="hover:text-ink transition-colors">Sign in</NuxtLink>
        </div>
        <p>© {{ new Date().getFullYear() }} Mise</p>
      </div>
    </footer>
  </div>
</template>

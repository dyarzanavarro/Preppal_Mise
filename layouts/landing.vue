<script setup lang="ts">
const authStore = useAuthStore()
</script>

<template>
  <div class="min-h-screen flex flex-col">
    <!-- Minimal public nav -->
    <header class="sticky top-0 z-40 border-b-2 border-ink bg-cream">
      <div class="mx-auto max-w-7xl px-4 md:px-8 py-3 flex items-end justify-between">
        <NuxtLink to="/" class="group">
          <p class="poster-subtitle text-[10px] md:text-xs">Meal Planning System</p>
          <p class="font-display text-3xl md:text-5xl leading-none">MISE</p>
        </NuxtLink>

        <div class="flex items-center gap-2">
          <NuxtLink
            v-if="authStore.isLoggedIn"
            to="/planner"
            class="brutalist-btn-red text-sm">
            Open app
          </NuxtLink>
          <template v-else>
            <NuxtLink to="/auth/login" class="brutalist-btn text-sm hidden sm:inline-flex">Sign in</NuxtLink>
            <NuxtLink to="/auth/register" class="brutalist-btn-red text-sm">Get started</NuxtLink>
          </template>
        </div>
      </div>
    </header>

    <main class="flex-1">
      <slot />
    </main>

    <!-- Footer -->
    <footer class="border-t-2 border-ink bg-cream mt-auto">
      <div class="mx-auto max-w-7xl px-4 md:px-8 py-8 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <p class="font-display text-2xl leading-none">MISE</p>
          <p class="text-xs uppercase tracking-[0.08em] text-ink/50 mt-1">Meal Planning System</p>
        </div>
        <div class="flex gap-4 text-xs uppercase tracking-[0.08em]">
          <NuxtLink to="/auth/register" class="hover:text-brand-500 transition-colors">Get started free</NuxtLink>
          <NuxtLink to="/auth/login" class="hover:text-brand-500 transition-colors">Sign in</NuxtLink>
        </div>
        <p class="text-xs uppercase tracking-[0.08em] text-ink/40">
          © {{ new Date().getFullYear() }} Mise
        </p>
      </div>
    </footer>
  </div>
</template>

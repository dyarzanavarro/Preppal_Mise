<script setup lang="ts">
const authStore    = useAuthStore()
const recipesStore = useRecipesStore()
const plannerStore = usePlannerStore()
const { logout }   = useAuth()
const route        = useRoute()

// Subscribe to shared data once at layout level so the Firestore listeners
// stay alive as the user navigates between pages.  Each page no longer needs
// to manage its own subscriptions (and tear them down on unmount).
watch(
  () => authStore.householdId,
  (id) => {
    if (id) {
      recipesStore.subscribe(id)
      plannerStore.subscribe(id, plannerStore.currentWeekStart)
    } else {
      recipesStore.unsubscribeAll()
      plannerStore.unsubscribeAll()
    }
  },
  { immediate: true },
)

const NAV_ITEMS = [
  { to: '/planner',            label: 'Planner' },
  { to: '/recipes',            label: 'Recipes' },
  { to: '/shopping',           label: 'Shopping' },
  { to: '/household/settings', label: 'Household' },
]

function isActive(path: string) {
  return route.path.startsWith(path)
}
</script>

<template>
  <div class="min-h-screen pb-24 md:pb-0">
    <header class="sticky top-0 z-40 border-b-2 border-ink bg-cream">
      <div class="mx-auto max-w-7xl px-4 md:px-8 py-3 grid-12 items-end">
        <NuxtLink to="/planner" class="col-span-6 md:col-span-4">
          <p class="poster-subtitle text-xs md:text-sm">Meal Planning System</p>
          <p class="font-display text-4xl md:text-6xl leading-none">MISE</p>
        </NuxtLink>

        <nav class="hidden md:flex col-span-5 items-center justify-center gap-2">
          <NuxtLink
            v-for="item in NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            class="brutalist-btn text-sm"
            :class="isActive(item.to)
              ? '-translate-x-[2px] -translate-y-[2px] shadow-[4px_4px_0_#111111] bg-brand-500 text-ink'
              : 'text-ink'">
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="col-span-6 md:col-span-3 justify-self-end flex items-center gap-2">
          <span class="hidden md:inline text-xs uppercase tracking-[0.08em]">{{ authStore.displayName }}</span>
          <button @click="logout" class="brutalist-btn text-sm">Sign out</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-7xl px-4 md:px-8 py-6">
      <slot />
    </main>

    <nav class="md:hidden fixed bottom-0 inset-x-0 border-t-2 border-ink bg-cream z-40 flex items-stretch"
      style="padding-bottom: env(safe-area-inset-bottom)">
      <NuxtLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="flex-1 text-center py-3 font-display uppercase border-r-2 border-ink last:border-r-0 text-ink"
        :class="isActive(item.to) ? 'bg-brand-500 text-ink shadow-[inset_0_-4px_0_#111111]' : ''">
        {{ item.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

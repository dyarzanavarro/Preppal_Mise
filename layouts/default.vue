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
    <header class="sticky top-0 z-40 glass border-b border-line">
      <div class="mx-auto max-w-6xl px-4 md:px-8 h-14 flex items-center justify-between gap-4">
        <NuxtLink to="/planner" class="text-lg font-semibold tracking-tight">Mise</NuxtLink>

        <nav class="hidden md:flex items-center gap-1 rounded-full bg-ink/[0.06] p-1">
          <NuxtLink
            v-for="item in NAV_ITEMS"
            :key="item.to"
            :to="item.to"
            class="rounded-full px-4 py-1.5 text-sm font-medium transition"
            :class="isActive(item.to) ? 'bg-surface text-ink shadow-sm' : 'text-ink-2 hover:text-ink'">
            {{ item.label }}
          </NuxtLink>
        </nav>

        <div class="flex items-center gap-3">
          <span class="hidden md:inline text-sm text-ink-2">{{ authStore.displayName }}</span>
          <button @click="logout" class="btn btn-sm">Sign out</button>
        </div>
      </div>
    </header>

    <main class="mx-auto max-w-6xl px-4 md:px-8 py-8">
      <slot />
    </main>

    <nav class="md:hidden fixed bottom-0 inset-x-0 z-40 glass border-t border-line flex items-stretch"
      style="padding-bottom: env(safe-area-inset-bottom)">
      <NuxtLink
        v-for="item in NAV_ITEMS"
        :key="item.to"
        :to="item.to"
        class="flex-1 text-center py-3 text-[11px] font-medium transition"
        :class="isActive(item.to) ? 'text-accent' : 'text-ink-2'">
        {{ item.label }}
      </NuxtLink>
    </nav>
  </div>
</template>

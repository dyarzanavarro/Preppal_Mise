<script setup lang="ts">
import type { Household } from '~/types'

definePageMeta({ middleware: 'auth' })

const authStore = useAuthStore()
const { getHousehold, regenerateInviteCode } = useHousehold()

const household    = ref<Household | null>(null)
const loading      = ref(true)
const copied       = ref(false)
const regenerating = ref(false)
const error        = ref('')

onMounted(async () => {
  if (authStore.householdId) {
    household.value = await getHousehold(authStore.householdId)
  }
  loading.value = false
})

async function copyCode() {
  if (!household.value) return
  try {
    await navigator.clipboard.writeText(household.value.inviteCode)
    copied.value = true
    setTimeout(() => (copied.value = false), 2000)
  } catch {
    // fallback: select the text element
  }
}

async function handleRegenerate() {
  if (!household.value || !authStore.householdId) return
  error.value = ''
  regenerating.value = true
  try {
    const newCode = await regenerateInviteCode(authStore.householdId)
    household.value = { ...household.value, inviteCode: newCode }
  } catch (e: any) {
    error.value = e.message
  } finally {
    regenerating.value = false
  }
}
</script>

<template>
  <div class="space-y-8">
    <!-- Header -->
    <div>
      <p class="editorial-kicker mb-2">Household</p>
      <h1 class="poster-title">{{ household?.name ?? 'Settings' }}</h1>
    </div>

    <!-- Loading -->
    <div v-if="loading" class="brutalist-card p-6 text-sm uppercase tracking-[0.08em]">
      Loading…
    </div>

    <template v-else-if="household">
      <!-- Invite code card -->
      <section class="brutalist-card bg-[color:var(--paper)] p-6 md:p-8 space-y-4">
        <div>
          <p class="editorial-kicker mb-1">Invite Code</p>
          <p class="text-sm uppercase tracking-[0.08em] text-ink/60">
            Share this code with anyone you want to add to <strong>{{ household.name }}</strong>.
            They enter it on the household setup screen after registering.
          </p>
        </div>

        <!-- Big code display -->
        <div class="border-2 border-ink bg-cream flex items-center justify-between px-4 py-3 gap-4">
          <span class="font-display text-5xl md:text-7xl tracking-[0.15em] leading-none select-all">
            {{ household.inviteCode }}
          </span>
          <button
            @click="copyCode"
            class="brutalist-btn shrink-0 transition-colors"
            :class="copied ? 'bg-brand-500 text-ink' : ''">
            {{ copied ? 'Copied!' : 'Copy' }}
          </button>
        </div>

        <!-- Members -->
        <p class="text-xs uppercase tracking-[0.08em] text-ink/50">
          {{ household.members.length }} member{{ household.members.length === 1 ? '' : 's' }} in this household
        </p>

        <!-- Regenerate -->
        <div class="border-t-2 border-ink pt-4 space-y-2">
          <p class="text-xs uppercase tracking-[0.08em] text-ink/60">
            If your code was shared accidentally, you can regenerate it. Existing members won't be affected.
          </p>
          <p v-if="error" class="border-2 border-ink bg-brand-500 text-ink px-3 py-2 text-sm">{{ error }}</p>
          <button
            @click="handleRegenerate"
            :disabled="regenerating"
            class="brutalist-btn text-sm disabled:opacity-50">
            {{ regenerating ? 'Regenerating…' : 'Regenerate code' }}
          </button>
        </div>
      </section>

      <!-- How to invite -->
      <section class="brutalist-card bg-[color:var(--paper)] p-6 space-y-3">
        <p class="editorial-kicker">How it works</p>
        <ol class="space-y-2 text-sm">
          <li class="flex gap-3">
            <span class="font-display text-xl leading-none shrink-0">1.</span>
            <span class="uppercase tracking-[0.08em]">Your housemate creates an account at this app</span>
          </li>
          <li class="flex gap-3">
            <span class="font-display text-xl leading-none shrink-0">2.</span>
            <span class="uppercase tracking-[0.08em]">On the household setup screen, they choose <strong>Join household</strong></span>
          </li>
          <li class="flex gap-3">
            <span class="font-display text-xl leading-none shrink-0">3.</span>
            <span class="uppercase tracking-[0.08em]">They enter your 6-character code above</span>
          </li>
          <li class="flex gap-3">
            <span class="font-display text-xl leading-none shrink-0">4.</span>
            <span class="uppercase tracking-[0.08em]">They'll share your planner, recipes and shopping list instantly</span>
          </li>
        </ol>
      </section>
    </template>

    <!-- No household (edge case) -->
    <div v-else class="brutalist-card p-6 space-y-4">
      <p class="text-sm uppercase tracking-[0.08em]">You're not part of a household yet.</p>
      <NuxtLink to="/household/setup" class="brutalist-btn-red inline-block">Set up household</NuxtLink>
    </div>
  </div>
</template>


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
  <div class="mx-auto max-w-2xl space-y-8">
    <h1 class="title-page">{{ household?.name ?? 'Household' }}</h1>

    <div v-if="loading" class="card p-8 text-center text-ink-2">Loading…</div>

    <template v-else-if="household">
      <!-- Invite code -->
      <section class="card space-y-5 p-6 md:p-8">
        <div>
          <h2 class="title-section">Invite code</h2>
          <p class="mt-1 text-sm text-ink-2">
            Share this code with anyone you want to add to <strong class="text-ink">{{ household.name }}</strong>.
            They enter it on the household setup screen after registering.
          </p>
        </div>

        <div class="flex items-center justify-between gap-4 rounded-2xl bg-ink/[0.04] px-5 py-4">
          <span class="select-all font-mono text-3xl font-semibold tracking-[0.18em] md:text-4xl">{{ household.inviteCode }}</span>
          <button @click="copyCode" class="shrink-0" :class="copied ? 'btn-primary' : 'btn'">
            {{ copied ? 'Copied' : 'Copy' }}
          </button>
        </div>

        <p class="text-sm text-ink-2">
          {{ household.members.length }} member{{ household.members.length === 1 ? '' : 's' }} in this household
        </p>

        <div class="space-y-3 border-t border-line pt-5">
          <p class="text-sm text-ink-2">
            If your code was shared accidentally, you can regenerate it. Existing members won't be affected.
          </p>
          <p v-if="error" class="rounded-xl bg-danger/10 px-3.5 py-2.5 text-sm text-danger">{{ error }}</p>
          <button @click="handleRegenerate" :disabled="regenerating" class="btn">
            {{ regenerating ? 'Regenerating…' : 'Regenerate code' }}
          </button>
        </div>
      </section>

      <!-- How to invite -->
      <section class="card space-y-4 p-6 md:p-8">
        <h2 class="title-section">How inviting works</h2>
        <ol class="space-y-3 text-[15px]">
          <li v-for="(step, i) in [
            'Your housemate creates an account in this app.',
            'On the household setup screen they choose Join household.',
            'They enter your 6-character code above.',
            'They share your planner, recipes and shopping list instantly.',
          ]" :key="i" class="flex gap-3">
            <span class="grid h-6 w-6 shrink-0 place-items-center rounded-full bg-accent/10 text-xs font-semibold text-accent">{{ i + 1 }}</span>
            <span class="pt-0.5">{{ step }}</span>
          </li>
        </ol>
      </section>
    </template>

    <div v-else class="card space-y-4 p-6">
      <p class="text-ink-2">You're not part of a household yet.</p>
      <NuxtLink to="/household/setup" class="btn-primary">Set up household</NuxtLink>
    </div>
  </div>
</template>

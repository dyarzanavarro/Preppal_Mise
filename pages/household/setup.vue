<script setup lang="ts">
definePageMeta({ middleware: 'auth' })

const { createHousehold, joinHousehold } = useHousehold()
const router = useRouter()

type Mode = 'choose' | 'create' | 'join'
const mode = ref<Mode>('choose')
const error = ref('')
const loading = ref(false)

const householdName = ref('')
const inviteCode = ref('')

async function handleCreate() {
  if (!householdName.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await createHousehold(householdName.value.trim())
    await router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}

async function handleJoin() {
  if (!inviteCode.value.trim()) return
  error.value = ''
  loading.value = true
  try {
    await joinHousehold(inviteCode.value.trim())
    await router.push('/')
  } catch (e: any) {
    error.value = e.message
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4">
    <div class="w-full max-w-xl brutalist-card bg-[color:var(--paper)] p-6 md:p-8 space-y-6">
      <div>
        <p class="editorial-kicker mb-3">Household Setup</p>
        <h1 class="poster-title">Home Base</h1>
      </div>

      <template v-if="mode === 'choose'">
        <p class="text-sm uppercase tracking-[0.08em]">Create a new household or join with an invite code.</p>
        <div class="flex flex-wrap gap-2">
          <button @click="mode = 'create'" class="brutalist-btn-red">Create household</button>
          <button @click="mode = 'join'" class="brutalist-btn">Join household</button>
        </div>
      </template>

      <template v-else-if="mode === 'create'">
        <div class="flex gap-2">
          <button @click="mode = 'choose'" class="brutalist-btn text-xs px-2 py-1">Back</button>
          <h2 class="font-display text-4xl">Create</h2>
        </div>
        <p v-if="error" class="border-2 border-ink bg-brand-500 text-ink px-3 py-2 text-sm">{{ error }}</p>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <input v-model="householdName" type="text" required placeholder="Household name" class="brutalist-input" />
          <button type="submit" :disabled="loading" class="w-full brutalist-btn-red disabled:opacity-60">
            {{ loading ? 'Creating...' : 'Create household' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="flex gap-2">
          <button @click="mode = 'choose'" class="brutalist-btn text-xs px-2 py-1">Back</button>
          <h2 class="font-display text-4xl">Join</h2>
        </div>
        <p class="text-sm uppercase tracking-[0.08em]">Enter the 6-character invite code.</p>
        <p v-if="error" class="border-2 border-ink bg-brand-500 text-ink px-3 py-2 text-sm">{{ error }}</p>
        <form class="space-y-4" @submit.prevent="handleJoin">
          <input
            v-model="inviteCode"
            type="text"
            required
            placeholder="ABC123"
            maxlength="6"
            class="brutalist-input text-center tracking-[0.3em] uppercase font-mono" />
          <button type="submit" :disabled="loading" class="w-full brutalist-btn-red disabled:opacity-60">
            {{ loading ? 'Joining...' : 'Join household' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>


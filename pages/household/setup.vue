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
    <div class="w-full max-w-md card p-6 md:p-8 space-y-6">
      <div class="text-center">
        <p class="text-sm font-semibold text-ink-2">Mise</p>
        <h1 class="title-page mt-1">Set up your household</h1>
      </div>

      <template v-if="mode === 'choose'">
        <p class="text-center text-sm text-ink-2">Create a new household or join with an invite code.</p>
        <div class="flex flex-wrap gap-2">
          <button @click="mode = 'create'" class="btn-primary">Create household</button>
          <button @click="mode = 'join'" class="btn">Join household</button>
        </div>
      </template>

      <template v-else-if="mode === 'create'">
        <div class="flex items-center gap-3">
          <button @click="mode = 'choose'" class="btn btn-sm">Back</button>
          <h2 class="title-section">Create</h2>
        </div>
        <p v-if="error" class="rounded-xl bg-danger/10 text-danger px-3.5 py-2.5 text-sm">{{ error }}</p>
        <form class="space-y-4" @submit.prevent="handleCreate">
          <input v-model="householdName" type="text" required placeholder="Household name" class="input" />
          <button type="submit" :disabled="loading" class="w-full btn-primary !py-2.5">
            {{ loading ? 'Creating...' : 'Create household' }}
          </button>
        </form>
      </template>

      <template v-else>
        <div class="flex items-center gap-3">
          <button @click="mode = 'choose'" class="btn btn-sm">Back</button>
          <h2 class="title-section">Join</h2>
        </div>
        <p class="text-sm text-ink-2">Enter the 6-character invite code.</p>
        <p v-if="error" class="rounded-xl bg-danger/10 text-danger px-3.5 py-2.5 text-sm">{{ error }}</p>
        <form class="space-y-4" @submit.prevent="handleJoin">
          <input
            v-model="inviteCode"
            type="text"
            required
            placeholder="ABC123"
            maxlength="6"
            class="input text-center font-mono" />
          <button type="submit" :disabled="loading" class="w-full btn-primary !py-2.5">
            {{ loading ? 'Joining...' : 'Join household' }}
          </button>
        </form>
      </template>
    </div>
  </div>
</template>


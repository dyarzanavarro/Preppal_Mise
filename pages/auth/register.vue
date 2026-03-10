<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { registerEmail, loginGoogle } = useAuth()
const router = useRouter()

const displayName = ref('')
const email = ref('')
const password = ref('')
const confirm = ref('')
const error = ref('')
const loading = ref(false)

async function handleRegister() {
  error.value = ''
  if (password.value !== confirm.value) {
    error.value = 'Passwords do not match.'
    return
  }
  if (password.value.length < 8) {
    error.value = 'Password must be at least 8 characters.'
    return
  }
  loading.value = true
  try {
    await registerEmail(email.value, password.value, displayName.value)
    await router.push('/household/setup')
  } catch (e: any) {
    error.value = e.message ?? 'Registration failed.'
  } finally {
    loading.value = false
  }
}

async function handleGoogle() {
  error.value = ''
  loading.value = true
  try {
    await loginGoogle()
    await router.push('/household/setup')
  } catch (e: any) {
    error.value = e.message ?? 'Google sign-in failed.'
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4">
    <div class="w-full max-w-xl brutalist-card bg-[color:var(--paper)] p-6 md:p-8 space-y-6">
      <div>
        <p class="editorial-kicker mb-3">Meal Planning System</p>
        <h1 class="poster-title">Register</h1>
      </div>

      <p v-if="error" class="border-2 border-ink bg-brand-500 text-ink px-3 py-2 text-sm">{{ error }}</p>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="label">Name</label>
          <input v-model="displayName" type="text" required autocomplete="name" class="brutalist-input" />
        </div>
        <div>
          <label class="label">Email</label>
          <input v-model="email" type="email" required autocomplete="email" class="brutalist-input" />
        </div>
        <div>
          <label class="label">Password</label>
          <input v-model="password" type="password" required autocomplete="new-password" class="brutalist-input" />
        </div>
        <div>
          <label class="label">Confirm</label>
          <input v-model="confirm" type="password" required autocomplete="new-password" class="brutalist-input" />
        </div>
        <button type="submit" :disabled="loading" class="w-full brutalist-btn-red disabled:opacity-60">
          {{ loading ? 'Creating...' : 'Create account' }}
        </button>
      </form>

      <button :disabled="loading" @click="handleGoogle" class="w-full brutalist-btn">Continue with Google</button>

      <p class="text-sm uppercase tracking-[0.08em]">
        Already have an account?
        <NuxtLink to="/auth/login" class="underline">Sign in</NuxtLink>
      </p>

      <NuxtLink to="/" class="block text-xs uppercase tracking-[0.08em] text-ink/40 hover:text-ink transition-colors">
        ← Back to home
      </NuxtLink>
    </div>
  </div>
</template>

<style scoped>
.label { @apply block text-xs font-display uppercase tracking-[0.08em] mb-1; }
</style>


<script setup lang="ts">
definePageMeta({ layout: 'auth' })

const { loginEmail, loginGoogle } = useAuth()
const router = useRouter()

const email = ref('')
const password = ref('')
const error = ref('')
const loading = ref(false)

async function handleEmailLogin() {
  error.value = ''
  loading.value = true
  try {
    await loginEmail(email.value, password.value)
    await router.push('/')
  } catch (e: any) {
    error.value = friendlyFirebaseError(e.code)
  } finally {
    loading.value = false
  }
}

async function handleGoogleLogin() {
  error.value = ''
  loading.value = true
  try {
    await loginGoogle()
    await router.push('/')
  } catch (e: any) {
    error.value = friendlyFirebaseError(e.code)
  } finally {
    loading.value = false
  }
}

function friendlyFirebaseError(code: string): string {
  const map: Record<string, string> = {
    'auth/user-not-found': 'No account found with that email.',
    'auth/wrong-password': 'Incorrect password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/too-many-requests': 'Too many attempts. Please try again later.',
    'auth/popup-closed-by-user': 'Google sign-in was cancelled.',
  }
  return map[code] ?? 'Something went wrong. Please try again.'
}
</script>

<template>
  <div class="min-h-screen grid place-items-center px-4">
    <div class="w-full max-w-xl brutalist-card bg-[color:var(--paper)] p-6 md:p-8 space-y-6">
      <div>
        <p class="editorial-kicker mb-3">Meal Planning System</p>
        <h1 class="poster-title">Sign In</h1>
      </div>

      <p v-if="error" class="border-2 border-ink bg-brand-500 text-white px-3 py-2 text-sm">{{ error }}</p>

      <form class="space-y-4" @submit.prevent="handleEmailLogin">
        <div>
          <label class="label">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="brutalist-input"
          />
        </div>
        <div>
          <label class="label">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="brutalist-input"
          />
        </div>
        <button type="submit" :disabled="loading" class="w-full brutalist-btn-red disabled:opacity-60">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <button :disabled="loading" class="w-full brutalist-btn" @click="handleGoogleLogin">
        Continue with Google
      </button>

      <p class="text-sm uppercase tracking-[0.08em]">
        No account?
        <NuxtLink to="/auth/register" class="underline">Create one</NuxtLink>
      </p>
    </div>
  </div>
</template>

<style scoped>
.label { @apply block text-xs font-display uppercase tracking-[0.08em] mb-1; }
</style>

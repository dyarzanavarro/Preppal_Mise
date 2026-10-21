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
    <div class="w-full max-w-md card p-6 md:p-8 space-y-6">
      <div class="text-center">
        <p class="text-sm font-semibold text-ink-2">Mise</p>
        <h1 class="title-page mt-1">Sign in</h1>
      </div>

      <p v-if="error" class="rounded-xl bg-danger/10 text-danger px-3.5 py-2.5 text-sm">{{ error }}</p>

      <form class="space-y-4" @submit.prevent="handleEmailLogin">
        <div>
          <label class="field-label">Email</label>
          <input
            v-model="email"
            type="email"
            required
            autocomplete="email"
            class="input"
          />
        </div>
        <div>
          <label class="field-label">Password</label>
          <input
            v-model="password"
            type="password"
            required
            autocomplete="current-password"
            class="input"
          />
        </div>
        <button type="submit" :disabled="loading" class="w-full btn-primary !py-2.5">
          {{ loading ? 'Signing in...' : 'Sign in' }}
        </button>
      </form>

      <button :disabled="loading" class="w-full btn !py-2.5" @click="handleGoogleLogin">
        Continue with Google
      </button>

      <p class="text-center text-sm text-ink-2">
        No account?
        <NuxtLink to="/auth/register" class="link">Create one</NuxtLink>
      </p>

      <NuxtLink to="/" class="block text-center text-xs text-ink-2 hover:text-ink transition-colors">
        Back to home
      </NuxtLink>
    </div>
  </div>
</template>



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
    <div class="w-full max-w-md card p-6 md:p-8 space-y-6">
      <div class="text-center">
        <p class="text-sm font-semibold text-ink-2">Mise</p>
        <h1 class="title-page mt-1">Register</h1>
      </div>

      <p v-if="error" class="rounded-xl bg-danger/10 text-danger px-3.5 py-2.5 text-sm">{{ error }}</p>

      <form class="space-y-4" @submit.prevent="handleRegister">
        <div>
          <label class="field-label">Name</label>
          <input v-model="displayName" type="text" required autocomplete="name" class="input" />
        </div>
        <div>
          <label class="field-label">Email</label>
          <input v-model="email" type="email" required autocomplete="email" class="input" />
        </div>
        <div>
          <label class="field-label">Password</label>
          <input v-model="password" type="password" required autocomplete="new-password" class="input" />
        </div>
        <div>
          <label class="field-label">Confirm</label>
          <input v-model="confirm" type="password" required autocomplete="new-password" class="input" />
        </div>
        <button type="submit" :disabled="loading" class="w-full btn-primary !py-2.5">
          {{ loading ? 'Creating...' : 'Create account' }}
        </button>
      </form>

      <button :disabled="loading" @click="handleGoogle" class="w-full btn !py-2.5">Continue with Google</button>

      <p class="text-center text-sm text-ink-2">
        Already have an account?
        <NuxtLink to="/auth/login" class="link">Sign in</NuxtLink>
      </p>

      <NuxtLink to="/" class="block text-center text-xs text-ink-2 hover:text-ink transition-colors">
        Back to home
      </NuxtLink>
    </div>
  </div>
</template>



/**
 * Redirect unauthenticated users to /auth/login.
 * Applied globally — pages that don't require auth should use definePageMeta({ auth: false }).
 */
export default defineNuxtRouteMiddleware((to) => {
  // Skip middleware on the server side (Firebase Auth is client-only)
  if (import.meta.server) return

  const authStore = useAuthStore()

  // Wait until Firebase has resolved auth state before redirecting
  if (!authStore.ready) return

  const publicRoutes = ['/', '/auth/login', '/auth/register']
  if (!authStore.isLoggedIn && !publicRoutes.includes(to.path)) {
    return navigateTo('/auth/login')
  }

  // Logged-in user without a household should be sent to setup
  if (
    authStore.isLoggedIn &&
    !authStore.householdId &&
    !to.path.startsWith('/household') &&
    !publicRoutes.includes(to.path)
  ) {
    return navigateTo('/household/setup')
  }
})

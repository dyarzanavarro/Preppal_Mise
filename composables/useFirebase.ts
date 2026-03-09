/**
 * Thin wrapper so components can grab the Firebase services
 * injected by the plugin without repeating useNuxtApp() boilerplate.
 */
export function useFirebase() {
  const { $auth, $db } = useNuxtApp()
  return { auth: $auth, db: $db }
}

import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  signOut,
  onAuthStateChanged,
  updateProfile,
  type User,
} from 'firebase/auth'
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from 'firebase/firestore'
import { useAuthStore } from '~/stores/auth'

export function useAuth() {
  const { auth, db } = useFirebase()
  const authStore     = useAuthStore()
  const router        = useRouter()

  // ── helpers ──────────────────────────────────────────────────────────────

  async function syncUserDoc(user: User) {
    const ref  = doc(db, 'users', user.uid)
    let   snap = await getDoc(ref)

    if (!snap.exists()) {
      // New user — create the doc, then re-fetch once (to get server timestamps)
      await setDoc(ref, {
        uid:         user.uid,
        email:       user.email,
        displayName: user.displayName ?? user.email?.split('@')[0] ?? 'User',
        householdId: null,
        createdAt:   serverTimestamp(),
      })
      snap = await getDoc(ref)
    }

    // Existing user: use the snapshot we already have (no second round-trip)
    authStore.setUser(snap.data() as any)
  }

  // ── auth actions ─────────────────────────────────────────────────────────

  async function registerEmail(email: string, password: string, displayName: string) {
    const cred = await createUserWithEmailAndPassword(auth, email, password)
    await updateProfile(cred.user, { displayName })
    await syncUserDoc(cred.user)
    return cred.user
  }

  async function loginEmail(email: string, password: string) {
    const cred = await signInWithEmailAndPassword(auth, email, password)
    await syncUserDoc(cred.user)
    return cred.user
  }

  async function loginGoogle() {
    const provider = new GoogleAuthProvider()
    const cred = await signInWithPopup(auth, provider)
    await syncUserDoc(cred.user)
    return cred.user
  }

  async function logout() {
    await signOut(auth)
    authStore.clearUser()
    await router.push('/auth/login')
  }

  // ── auth state listener — call once in app.vue ───────────────────────────

  function initAuthListener() {
    onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        await syncUserDoc(firebaseUser)
      } else {
        authStore.clearUser()
      }
      authStore.setReady(true)
    })
  }

  return {
    registerEmail,
    loginEmail,
    loginGoogle,
    logout,
    initAuthListener,
  }
}

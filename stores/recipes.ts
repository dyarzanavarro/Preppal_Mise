import { defineStore } from 'pinia'
import {
  collection,
  query,
  where,
  orderBy,
  onSnapshot,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  serverTimestamp,
  type Unsubscribe,
} from 'firebase/firestore'
import type { Recipe, RecipeFormData } from '~/types'

export const useRecipesStore = defineStore('recipes', () => {
  const { db }    = useFirebase()
  const authStore = useAuthStore()

  const recipes    = ref<Recipe[]>([])
  const loading    = ref(false)
  let   unsubscribe: Unsubscribe | null = null

  // ── subscribe to household recipes ──────────────────────────────────────

  function subscribe(householdId: string) {
    unsubscribe?.()
    loading.value = true

    const q = query(
      collection(db, 'recipes'),
      where('householdId', '==', householdId),
      orderBy('createdAt', 'desc'),
    )

    unsubscribe = onSnapshot(q, (snap) => {
      recipes.value = snap.docs.map((d) => ({ id: d.id, ...d.data() } as Recipe))
      loading.value = false
    })
  }

  function unsubscribeAll() {
    unsubscribe?.()
    unsubscribe = null
    recipes.value = []
  }

  // ── CRUD ─────────────────────────────────────────────────────────────────

  /** Firestore rejects `undefined` field values — strip them before every write */
  function clean<T extends object>(obj: T): Partial<T> {
    return Object.fromEntries(
      Object.entries(obj).filter(([, v]) => v !== undefined),
    ) as Partial<T>
  }

  async function addRecipe(data: RecipeFormData) {
    const householdId = authStore.householdId
    if (!householdId) throw new Error('No household')

    await addDoc(collection(db, 'recipes'), {
      ...clean(data),
      householdId,
      addedBy:   authStore.user!.uid,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }

  async function updateRecipe(id: string, data: Partial<RecipeFormData>) {
    await updateDoc(doc(db, 'recipes', id), {
      ...clean(data),
      updatedAt: serverTimestamp(),
    })
  }

  async function deleteRecipe(id: string) {
    await deleteDoc(doc(db, 'recipes', id))
  }

  // ── helpers ───────────────────────────────────────────────────────────────

  const allTags = computed(() => {
    const tagSet = new Set<string>()
    recipes.value.forEach((r) => r.tags.forEach((t) => tagSet.add(t)))
    return [...tagSet].sort()
  })

  function getById(id: string): Recipe | undefined {
    return recipes.value.find((r) => r.id === id)
  }

  return {
    recipes,
    loading,
    allTags,
    subscribe,
    unsubscribeAll,
    addRecipe,
    updateRecipe,
    deleteRecipe,
    getById,
  }
})

import { collection, doc, getDocs, setDoc } from 'firebase/firestore'
import { pinKey, type Pin } from '~/coop/match'

/** Household-shared "always buy this product for this ingredient" choices: households/{id}/skuPrefs/{key} */
export function useCoopPins() {
  const { db } = useFirebase()
  const auth = useAuthStore()

  async function load(): Promise<Record<string, Pin>> {
    if (!auth.householdId) return {}
    // Pins are a convenience: never let a slow or offline Firestore block the Coop flow.
    const timeout = new Promise<null>((resolve) => setTimeout(() => resolve(null), 4000))
    const snap = await Promise.race([getDocs(collection(db, 'households', auth.householdId, 'skuPrefs')), timeout])
    const pins: Record<string, Pin> = {}
    snap?.forEach((d) => { pins[decodeURIComponent(d.id)] = d.data() as Pin })
    return pins
  }

  async function save(ingredient: string, pin: Pin) {
    if (!auth.householdId) return
    await setDoc(doc(db, 'households', auth.householdId, 'skuPrefs', encodeURIComponent(pinKey(ingredient))), pin)
  }

  return { load, save }
}

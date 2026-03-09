import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  serverTimestamp,
} from 'firebase/firestore'
import type { Household } from '~/types'

function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no O,0,I,1 to avoid confusion
  return Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join('')
}

export function useHousehold() {
  const { db }    = useFirebase()
  const authStore = useAuthStore()

  async function createHousehold(name: string): Promise<Household> {
    const uid  = authStore.user!.uid
    const id   = doc(collection(db, 'households')).id
    const code = generateInviteCode()

    const household: Omit<Household, 'id'> = {
      name,
      members:    [uid],
      inviteCode: code,
      createdAt:  serverTimestamp() as any,
      createdBy:  uid,
    }

    await setDoc(doc(db, 'households', id), household)

    // Link user → household
    await updateDoc(doc(db, 'users', uid), { householdId: id })
    authStore.setUser({ ...authStore.user!, householdId: id })

    return { id, ...household } as Household
  }

  async function joinHousehold(inviteCode: string): Promise<Household> {
    const uid = authStore.user!.uid
    const q   = query(
      collection(db, 'households'),
      where('inviteCode', '==', inviteCode.toUpperCase().trim()),
    )
    const snap = await getDocs(q)
    if (snap.empty) throw new Error('Invalid invite code — no household found.')

    const householdDoc = snap.docs[0]
    const data = householdDoc.data() as Omit<Household, 'id'>

    // Add user to members if not already there
    const members = Array.from(new Set([...data.members, uid]))
    await updateDoc(doc(db, 'households', householdDoc.id), { members })

    // Link user → household
    await updateDoc(doc(db, 'users', uid), { householdId: householdDoc.id })
    authStore.setUser({ ...authStore.user!, householdId: householdDoc.id })

    return { id: householdDoc.id, ...data, members }
  }

  async function getHousehold(id: string): Promise<Household | null> {
    const snap = await getDoc(doc(db, 'households', id))
    if (!snap.exists()) return null
    return { id: snap.id, ...snap.data() } as Household
  }

  return { createHousehold, joinHousehold, getHousehold }
}

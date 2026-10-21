import { CoopNotConnected } from '~/coop/session'

/** GET /api/coop/status -> whether the shared Chrome is reachable and logged in to coop.ch */
export default defineEventHandler(async () => {
  try {
    const s = await getCoop()
    return { connected: true, loggedIn: await s.isLoggedIn() }
  } catch (e: any) {
    return { connected: false, loggedIn: false, hint: e?.message }
  }
})

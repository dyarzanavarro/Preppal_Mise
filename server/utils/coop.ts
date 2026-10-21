import { CoopNotConnected, CoopSession } from '~/coop/session'

let session: Promise<CoopSession> | null = null

/** One shared CDP connection per server process; reconnects if Chrome was restarted. */
export async function getCoop(): Promise<CoopSession> {
  try {
    const s = session ? await session : null
    if (s?.connected) return s
    session = CoopSession.connect()
    return await session
  } catch (e) {
    session = null
    if (e instanceof CoopNotConnected) throw createError({ statusCode: 503, statusMessage: 'Coop not connected', message: e.message })
    throw e
  }
}

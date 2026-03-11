import path from 'node:path'

/**
 * Persistent Playwright browser profile directory.
 * Stores Coop / Supercard ID session cookies so add-to-cart works
 * without re-logging in on every request.
 *
 * One-time setup: GET /api/coop/setup
 */
export const COOP_PROFILE_DIR = path.join(process.cwd(), '.playwright-coop-profile')

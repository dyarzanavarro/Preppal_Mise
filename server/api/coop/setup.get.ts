/**
 * GET /api/coop/setup
 *
 * One-time manual login flow for Coop / Supercard ID.
 * Run this once from your browser: http://localhost:3000/api/coop/setup
 *
 * What happens:
 *   1. A real Chrome window opens on your screen.
 *   2. It navigates to coop.ch and tries to open the login modal.
 *   3. Complete the CAPTCHA and log in with your Supercard ID.
 *   4. Once you're back on coop.ch, this endpoint saves the session and returns.
 *
 * After that, POST /api/coop/add-to-cart works headlessly with no login prompt.
 * Re-run this endpoint if the session expires (typically every few weeks).
 */

import { chromium } from 'playwright'
import { COOP_PROFILE_DIR } from '~/server/utils/coopProfile'

export default defineEventHandler(async () => {
  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null

  try {
    console.log('[coop/setup] Launching browser…')
    context = await chromium.launchPersistentContext(COOP_PROFILE_DIR, {
      headless:  false,
      args:      ['--no-sandbox', '--disable-setuid-sandbox'],
      locale:    'en-CH',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
      viewport:  { width: 1280, height: 800 },
    })

    const page = await context.newPage()

    // ── 1. Load coop.ch ────────────────────────────────────────────────────
    console.log('[coop/setup] Navigating to coop.ch…')
    await page.goto('https://www.coop.ch/en/', { waitUntil: 'load', timeout: 40_000 })

    // Accept cookie banner if it appears
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { state: 'visible', timeout: 6_000 })
      await page.click('#onetrust-accept-btn-handler')
      await page.waitForTimeout(600)
    } catch { /* no banner */ }

    // ── 2. Try to open the login modal ────────────────────────────────────
    try {
      await page.waitForSelector('a[data-testauto="login"]', { state: 'visible', timeout: 10_000 })
      await page.click('a[data-testauto="login"]')
      console.log('[coop/setup] Login modal opened — click "Supercard ID login" in the browser window.')
    } catch {
      console.log('[coop/setup] Could not auto-open modal. Click "Log in" manually in the browser window.')
    }

    // ── 3. Wait for user to reach login.supercard.ch ──────────────────────
    // (they click "Supercard ID login" → CAPTCHA → fill credentials)
    console.log('[coop/setup] Waiting for Supercard login page (you have 3 minutes)…')
    try {
      await page.waitForURL('https://login.supercard.ch/**', { timeout: 3 * 60_000 })
      console.log('[coop/setup] On Supercard — complete the CAPTCHA and enter your credentials.')
    } catch {
      return {
        success: false,
        message: 'Did not reach login.supercard.ch within 3 minutes. Make sure you click "Supercard ID login" in the browser window.',
      }
    }

    // ── 4. Wait for OAuth2 callback → land back on coop.ch ────────────────
    console.log('[coop/setup] Waiting for login to complete (you have 3 minutes)…')
    try {
      await page.waitForURL('https://*.coop.ch/**', { timeout: 3 * 60_000 })
      console.log('[coop/setup] Back on coop.ch — verifying session…')
    } catch {
      return {
        success: false,
        message: 'Did not return to coop.ch after Supercard login within 3 minutes.',
      }
    }

    // ── 5. Verify login link is gone (session is active) ─────────────────
    await page.waitForTimeout(1_500)
    const loginStillVisible = await page
      .locator('a[data-testauto="login"]')
      .isVisible()
      .catch(() => false)

    if (loginStillVisible) {
      return {
        success: false,
        message: 'Login may not have completed — the login link is still visible. Please try again.',
      }
    }

    // ── 6. Seed coopathome.ch cookies while session is hot ────────────────
    console.log('[coop/setup] Seeding coopathome.ch session…')
    await page.goto('https://www.coopathome.ch', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    try {
      await page.waitForSelector('#onetrust-accept-btn-handler', { state: 'visible', timeout: 5_000 })
      await page.click('#onetrust-accept-btn-handler')
    } catch { /* no banner */ }

    console.log('[coop/setup] ✓ Session saved to', COOP_PROFILE_DIR)
    return {
      success: true,
      message: 'Coop session saved. POST /api/coop/add-to-cart will now work headlessly. Re-run this endpoint if it stops working (sessions expire after a few weeks).',
    }
  } catch (err: any) {
    console.error('[coop/setup] Error:', err?.message)
    throw createError({ statusCode: 500, message: err?.message ?? 'Setup failed' })
  } finally {
    await context?.close()
  }
})

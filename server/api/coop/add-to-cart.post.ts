/**
 * POST /api/coop/add-to-cart
 *
 * Automates Coop at Home (coopathome.ch) via Playwright using a persisted
 * browser session.  No login happens here — session cookies are saved by the
 * one-time setup endpoint.
 *
 * ⚠  One-time setup (run once in your browser):
 *     GET http://localhost:3000/api/coop/setup
 *     A Chrome window opens → log in with Supercard ID → session is saved.
 *
 * ⚠  Playwright installation (run once in your terminal):
 *     npm install && npx playwright install chromium
 */

import { chromium, type Page } from 'playwright'
import { COOP_PROFILE_DIR } from '~/server/utils/coopProfile'

// ── Types ─────────────────────────────────────────────────────────────────────

interface CartItem {
  id:       string
  name:     string
  quantity: string
  unit:     string
}

export type CartItemStatus = 'added' | 'review' | 'not_found'

export interface CartItemResult {
  item:         CartItem
  status:       CartItemStatus
  productName?: string
  message?:     string
}

interface RequestBody {
  items: CartItem[]
}

// ── Selectors ─────────────────────────────────────────────────────────────────

/**
 * Selectors for coopathome.ch product search / cart.
 * These may need updating if the site is redesigned.
 */
const COOP_SELECTORS = {
  cookieAccept: '#onetrust-accept-btn-handler',

  // Used to detect whether the session is still active on coop.ch
  // (if this is visible the user is NOT logged in → needs to run /api/coop/setup)
  loginLink: 'a[data-testauto="login"]',

  searchInput: [
    'input[type="search"]',
    'input[name="q"]',
    'input[name="text"]',
    '#input_SearchBox',
    'input[placeholder*="search" i]',
    'input[placeholder*="suche" i]',
    '[data-test="search-input"]',
  ].join(', '),

  productCard: [
    '[data-test="product-tile"]',
    '.product-tile',
    '[data-product-id]',
    'article.product',
  ].join(', '),

  productName: [
    '[data-test="product-name"]',
    '.product-tile__name',
    '.product-name',
    'h3',
    'h2',
  ].join(', '),

  addToCart: [
    '[data-test="add-to-cart"]',
    'button[aria-label*="in den Warenkorb" i]',
    'button[aria-label*="add to cart" i]',
    'button[title*="Warenkorb" i]',
    '.add-to-cart-button',
  ].join(', '),
}

// ── Cookie consent helper ─────────────────────────────────────────────────────

async function acceptCookies(page: Page, selector = COOP_SELECTORS.cookieAccept) {
  try {
    await page.waitForSelector(selector, { timeout: 5_000 })
    await page.click(selector)
    await page.waitForTimeout(600)
  } catch { /* No banner — fine */ }
}

// ── Session check ─────────────────────────────────────────────────────────────

/**
 * Verifies the persisted session is still valid by checking coop.ch.
 * If the login link is visible the session has expired.
 */
async function assertLoggedIn(page: Page): Promise<void> {
  await page.goto('https://www.coop.ch/en/', { waitUntil: 'domcontentloaded', timeout: 25_000 })
  await acceptCookies(page)

  const loginVisible = await page
    .locator(COOP_SELECTORS.loginLink)
    .isVisible()
    .catch(() => true)   // assume not logged in if we can't tell

  if (loginVisible) {
    throw createError({
      statusCode: 401,
      message:
        'Coop session has expired or has not been set up yet. ' +
        'Open http://localhost:3000/api/coop/setup in your browser to log in (takes ~1 minute).',
    })
  }
}

// ── Search and add one item to cart ──────────────────────────────────────────

async function searchAndAdd(page: Page, item: CartItem): Promise<CartItemResult> {
  const searchTerm = [item.name, item.quantity, item.unit]
    .filter(Boolean)
    .join(' ')
    .trim()

  try {
    await page.waitForSelector(COOP_SELECTORS.searchInput, { timeout: 10_000 })
    await page.fill(COOP_SELECTORS.searchInput, searchTerm)
    await page.keyboard.press('Enter')
    await page.waitForLoadState('domcontentloaded', { timeout: 15_000 })
    await page.waitForTimeout(1_200)

    const card = page.locator(COOP_SELECTORS.productCard).first()
    if (!(await card.isVisible().catch(() => false))) {
      return { item, status: 'not_found', message: `No results for "${searchTerm}"` }
    }

    const productName = await card
      .locator(COOP_SELECTORS.productName)
      .first()
      .textContent()
      .catch(() => undefined)

    const addBtn = card.locator(COOP_SELECTORS.addToCart).first()
    if (!(await addBtn.isVisible().catch(() => false))) {
      return {
        item,
        status:      'review',
        productName: productName?.trim(),
        message:     'Product found but Add to Cart button not visible (may be out of stock or requires login)',
      }
    }

    await addBtn.click()
    await page.waitForTimeout(800)

    return { item, status: 'added', productName: productName?.trim() }

  } catch (err: any) {
    return { item, status: 'review', message: err?.message ?? 'Unexpected error' }
  }
}

// ── Event handler ─────────────────────────────────────────────────────────────

export default defineEventHandler(async (event) => {
  const { items } = await readBody<RequestBody>(event)

  if (!items?.length) {
    throw createError({ statusCode: 400, message: 'No items provided.' })
  }

  let context: Awaited<ReturnType<typeof chromium.launchPersistentContext>> | null = null

  try {
    // Open the persisted profile (headless — no browser window)
    context = await chromium.launchPersistentContext(COOP_PROFILE_DIR, {
      headless: true,
      args:     ['--no-sandbox', '--disable-setuid-sandbox'],
      locale:   'de-CH',
      userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
    })

    const page = await context.newPage()

    // Verify the saved session is still valid
    await assertLoggedIn(page)

    // Navigate to coopathome.ch and accept cookies
    await page.goto('https://www.coopathome.ch', { waitUntil: 'domcontentloaded', timeout: 20_000 })
    await acceptCookies(page)

    // Search and add each item
    const results: CartItemResult[] = []
    for (const item of items) {
      results.push(await searchAndAdd(page, item))
      await page.waitForTimeout(600)
    }

    return {
      results,
      summary: {
        added:     results.filter(r => r.status === 'added').length,
        review:    results.filter(r => r.status === 'review').length,
        not_found: results.filter(r => r.status === 'not_found').length,
      },
    }

  } catch (err: any) {
    throw createError({
      statusCode: err.statusCode ?? 502,
      message:    err?.message ?? 'Coop automation failed',
    })
  } finally {
    await context?.close()
  }
})

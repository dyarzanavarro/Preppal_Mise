import { chromium, type Browser, type BrowserContext, type Page } from 'playwright'
import { toProduct, type Product } from './match'

const BASE = 'https://www.coop.ch'
export const DEFAULT_CDP_URL = 'http://127.0.0.1:9222'

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const jitter = () => sleep(800 + Math.random() * 1200) // stay slow; DataDome watches request cadence

export type AddResult = { code: string; packs: number; ok: boolean; error?: string }

/**
 * Talks to coop.ch from inside a real, already-logged-in Chrome (attached over CDP).
 * All requests are fetch() calls inside the live page: same cookies, DataDome JS and origin as a real click.
 * Using one shared Chrome (not a Playwright-launched profile) lets Mise and the MCP server use it at the same time.
 */
export class CoopSession {
  private constructor(private browser: Browser, private ctx: BrowserContext, private page: Page) {}

  static async connect(cdpUrl = process.env.COOP_CDP_URL || DEFAULT_CDP_URL): Promise<CoopSession> {
    let browser: Browser
    try {
      browser = await chromium.connectOverCDP(cdpUrl)
    } catch {
      throw new CoopNotConnected(`Can't reach Chrome at ${cdpUrl}. Start it with: npm run coop:chrome`)
    }
    const ctx = browser.contexts()[0]
    if (!ctx) throw new CoopNotConnected('Chrome has no browser context')
    const existing = ctx.pages().find((p) => /(^|\.)coop\.ch$/.test(new URL(p.url() || 'about:blank').hostname))
    const page = existing ?? (await ctx.newPage())
    if (!existing) await page.goto(`${BASE}/de/`, { waitUntil: 'domcontentloaded' })
    return new CoopSession(browser, ctx, page)
  }

  get connected() { return this.browser.isConnected() }

  /** Detach only; the user's Chrome keeps running. */
  async close() { await this.browser.close() }

  async isLoggedIn(): Promise<boolean> {
    return (await this.ctx.cookies(BASE)).some((c) => c.name === 'firebaseAuthToken' || c.name === 'oauthTokens')
  }

  private async ensureOnCoop() {
    if (!/(^|\.)coop\.ch$/.test(new URL(this.page.url() || 'about:blank').hostname)) {
      await this.page.goto(`${BASE}/de/`, { waitUntil: 'domcontentloaded' })
    }
  }

  private async csrf(): Promise<string> {
    await this.ensureOnCoop()
    const t = await this.page.evaluate(() => (window as any).ACC?.config?.CSRFToken as string | undefined)
    if (!t) throw new Error('CSRF token not found on page (page changed or not fully loaded)')
    return t
  }

  async search(text: string): Promise<Product[]> {
    await this.ensureOnCoop()
    await jitter()
    const json = await this.page.evaluate(async (q) => {
      const r = await fetch(`/de/search/suggestlayer/SearchBox?text=${encodeURIComponent(q)}&_=${Date.now()}`, {
        headers: { 'X-Requested-With': 'XMLHttpRequest', Accept: 'application/json, text/javascript, */*; q=0.01' },
      })
      if (!r.ok) throw new Error(`search ${r.status}`)
      return r.json()
    }, text)
    return (json.productCategorySearchPage?.results ?? []).map(toProduct)
  }

  private async post(path: string, fields: Record<string, string>): Promise<any> {
    const csrf = await this.csrf()
    return this.page.evaluate(
      async ([path, fields, csrf]) => {
        const body = new URLSearchParams({ ...(fields as Record<string, string>), CSRFToken: csrf as string })
        const r = await fetch(path as string, {
          method: 'POST',
          headers: { 'X-Requested-With': 'XMLHttpRequest', 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8', Accept: 'application/json, text/javascript, */*; q=0.01' },
          body,
        })
        if (!r.ok) throw new Error(`${path} ${r.status}`)
        return r.json()
      },
      [path, fields, csrf] as const,
    )
  }

  /** Adds `packs` of one product. Returns the cart total shown in the header afterwards, if readable. */
  async add(code: string, packs: number): Promise<number | null> {
    await jitter()
    const f = { 'products[0].productCode': code, 'products[0].quantity': String(packs) }
    const res = await this.post('/de/basket/list/add', f)
    if (!res.success) throw new Error(`Coop refused product ${code}`)
    // The site follows every add with cartupdate (res.additionalAjaxCall); its header HTML carries the total.
    const upd = await this.post(res.additionalAjaxCall ?? '/de/basket/list/cartupdate', { ...f, async: 'true' })
    const m = /btn__inner-text-price">\s*([\d.']+)/.exec(upd.pageHeaderButton ?? '')
    return m ? Number(m[1].replace(/'/g, '')) : null
  }

  async addAll(lines: { code: string; packs: number }[]): Promise<{ results: AddResult[]; cartTotal: number | null }> {
    const results: AddResult[] = []
    let cartTotal: number | null = null
    for (const l of lines) {
      try {
        cartTotal = (await this.add(l.code, l.packs)) ?? cartTotal
        results.push({ ...l, ok: true })
      } catch (e: any) {
        results.push({ ...l, ok: false, error: e?.message ?? String(e) })
      }
    }
    return { results, cartTotal }
  }
}

export class CoopNotConnected extends Error {}

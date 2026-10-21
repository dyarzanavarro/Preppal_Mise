// Starts a dedicated Chrome with remote debugging on, so Mise and the MCP server can share one logged-in session.
// Run: npm run coop:chrome   (log in to coop.ch once in the window that opens; the profile persists)
import { spawn } from 'node:child_process'
import { existsSync } from 'node:fs'
import path from 'node:path'

const port = process.env.COOP_CDP_PORT || '9222'
const profile = process.env.COOP_CHROME_PROFILE || path.join(process.cwd(), '.coop-chrome')

const candidates: Record<string, string[]> = {
  darwin: ['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'],
  linux: ['/usr/bin/google-chrome', '/usr/bin/google-chrome-stable', '/usr/bin/chromium'],
  win32: ['C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe', 'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'],
}
const exe = process.env.COOP_CHROME_PATH || (candidates[process.platform] ?? []).find(existsSync)
if (!exe) {
  console.error('Chrome not found. Set COOP_CHROME_PATH to your Chrome executable.')
  process.exit(1)
}

// Chrome refuses remote debugging on the default profile, hence the dedicated --user-data-dir.
spawn(exe, [`--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--no-first-run', 'https://www.coop.ch/de/'], {
  detached: true,
  stdio: 'ignore',
}).unref()
console.log(`Chrome started (debug port ${port}, profile ${profile}). Log in to coop.ch there, then leave it running.`)

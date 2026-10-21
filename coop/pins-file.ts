import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import path from 'node:path'
import { pinKey, type Pin } from './match'

// Local pin store for the MCP server (Mise keeps its pins in Firestore, scoped to the household).
const file = () => process.env.COOP_PINS_FILE || path.join(process.cwd(), 'coop-pins.json')

export const readPins = (): Record<string, Pin> => (existsSync(file()) ? JSON.parse(readFileSync(file(), 'utf8')) : {})

export function writePin(ingredient: string, pin: Pin) {
  writeFileSync(file(), JSON.stringify({ ...readPins(), [pinKey(ingredient)]: pin }, null, 2))
}

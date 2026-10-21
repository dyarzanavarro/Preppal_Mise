import { test } from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { pick, toProduct, parseQuantity, normalizeUnit, type Product } from './match'

const products: Product[] = JSON.parse(readFileSync(new URL('./fixtures/kichererbsen.json', import.meta.url), 'utf8')).productCategorySearchPage.results.map(toProduct)
const by = (code: string) => products.find((p) => p.code === code)!

test('parseQuantity handles Mise free-text quantities', () => {
  assert.equal(parseQuantity('400'), 400)
  assert.equal(parseQuantity('1/2'), 0.5)
  assert.equal(parseQuantity('1 1/2'), 1.5)
  assert.equal(parseQuantity('½'), 0.5)
  assert.equal(parseQuantity('1½'), 1.5)
  assert.equal(parseQuantity('2-3'), 3)
  assert.equal(parseQuantity('2,5'), 2.5)
  assert.equal(parseQuantity(''), null)
  assert.equal(parseQuantity('a pinch'), null)
})

test('unit normalization incl. spoon measures as volume', () => {
  assert.deepEqual(normalizeUnit(1.5, 'kg'), { qty: 1500, base: 'g' })
  assert.deepEqual(normalizeUnit(2, 'tbsp'), { qty: 30, base: 'ml' })
  assert.equal(normalizeUnit(1, 'cloves'), null)
})

test('400 g chickpeas -> cheapest covering option', () => {
  const p = pick({ name: 'chickpeas', search: 'Kichererbsen', quantity: '400', unit: 'g' }, products)!
  assert.equal(p.product.code, '6553758')
  assert.equal(p.packs, 1)
  assert.equal(p.cost, 1.7)
  assert.equal(p.review, null)
})

test('1 kg rounds packs up', () => {
  const p = pick({ name: 'x', search: 'Kichererbsen', quantity: '1', unit: 'kg' }, products)!
  assert.ok(p.packs * (p.product.capacity ?? 0) >= 1000)
})

test('kitchen units that cannot be compared -> 1 pack, flagged (no 5 bottles of oil for 5 tbsp)', () => {
  const p = pick({ name: 'garlic', search: 'Kichererbsen', quantity: '3', unit: 'cloves' }, products)!
  assert.equal(p.packs, 1)
  assert.match(p.review!, /assuming 1 pack/)
})

test('tbsp of a g-packed product is not comparable -> 1 pack', () => {
  const p = pick({ name: 'x', search: 'Kichererbsen', quantity: '2', unit: 'tbsp' }, products)!
  assert.equal(p.packs, 1)
})

test('countable units buy that many packs', () => {
  const p = pick({ name: 'x', search: 'Kichererbsen', quantity: '3', unit: 'cans' }, products)!
  assert.equal(p.packs, 3)
  assert.equal(p.review, null)
})

test('unreadable quantity -> 1 pack, flagged', () => {
  const p = pick({ name: 'x', search: 'Kichererbsen', quantity: 'a pinch', unit: '' }, products)!
  assert.equal(p.packs, 1)
  assert.match(p.review!, /couldn't read quantity/)
})

test('no title match is flagged', () => {
  const p = pick({ name: 'spinach', quantity: '100', unit: 'g' }, products)!
  assert.match(p.review!, /no title match/)
})

test('nothing purchasable -> null', () => {
  assert.equal(pick({ name: 'x', quantity: '1', unit: 'g' }, products.map((p) => ({ ...p, purchasable: false }))), null)
})

test('pin beats cheapest, with pack math', () => {
  const pin = { search: 'Kichererbsen', product: by('6781122') } // Karma Bio 240 g
  const p = pick({ name: 'chickpeas', quantity: '400', unit: 'g' }, products, pin)!
  assert.equal(p.product.code, '6781122')
  assert.equal(p.packs, 2)
  assert.equal(p.cost, 5)
  assert.equal(p.review, null)
  assert.equal(p.search, 'Kichererbsen') // search term comes from the pin
})

test('pin missing from results -> cached snapshot + flag; sold out -> normal matching', () => {
  const pin = { search: 'Kichererbsen', product: by('6781122') }
  const without = products.filter((x) => x.code !== '6781122')
  assert.match(pick({ name: 'c', quantity: '400', unit: 'g' }, without, pin)!.review!, /from cache/)
  const soldOut = products.map((x) => (x.code === '6781122' ? { ...x, purchasable: false } : x))
  assert.equal(pick({ name: 'c', quantity: '400', unit: 'g' }, soldOut, { ...pin, product: { ...pin.product, purchasable: false } })!.product.code, '6553758')
})

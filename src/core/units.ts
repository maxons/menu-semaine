export type NormalizedUnit = 'g' | 'kg' | 'ml' | 'cl' | 'l' | 'piece'

const UNIT_ALIASES: Record<string, NormalizedUnit> = {
  g: 'g',
  gr: 'g',
  gramme: 'g',
  grammes: 'g',
  kg: 'kg',
  kilo: 'kg',
  kilos: 'kg',
  kilogramme: 'kg',
  kilogrammes: 'kg',
  ml: 'ml',
  cl: 'cl',
  l: 'l',
  litre: 'l',
  litres: 'l',
  piece: 'piece',
  pièce: 'piece',
  pieces: 'piece',
  pièces: 'piece',
}

export interface ParsedIngredient {
  name: string
  quantity: number | null
  unit: string | null
}

const QUANTITY_REGEX = /^(\d+(?:[.,]\d+)?)\s*([a-zA-Zéèûôàîï]+\.?)\s*(.*)$/

export function parseIngredientLine(line: string): ParsedIngredient | null {
  const trimmed = line.trim()
  if (!trimmed) return null
  const match = trimmed.match(QUANTITY_REGEX)
  if (!match) {
    return { name: trimmed, quantity: null, unit: null }
  }
  const quantity = Number.parseFloat(match[1].replace(',', '.'))
  const unitRaw = match[2].replace(/\.$/, '').toLowerCase()
  const rest = match[3].trim()
  if (Number.isNaN(quantity)) {
    return { name: trimmed, quantity: null, unit: null }
  }
  if (rest.length === 0 && !UNIT_ALIASES[unitRaw]) {
    return { name: trimmed, quantity: null, unit: null }
  }
  if (rest.length === 0) {
    return { name: trimmed, quantity, unit: unitRaw }
  }
  return {
    name: rest,
    quantity,
    unit: UNIT_ALIASES[unitRaw] ? unitRaw : unitRaw,
  }
}

export function parseIngredients(input: string): ParsedIngredient[] {
  return input
    .split(',')
    .map((line) => parseIngredientLine(line))
    .filter((entry): entry is ParsedIngredient => entry !== null)
}

const TO_GRAMS: Record<string, number> = { g: 1, kg: 1000 }
const TO_MILLILITERS: Record<string, number> = { ml: 1, cl: 10, l: 1000 }

export function addQuantities(
  a: { quantity: number; unit: string },
  b: { quantity: number; unit: string },
): { quantity: number; unit: string } | null {
  if (a.unit === b.unit) {
    return { quantity: a.quantity + b.quantity, unit: a.unit }
  }
  if (TO_GRAMS[a.unit] && TO_GRAMS[b.unit]) {
    return {
      quantity: a.quantity * TO_GRAMS[a.unit] + b.quantity * TO_GRAMS[b.unit],
      unit: 'g',
    }
  }
  if (TO_MILLILITERS[a.unit] && TO_MILLILITERS[b.unit]) {
    return {
      quantity:
        a.quantity * TO_MILLILITERS[a.unit] + b.quantity * TO_MILLILITERS[b.unit],
      unit: 'ml',
    }
  }
  return null
}

export function formatQuantity(quantity: number, unit: string): string {
  const grams = TO_GRAMS[unit]
  if (grams && quantity >= 1000) {
    return `${trimNumber(quantity / 1000)} kg`
  }
  const ml = TO_MILLILITERS[unit]
  if (ml && quantity >= 1000) {
    return `${trimNumber(quantity / 1000)} L`
  }
  return `${trimNumber(quantity)} ${unit}`
}

function trimNumber(value: number): string {
  return Number.parseFloat(value.toFixed(2)).toString()
}

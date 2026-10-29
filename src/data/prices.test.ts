import { describe, expect, it } from 'vitest'
import { estimateIngredientPriceEur } from './prices'

describe('estimateIngredientPriceEur', () => {
  it('calcule le prix depuis une masse', () => {
    expect(estimateIngredientPriceEur('pâtes', 500, 'g')).toBe(1)
  })

  it('convertit kg vers le prix au kg', () => {
    expect(estimateIngredientPriceEur('pommes de terre', 1, 'kg')).toBe(1.5)
  })

  it('calcule le prix depuis un volume', () => {
    expect(estimateIngredientPriceEur('crème', 20, 'cl')).toBe(0.9)
  })

  it('gère les pièces (ex. poulet entier)', () => {
    const price = estimateIngredientPriceEur('poulet', 1, null)
    expect(price).toBeGreaterThan(0.5)
    expect(price).toBeLessThan(5)
  })

  it('normalise les accents et la casse', () => {
    expect(estimateIngredientPriceEur('Pâtes', 500, 'g')).toBe(
      estimateIngredientPriceEur('pates', 500, 'g'),
    )
  })

  it('utilise un prix par défaut pour un ingrédient inconnu', () => {
    const price = estimateIngredientPriceEur('truffe blanche', 100, 'g')
    expect(price).toBe(0.4)
  })

  it('donne un prix plausible au saumon (250 g)', () => {
    const price = estimateIngredientPriceEur('saumon', 250, 'g')
    expect(price).toBeGreaterThan(3)
    expect(price).toBeLessThan(12)
  })
})

import { describe, expect, it } from 'vitest'
import { addQuantities, formatQuantity, parseIngredientLine, parseIngredients } from './units'

describe('parseIngredientLine', () => {
  it('parse quantité + unité + nom', () => {
    expect(parseIngredientLine('500 g pâtes')).toEqual({
      name: 'pâtes',
      quantity: 500,
      unit: 'g',
    })
  })

  it('parse quantité décimale avec virgule', () => {
    expect(parseIngredientLine('1,5 kg tomates')).toEqual({
      name: 'tomates',
      quantity: 1.5,
      unit: 'kg',
    })
  })

  it('gère le nom seul', () => {
    expect(parseIngredientLine('ail')).toEqual({ name: 'ail', quantity: null, unit: null })
  })

  it('gère quantité en nombre de pièces', () => {
    expect(parseIngredientLine('2 oeufs')).toEqual({
      name: '2 oeufs',
      quantity: null,
      unit: null,
    })
  })
})

describe('parseIngredients', () => {
  it('sépare par virgules en ignorant les vides', () => {
    const result = parseIngredients('500 g pâtes, ail, , 20 cl crème')
    expect(result).toHaveLength(3)
    expect(result[0].name).toBe('pâtes')
    expect(result[2]).toEqual({ name: 'crème', quantity: 20, unit: 'cl' })
  })
})

describe('addQuantities', () => {
  it('additionne mêmes unités', () => {
    expect(addQuantities({ quantity: 200, unit: 'g' }, { quantity: 300, unit: 'g' })).toEqual({
      quantity: 500,
      unit: 'g',
    })
  })

  it('convertit g + kg en grammes', () => {
    expect(addQuantities({ quantity: 500, unit: 'g' }, { quantity: 1, unit: 'kg' })).toEqual({
      quantity: 1500,
      unit: 'g',
    })
  })

  it('convertit cl + l en millilitres', () => {
    expect(addQuantities({ quantity: 20, unit: 'cl' }, { quantity: 1, unit: 'l' })).toEqual({
      quantity: 1200,
      unit: 'ml',
    })
  })

  it('retourne null pour unités incompatibles', () => {
    expect(addQuantities({ quantity: 1, unit: 'kg' }, { quantity: 1, unit: 'l' })).toBeNull()
  })
})

describe('formatQuantity', () => {
  it('affiche en kg au-delà de 1000 g', () => {
    expect(formatQuantity(1500, 'g')).toBe('1.5 kg')
  })

  it('affiche en L au-delà de 1000 ml', () => {
    expect(formatQuantity(1020, 'ml')).toBe('1.02 L')
  })

  it('garde les petites quantités', () => {
    expect(formatQuantity(250, 'g')).toBe('250 g')
  })
})

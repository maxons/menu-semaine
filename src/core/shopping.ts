import type { Dish, Menu } from './types'
import { addQuantities, formatQuantity } from './units'

export interface ShoppingItem {
  name: string
  quantity: number | null
  unit: string | null
  display: string | null
}

export function buildShoppingList(menu: Menu, dishes: Dish[]): ShoppingItem[] {
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]))
  const items = new Map<
    string,
    { name: string; quantity: number | null; unit: string | null }
  >()

  for (const meal of menu.meals) {
    if (!meal.dishId) continue
    const dish = dishById.get(meal.dishId)
    if (!dish) continue

    for (const ingredient of dish.ingredients) {
      const key = normalizeName(ingredient.name)
      const quantity =
        ingredient.quantity !== null && ingredient.unit !== null
          ? { quantity: ingredient.quantity, unit: ingredient.unit }
          : null
      const existing = items.get(key)
      if (!existing) {
        items.set(key, {
          name: ingredient.name,
          quantity: quantity?.quantity ?? null,
          unit: quantity?.unit ?? null,
        })
        continue
      }
      if (quantity && existing.quantity !== null && existing.unit !== null) {
        const summed = addQuantities(
          { quantity: existing.quantity, unit: existing.unit },
          quantity,
        )
        if (summed) {
          existing.quantity = summed.quantity
          existing.unit = summed.unit
        }
      }
    }
  }

  return [...items.values()]
    .map((item) => ({
      ...item,
      display:
        item.quantity !== null && item.unit !== null
          ? formatQuantity(item.quantity, item.unit)
          : null,
    }))
    .sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

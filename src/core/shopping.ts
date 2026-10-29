import type { Dish, Menu } from './types'

export interface ShoppingItem {
  name: string
  quantity: number | null
  unit: string | null
}

export function buildShoppingList(menu: Menu, dishes: Dish[]): ShoppingItem[] {
  const dishById = new Map(dishes.map((dish) => [dish.id, dish]))
  const items = new Map<string, ShoppingItem>()

  for (const meal of menu.meals) {
    if (!meal.dishId) continue
    const dish = dishById.get(meal.dishId)
    if (!dish) continue

    for (const ingredient of dish.ingredients) {
      const key = normalizeName(ingredient.name)
      const existing = items.get(key)
      if (!existing) {
        items.set(key, {
          name: ingredient.name,
          quantity: ingredient.quantity,
          unit: ingredient.unit,
        })
      } else if (
        existing.unit === ingredient.unit &&
        existing.quantity !== null &&
        ingredient.quantity !== null
      ) {
        existing.quantity += ingredient.quantity
      }
    }
  }

  return [...items.values()].sort((a, b) => a.name.localeCompare(b.name, 'fr'))
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

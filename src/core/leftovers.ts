import type { Dish } from './types'

export interface LeftoverMatch {
  dish: Dish
  usedIngredients: string[]
  coverage: number
}

function normalize(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function findLeftoverDishes(
  leftovers: string[],
  dishes: Dish[],
  options: { minCoverage?: number; limit?: number } = {},
): LeftoverMatch[] {
  const { minCoverage = 0.25, limit = 6 } = options
  const leftoverSet = new Set(leftovers.map(normalize).filter(Boolean))
  if (leftoverSet.size === 0) return []

  return dishes
    .map((dish) => {
      const ingredientNames = dish.ingredients.map((ingredient) =>
        normalize(ingredient.name),
      )
      const used = ingredientNames.filter((name) => leftoverSet.has(name))
      const uniqueUsed = [...new Set(used)]
      const coverage =
        ingredientNames.length === 0
          ? 0
          : uniqueUsed.length / new Set(ingredientNames).size
      return {
        dish,
        usedIngredients: [
          ...new Set(
            dish.ingredients.filter((ingredient) =>
              leftoverSet.has(normalize(ingredient.name)),
            ).map((ingredient) => ingredient.name),
          ),
        ],
        coverage,
      }
    })
    .filter((match) => match.coverage >= minCoverage && match.usedIngredients.length > 0)
    .sort((a, b) => b.coverage - a.coverage || b.usedIngredients.length - a.usedIngredients.length)
    .slice(0, limit)
}

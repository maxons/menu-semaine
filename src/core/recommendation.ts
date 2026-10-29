import type {
  CatalogDish,
  Dish,
  Recommendation,
  UserTasteProfile,
} from './types'

const DIFFICULTY_SCORE: Record<Dish['difficulty'], number> = {
  facile: 1,
  moyen: 2,
  difficile: 3,
}

function normalizeName(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function buildUserProfile(dishes: Dish[]): UserTasteProfile {
  const ingredientCounts: Record<string, number> = {}
  const categoryCounts: Record<string, number> = {}
  const utensilCounts: Record<string, number> = {}
  let difficultySum = 0
  let healthyCount = 0

  for (const dish of dishes) {
    difficultySum += DIFFICULTY_SCORE[dish.difficulty]
    if (dish.healthy) healthyCount++
    categoryCounts[dish.category] = (categoryCounts[dish.category] ?? 0) + 1
    for (const ingredient of dish.ingredients) {
      const key = normalizeName(ingredient.name)
      ingredientCounts[key] = (ingredientCounts[key] ?? 0) + 1
    }
    for (const utensil of dish.utensils) {
      utensilCounts[utensil] = (utensilCounts[utensil] ?? 0) + 1
    }
  }

  const total = dishes.length || 1
  const categoryShares: Record<string, number> = {}
  for (const [category, count] of Object.entries(categoryCounts)) {
    categoryShares[category] = count / total
  }
  const utensilShares: Record<string, number> = {}
  for (const [utensil, count] of Object.entries(utensilCounts)) {
    utensilShares[utensil] = count / total
  }

  return {
    ingredientCounts,
    categoryShares,
    avgDifficulty: difficultySum / total,
    healthyShare: healthyCount / total,
    utensilShares,
    dishCount: dishes.length,
  }
}

export interface ScoreWeights {
  ingredients: number
  category: number
  difficulty: number
  healthy: number
  utensils: number
}

export const DEFAULT_WEIGHTS: ScoreWeights = {
  ingredients: 0.45,
  category: 0.25,
  difficulty: 0.15,
  healthy: 0.1,
  utensils: 0.05,
}

function ingredientAffinity(dish: CatalogDish, profile: UserTasteProfile): number {
  if (dish.ingredients.length === 0) return 0
  const profileTotal = Object.values(profile.ingredientCounts).reduce(
    (sum, count) => sum + count,
    0,
  )
  if (profileTotal === 0) return 0
  let matched = 0
  for (const ingredient of dish.ingredients) {
    const key = normalizeName(ingredient.name)
    if (profile.ingredientCounts[key]) matched += 1
  }
  return matched / dish.ingredients.length
}

function categoryAffinity(dish: CatalogDish, profile: UserTasteProfile): number {
  return profile.categoryShares[dish.category] ?? 0
}

function difficultyAffinity(
  dish: CatalogDish,
  profile: UserTasteProfile,
): number {
  if (profile.dishCount === 0) return 0
  const diff = DIFFICULTY_SCORE[dish.difficulty] - profile.avgDifficulty
  return 1 - Math.min(1, Math.abs(diff) / 2)
}

function healthyAffinity(dish: CatalogDish, profile: UserTasteProfile): number {
  if (dish.healthy) return profile.healthyShare
  return 1 - profile.healthyShare
}

function utensilAffinity(dish: CatalogDish, profile: UserTasteProfile): number {
  if (dish.utensils.length === 0) return 0
  let sum = 0
  for (const utensil of dish.utensils) {
    sum += profile.utensilShares[utensil] ?? 0
  }
  return sum / dish.utensils.length
}

function scoreDish(
  dish: CatalogDish,
  profile: UserTasteProfile,
  weights: ScoreWeights,
): { score: number; reasons: string[] } {
  const affinities = {
    ingredients: ingredientAffinity(dish, profile),
    category: categoryAffinity(dish, profile),
    difficulty: difficultyAffinity(dish, profile),
    healthy: healthyAffinity(dish, profile),
    utensils: utensilAffinity(dish, profile),
  }
  const score =
    affinities.ingredients * weights.ingredients +
    affinities.category * weights.category +
    affinities.difficulty * weights.difficulty +
    affinities.healthy * weights.healthy +
    affinities.utensils * weights.utensils

  const reasons: string[] = []
  if (affinities.ingredients > 0.5) {
    const shared = dish.ingredients.filter((ingredient) =>
      profile.ingredientCounts[normalizeName(ingredient.name)],
    )
    reasons.push(`Ingrédients que tu utilises souvent : ${shared.map((i) => i.name).join(', ')}`)
  }
  if (affinities.category > 0.3) {
    reasons.push(`Type de plat proche de tes habitudes (${dish.category})`)
  }
  if (affinities.difficulty > 0.75) {
    reasons.push(`Niveau de difficulté adapté (${dish.difficulty})`)
  }
  if (affinities.healthy > 0.6 && dish.healthy) {
    reasons.push('Correspond à ton tendance "healthy"')
  }

  return { score, reasons }
}

export function recommendDishes(
  catalog: CatalogDish[],
  userDishes: Dish[],
  options: { weights?: ScoreWeights; limit?: number } = {},
): Recommendation[] {
  const { weights = DEFAULT_WEIGHTS, limit = 6 } = options
  if (userDishes.length === 0) {
    return catalog.slice(0, limit).map((dish) => ({
      dish,
      score: 0,
      reasons: ['Ajoute des plats à ton carnet pour des suggestions personnalisées'],
    }))
  }

  const profile = buildUserProfile(userDishes)
  const userNames = new Set(userDishes.map((dish) => normalizeName(dish.name)))

  return catalog
    .filter((dish) => !userNames.has(normalizeName(dish.name)))
    .map((dish) => ({ dish, ...scoreDish(dish, profile, weights) }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

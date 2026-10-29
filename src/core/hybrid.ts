import type { CatalogDish, Dish, Recommendation } from './types'
import { buildUserProfile, DEFAULT_WEIGHTS, type ScoreWeights } from './recommendation'
import { normalizeIngredient } from './graph'

export interface HybridOptions {
  limit?: number
  minSimilarity?: number
  profileWeight?: number
  graphWeight?: number
  weights?: ScoreWeights
}

interface Scored {
  dish: CatalogDish
  graphScore: number
  profileScore: number
  score: number
  reasons: string[]
}

export function normalizeScore(value: number, max: number): number {
  if (max <= 0) return 0
  return value / max
}

export function hybridRecommendations(
  userDishes: Dish[],
  catalog: CatalogDish[],
  options: HybridOptions = {},
): Recommendation[] {
  const {
    limit = 6,
    minSimilarity = 0.1,
    profileWeight = 0.4,
    graphWeight = 0.6,
    weights = DEFAULT_WEIGHTS,
  } = options

  if (userDishes.length === 0) {
    return catalog.slice(0, limit).map((dish) => ({
      dish,
      score: 0,
      reasons: ['Ajoute des plats à ton carnet pour des suggestions personnalisées'],
    }))
  }

  const userNames = new Set(userDishes.map((dish) => normalizeIngredient(dish.name)))
  const profile = buildUserProfile(userDishes)

  const graphScores = new Map<string, number>()
  const graphReasons = new Map<string, { strength: number; text: string }[]>()

  const candidateDishes: CatalogDish[] = catalog.filter(
    (dish) => !userNames.has(normalizeIngredient(dish.name)),
  )

  for (const candidate of candidateDishes) {
    let total = 0
    const reasons: { strength: number; text: string }[] = []
    for (const userDish of userDishes) {
      const shared = candidate.ingredients
        .map((i) => normalizeIngredient(i.name))
        .filter((name) =>
          userDish.ingredients.some((i) => normalizeIngredient(i.name) === name),
        )
      const union = new Set([
        ...candidate.ingredients.map((i) => normalizeIngredient(i.name)),
        ...userDish.ingredients.map((i) => normalizeIngredient(i.name)),
      ])
      const jaccard = union.size === 0 ? 0 : shared.length / union.size
      const categoryBonus = candidate.category === userDish.category ? 0.2 : 0
      const similarity = Math.min(1, jaccard + categoryBonus)
      if (similarity < minSimilarity) continue
      const usageBoost = 1 + Math.min(4, userDish.timesServed)
      total += similarity * usageBoost
      if (similarity >= 0.15 && shared.length > 0) {
        reasons.push({
          strength: similarity * usageBoost,
          text: `Proche de « ${userDish.name} » (${Math.round(similarity * 100)}% de similarité)`,
        })
      }
    }
    if (total > 0) {
      graphScores.set(candidate.name, total)
      graphReasons.set(candidate.name, reasons)
    }
  }

  const maxGraph = Math.max(1, ...graphScores.values())
  const scored: Scored[] = candidateDishes.map((dish) => {
    const graphRaw = graphScores.get(dish.name) ?? 0
    const graphScore = normalizeScore(graphRaw, maxGraph)

    const ingredientKeys = dish.ingredients.map((i) => normalizeIngredient(i.name))
    const matched = ingredientKeys.filter((key) => profile.ingredientCounts[key]).length
    const ingredientAffinity = ingredientKeys.length === 0 ? 0 : matched / ingredientKeys.length
    const categoryAffinity = profile.categoryShares[dish.category] ?? 0
    const difficultyDiff =
      { facile: 1, moyen: 2, difficile: 3 }[dish.difficulty] - profile.avgDifficulty
    const difficultyAffinity = 1 - Math.min(1, Math.abs(difficultyDiff) / 2)
    const healthyAffinity = dish.healthy ? profile.healthyShare : 1 - profile.healthyShare

    const profileScore =
      ingredientAffinity * weights.ingredients +
      categoryAffinity * weights.category +
      difficultyAffinity * weights.difficulty +
      healthyAffinity * weights.healthy

    const reasons = [...(graphReasons.get(dish.name) ?? [])]
    if (ingredientAffinity > 0.5) reasons.push({ strength: ingredientAffinity, text: 'Ingrédients que tu utilises souvent' })
    if (categoryAffinity > 0.3) reasons.push({ strength: categoryAffinity, text: `Type de plat proche de tes habitudes (${dish.category})` })
    if (difficultyAffinity > 0.75) reasons.push({ strength: difficultyAffinity, text: `Difficulté adaptée (${dish.difficulty})` })
    if (dish.healthy && healthyAffinity > 0.6) reasons.push({ strength: healthyAffinity, text: 'Correspond à ta tendance « healthy »' })

    return {
      dish,
      graphScore,
      profileScore,
      score: graphWeight * graphScore + profileWeight * profileScore,
      reasons: reasons
        .sort((a, b) => b.strength - a.strength)
        .slice(0, 3)
        .map((r) => r.text),
    }
  })

  return scored
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map(({ dish, score, reasons }) => ({ dish, score, reasons }))
}

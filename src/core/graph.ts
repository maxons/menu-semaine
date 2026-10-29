import type { CatalogDish, Dish, Recommendation } from './types'

export interface DishNode {
  key: string
  dish: CatalogDish
}

export interface GraphEdge {
  from: string
  to: string
  weight: number
  sharedIngredients: string[]
}

export interface SimilarityGraph {
  nodes: DishNode[]
  edges: GraphEdge[]
}

export function normalizeIngredient(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

export function dishSimilarity(
  a: { ingredients: { name: string }[]; category: string },
  b: { ingredients: { name: string }[]; category: string },
): { score: number; shared: string[] } {
  const setA = new Set(a.ingredients.map((i) => normalizeIngredient(i.name)))
  const setB = new Set(b.ingredients.map((i) => normalizeIngredient(i.name)))
  const shared = [...setA].filter((name) => setB.has(name))
  const union = new Set([...setA, ...setB])
  if (union.size === 0) return { score: 0, shared: [] }
  const jaccard = shared.length / union.size
  const categoryBonus = a.category === b.category ? 0.2 : 0
  return { score: Math.min(1, jaccard + categoryBonus), shared }
}

export function buildGraph(catalog: CatalogDish[]): SimilarityGraph {
  const nodes: DishNode[] = catalog.map((dish, index) => ({
    key: `c${index}`,
    dish,
  }))
  const edges: GraphEdge[] = []
  for (let i = 0; i < nodes.length; i++) {
    for (let j = i + 1; j < nodes.length; j++) {
      const { score, shared } = dishSimilarity(nodes[i].dish, nodes[j].dish)
      if (score > 0) {
        edges.push({ from: nodes[i].key, to: nodes[j].key, weight: score, sharedIngredients: shared })
      }
    }
  }
  return { nodes, edges }
}

export interface GraphRecommendOptions {
  limit?: number
  minSimilarity?: number
}

export function graphRecommendations(
  userDishes: Dish[],
  catalog: CatalogDish[],
  options: GraphRecommendOptions = {},
): Recommendation[] {
  const { limit = 6, minSimilarity = 0.1 } = options
  if (userDishes.length === 0) {
    return catalog.slice(0, limit).map((dish) => ({
      dish,
      score: 0,
      reasons: ['Ajoute des plats à ton carnet pour des suggestions personnalisées'],
    }))
  }

  const userNames = new Set(userDishes.map((dish) => normalizeIngredient(dish.name)))
  const scores = new Map<string, { score: number; reasons: string[] }>()

  for (const candidate of catalog) {
    if (userNames.has(normalizeIngredient(candidate.name))) continue

    let total = 0
    const reasons: { strength: number; text: string }[] = []

    for (const userDish of userDishes) {
      const { score, shared } = dishSimilarity(userDish, candidate)
      if (score < minSimilarity) continue
      const usageBoost = 1 + Math.min(4, userDish.timesServed)
      total += score * usageBoost
      if (score >= 0.15 && shared.length > 0) {
        reasons.push({
          strength: score * usageBoost,
          text: `Proche de « ${userDish.name} » (${Math.round(score * 100)}% de similarité)`,
        })
      }
    }

    if (total > 0) {
      reasons.sort((a, b) => b.strength - a.strength)
      scores.set(candidate.name, {
        score: total,
        reasons: reasons.slice(0, 3).map((r) => r.text),
      })
    }
  }

  const maxScore = Math.max(
    ...[...scores.values()].map((entry) => entry.score),
    1,
  )

  return [...scores.entries()]
    .map(([name, { score, reasons }]) => ({
      dish: catalog.find((dish) => dish.name === name) as CatalogDish,
      score: score / maxScore,
      reasons,
    }))
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
}

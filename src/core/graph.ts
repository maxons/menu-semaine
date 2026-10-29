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
  hops?: number
  hopDecay?: number
}

const DEFAULT_HOPS = 2
const DEFAULT_HOP_DECAY = 0.5

export function propagateScores(
  seeds: Map<string, number>,
  graph: SimilarityGraph,
  options: { hops?: number; hopDecay?: number } = {},
): Map<string, number> {
  const { hops = DEFAULT_HOPS, hopDecay = DEFAULT_HOP_DECAY } = options
  const adjacency = new Map<string, { neighbor: string; weight: number }[]>()
  for (const edge of graph.edges) {
    if (!adjacency.has(edge.from)) adjacency.set(edge.from, [])
    if (!adjacency.has(edge.to)) adjacency.set(edge.to, [])
    adjacency.get(edge.from)!.push({ neighbor: edge.to, weight: edge.weight })
    adjacency.get(edge.to)!.push({ neighbor: edge.from, weight: edge.weight })
  }

  const scores = new Map<string, number>(seeds)
  let frontier = new Map(seeds)
  for (let hop = 0; hop < hops; hop++) {
    const next = new Map<string, number>()
    for (const [key, score] of frontier) {
      for (const { neighbor, weight } of adjacency.get(key) ?? []) {
        const contributed = score * weight * hopDecay
        if (contributed <= 0) continue
        next.set(neighbor, (next.get(neighbor) ?? 0) + contributed)
      }
    }
    for (const [key, value] of next) {
      if (!scores.has(key) || value > scores.get(key)!) {
        scores.set(key, value)
      }
    }
    frontier = next
  }
  return scores
}

export function graphRecommendations(
  userDishes: Dish[],
  catalog: CatalogDish[],
  options: GraphRecommendOptions = {},
): Recommendation[] {
  const { limit = 6, minSimilarity = 0.1, hops = DEFAULT_HOPS, hopDecay = DEFAULT_HOP_DECAY } = options
  if (userDishes.length === 0) {
    return catalog.slice(0, limit).map((dish) => ({
      dish,
      score: 0,
      reasons: ['Ajoute des plats à ton carnet pour des suggestions personnalisées'],
    }))
  }

  const userNames = new Set(userDishes.map((dish) => normalizeIngredient(dish.name)))
  const scores = new Map<string, { score: number; reasons: string[] }>()

  const candidates = catalog.filter(
    (dish) => !userNames.has(normalizeIngredient(dish.name)),
  )
  for (const candidate of candidates) {
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

  const direct = new Set(scores.keys())

  const graph = buildGraph(catalog)
  const seeds = new Map<string, number>()
  graph.nodes.forEach((node, index) => {
    if (userNames.has(normalizeIngredient(node.dish.name))) {
      seeds.set(`c${index}`, 1)
    }
  })
  const propagated = propagateScores(seeds, graph, { hops, hopDecay })

  const propagatedScores = new Map<string, number>()
  for (const [key, value] of propagated) {
    const node = graph.nodes.find((n) => n.key === key)
    if (
      node &&
      !direct.has(node.dish.name) &&
      !userNames.has(normalizeIngredient(node.dish.name))
    ) {
      propagatedScores.set(node.dish.name, value)
    }
  }

  const maxPropagated = Math.max(1, ...propagatedScores.values())
  const recommendations: Recommendation[] = [...scores.entries()].map(
    ([name, { score, reasons }]) => ({
      dish: catalog.find((dish) => dish.name === name) as CatalogDish,
      score: score / maxScore,
      reasons,
    }),
  )

  for (const [name, value] of propagatedScores) {
    const dish = catalog.find((d) => d.name === name)
    if (!dish) continue
    recommendations.push({
      dish,
      score: 0.5 * (value / maxPropagated),
      reasons: ['Découvert par proximité dans le graphe (voisin de voisins de ton carnet)'],
    })
  }

  return recommendations.sort((a, b) => b.score - a.score).slice(0, limit)
}

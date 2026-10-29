import { useMemo, useState } from 'react'
import { useMenuStore } from '../store/menuStore'
import { DISH_CATALOG } from '../data/catalog'
import { estimateDishPrice } from '../core/budget'
import { seasonForWeek } from '../core/season'
import type { Dish } from '../core/types'

type SortKey = 'name' | 'price-asc' | 'price-desc' | 'difficulty'

const SORT_LABELS: Record<SortKey, string> = {
  name: 'Nom (A→Z)',
  'price-asc': 'Prix croissant',
  'price-desc': 'Prix décroissant',
  difficulty: 'Difficulté',
}

const DIFFICULTY_ORDER = { facile: 0, moyen: 1, difficile: 2 }

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function toDish(entry: (typeof DISH_CATALOG)[number], index: number): Dish {
  return {
    id: `catalog-${index}`,
    name: entry.name,
    ingredients: entry.ingredients,
    tags: entry.tags,
    lastServedAt: null,
    timesServed: 0,
    difficulty: entry.difficulty,
    healthy: entry.healthy,
    pregnancySafe: entry.pregnancySafe,
    utensils: entry.utensils,
    category: entry.category,
    rating: 'neutral',
    seasons: entry.seasons,
  }
}

export default function CatalogBrowser() {
  const userDishes = useMenuStore((state) => state.dishes)
  const addCatalogDish = useMenuStore((state) => state.addCatalogDish)
  const menu = useMenuStore((state) => state.menu)

  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<string>('')
  const [onlyHealthy, setOnlyHealthy] = useState(false)
  const [onlyPregnancySafe, setOnlyPregnancySafe] = useState(false)
  const [onlyInSeason, setOnlyInSeason] = useState(false)
  const [hideAdded, setHideAdded] = useState(true)
  const [sort, setSort] = useState<SortKey>('name')

  const season = seasonForWeek(menu.weekStart)
  const ownedNames = useMemo(
    () => new Set(userDishes.map((dish) => normalize(dish.name))),
    [userDishes],
  )

  const items = useMemo(() => {
    const query = normalize(search).trim()
    const all = DISH_CATALOG.map((entry, index) => ({
      entry,
      dish: toDish(entry, index),
      price: estimateDishPrice(toDish(entry, index)),
    }))

    const filtered = all.filter(({ entry }) => {
      if (query) {
        const haystack = normalize(
          entry.name +
            ' ' +
            entry.ingredients.map((i) => i.name).join(' ') +
            ' ' +
            entry.tags.join(' '),
        )
        if (!haystack.includes(query)) return false
      }
      if (category && entry.category !== category) return false
      if (onlyHealthy && !entry.healthy) return false
      if (onlyPregnancySafe && !entry.pregnancySafe) return false
      if (onlyInSeason && entry.seasons.length > 0 && !entry.seasons.includes(season)) {
        return false
      }
      if (hideAdded && ownedNames.has(normalize(entry.name))) return false
      return true
    })

    return filtered.sort((a, b) => {
      if (sort === 'name') return a.entry.name.localeCompare(b.entry.name, 'fr')
      if (sort === 'price-asc') return a.price - b.price
      if (sort === 'price-desc') return b.price - a.price
      return DIFFICULTY_ORDER[a.entry.difficulty] - DIFFICULTY_ORDER[b.entry.difficulty]
    })
  }, [search, category, onlyHealthy, onlyPregnancySafe, onlyInSeason, hideAdded, sort, ownedNames, season])

  const categories = useMemo(
    () => [...new Set(DISH_CATALOG.map((entry) => entry.category))],
    [],
  )

  return (
    <section className="panel">
      <h2>📚 Catalogue ({items.length} plats)</h2>
      <p className="muted">
        Parcours les {DISH_CATALOG.length} plats de la base et ajoute ceux qui te
        plaisent en un clic.
      </p>

      <div className="catalog-toolbar">
        <input
          className="catalog-search"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Rechercher un plat, un ingrédient, un tag…"
        />
        <select value={category} onChange={(event) => setCategory(event.target.value)}>
          <option value="">Toutes catégories</option>
          {categories.map((value) => (
            <option key={value} value={value}>
              {value}
            </option>
          ))}
        </select>
        <select value={sort} onChange={(event) => setSort(event.target.value as SortKey)}>
          {(Object.keys(SORT_LABELS) as SortKey[]).map((key) => (
            <option key={key} value={key}>
              {SORT_LABELS[key]}
            </option>
          ))}
        </select>
      </div>

      <div className="catalog-filters">
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyHealthy}
            onChange={(event) => setOnlyHealthy(event.target.checked)}
          />
          Healthy
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyPregnancySafe}
            onChange={(event) => setOnlyPregnancySafe(event.target.checked)}
          />
          Ok grossesse
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={onlyInSeason}
            onChange={(event) => setOnlyInSeason(event.target.checked)}
          />
          De saison
        </label>
        <label className="checkbox">
          <input
            type="checkbox"
            checked={hideAdded}
            onChange={(event) => setHideAdded(event.target.checked)}
          />
          Masquer mes plats
        </label>
      </div>

      <ul className="catalog-grid">
        {items.map(({ entry, price }) => {
          const added = ownedNames.has(normalize(entry.name))
          return (
            <li key={entry.name} className={`catalog-card ${added ? 'added' : ''}`}>
              <div className="catalog-card-head">
                <h3>{entry.name}</h3>
                <span className="badge">{price.toFixed(2)} €</span>
              </div>
              <div className="badges">
                <span className="badge">{entry.category}</span>
                <span className="badge">{entry.difficulty}</span>
                {entry.healthy && <span className="badge badge-healthy">healthy</span>}
                {!entry.pregnancySafe && (
                  <span className="badge badge-unsafe">à éviter (grossesse)</span>
                )}
                {entry.seasons.length > 0 && entry.seasons.includes(season) && (
                  <span className="badge badge-season">de saison</span>
                )}
              </div>
              <small className="muted">
                {entry.ingredients.map((i) => i.name).join(', ')}
              </small>
              <div className="catalog-card-footer">
                <small className="muted">
                  {entry.utensils.length > 0 ? entry.utensils.join(', ') : 'ustensiles standard'}
                </small>
                {added ? (
                  <button disabled>✓ Dans mes plats</button>
                ) : (
                  <button className="primary" onClick={() => addCatalogDish(entry)}>
                    + Ajouter
                  </button>
                )}
              </div>
            </li>
          )
        })}
        {items.length === 0 && (
          <li className="empty">Aucun plat ne correspond à ces filtres.</li>
        )}
      </ul>
    </section>
  )
}

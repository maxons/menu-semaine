import { useState } from 'react'
import { useMenuStore } from '../store/menuStore'
import type { Dish, Difficulty, IngredientCategory } from '../core/types'

const DIFFICULTIES: Difficulty[] = ['facile', 'moyen', 'difficile']
const CATEGORIES: IngredientCategory[] = [
  'viande',
  'poisson',
  'legume',
  'feculent',
  'produit-laitier',
  'oeuf',
  'fruit',
  'epice-aromate',
]

export default function DishManager() {
  const dishes = useMenuStore((state) => state.dishes)
  const addDish = useMenuStore((state) => state.addDish)
  const removeDish = useMenuStore((state) => state.removeDish)

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')
  const [difficulty, setDifficulty] = useState<Difficulty>('facile')
  const [category, setCategory] = useState<IngredientCategory>('legume')
  const [healthy, setHealthy] = useState(false)
  const [pregnancySafe, setPregnancySafe] = useState(true)

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const parsedIngredients = ingredients
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => ({ name: entry, quantity: null, unit: null }))
    addDish({
      name: name.trim(),
      ingredients: parsedIngredients,
      tags: [],
      difficulty,
      healthy,
      pregnancySafe,
      utensils: [],
      category,
    })
    setName('')
    setIngredients('')
  }

  return (
    <section className="panel">
      <h2>Mes plats ({dishes.length})</h2>
      <form onSubmit={submit} className="dish-form">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="Nom du plat (ex. Gratin dauphinois)"
        />
        <input
          value={ingredients}
          onChange={(event) => setIngredients(event.target.value)}
          placeholder="Ingrédients séparés par des virgules"
        />
        <div className="dish-options">
          <label>
            Difficulté
            <select
              value={difficulty}
              onChange={(event) => setDifficulty(event.target.value as Difficulty)}
            >
              {DIFFICULTIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label>
            Type
            <select
              value={category}
              onChange={(event) =>
                setCategory(event.target.value as IngredientCategory)
              }
            >
              {CATEGORIES.map((value) => (
                <option key={value} value={value}>
                  {value}
                </option>
              ))}
            </select>
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={healthy}
              onChange={(event) => setHealthy(event.target.checked)}
            />
            Healthy
          </label>
          <label className="checkbox">
            <input
              type="checkbox"
              checked={pregnancySafe}
              onChange={(event) => setPregnancySafe(event.target.checked)}
            />
            Ok grossesse
          </label>
        </div>
        <button type="submit">Ajouter</button>
      </form>
      <ul className="dish-list">
        {dishes.map((dish: Dish) => (
          <li key={dish.id}>
            <span>
              {dish.name}
              {dish.healthy && <span className="badge badge-healthy">healthy</span>}
              {!dish.pregnancySafe && (
                <span className="badge badge-unsafe">à éviter (grossesse)</span>
              )}
              {dish.ingredients.length > 0 && (
                <small> — {dish.ingredients.map((i) => i.name).join(', ')}</small>
              )}
            </span>
            <button onClick={() => removeDish(dish.id)}>Supprimer</button>
          </li>
        ))}
        {dishes.length === 0 && (
          <li className="empty">
            Aucun plat pour l'instant. Ajoute tes premiers plats !
          </li>
        )}
      </ul>
    </section>
  )
}

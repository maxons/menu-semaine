import { useState } from 'react'
import { useMenuStore } from '../store/menuStore'
import type { Dish } from '../core/types'

export default function DishManager() {
  const dishes = useMenuStore((state) => state.dishes)
  const addDish = useMenuStore((state) => state.addDish)
  const removeDish = useMenuStore((state) => state.removeDish)

  const [name, setName] = useState('')
  const [ingredients, setIngredients] = useState('')

  const submit = (event: React.FormEvent) => {
    event.preventDefault()
    if (!name.trim()) return
    const parsedIngredients = ingredients
      .split(',')
      .map((entry) => entry.trim())
      .filter((entry) => entry.length > 0)
      .map((entry) => ({ name: entry, quantity: null, unit: null }))
    addDish({ name: name.trim(), ingredients: parsedIngredients, tags: [] })
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
        <button type="submit">Ajouter</button>
      </form>
      <ul className="dish-list">
        {dishes.map((dish: Dish) => (
          <li key={dish.id}>
            <span>
              {dish.name}
              {dish.ingredients.length > 0 && (
                <small> — {dish.ingredients.map((i) => i.name).join(', ')}</small>
              )}
            </span>
            <button onClick={() => removeDish(dish.id)}>Supprimer</button>
          </li>
        ))}
        {dishes.length === 0 && (
          <li className="empty">Aucun plat pour l'instant. Ajoute tes premiers plats !</li>
        )}
      </ul>
    </section>
  )
}

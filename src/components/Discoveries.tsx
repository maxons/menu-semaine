import { useMemo } from 'react'
import { useMenuStore } from '../store/menuStore'
import { DISH_CATALOG } from '../data/catalog'
import { hybridRecommendations } from '../core/hybrid'

export default function Discoveries() {
  const dishes = useMenuStore((state) => state.dishes)
  const addCatalogDish = useMenuStore((state) => state.addCatalogDish)

  const recommendations = useMemo(
    () => hybridRecommendations(dishes, DISH_CATALOG, { limit: 6 }),
    [dishes],
  )

  const ownedNames = new Set(dishes.map((dish) => dish.name))

  return (
    <section className="panel">
      <h2>Découvertes pour toi</h2>
      <p className="muted">
        Suggestions hybrides : similarité de composition (graphe de plats) +
        affinité de profil (difficulté, healthy, habitudes), avec un boost pour
        les plats que tu sers souvent et une exploration par voisins de voisins.
      </p>
      <div className="discovery-grid">
        {recommendations.map(({ dish, score, reasons }) => (
          <article key={dish.name} className="discovery-card">
            <h3>{dish.name}</h3>
            <div className="badges">
              {dish.healthy && <span className="badge badge-healthy">healthy</span>}
              {!dish.pregnancySafe && (
                <span className="badge badge-unsafe">à éviter (grossesse)</span>
              )}
              <span className="badge">{dish.difficulty}</span>
            </div>
            <small className="muted">
              {dish.ingredients.map((i) => i.name).join(', ')}
            </small>
            {reasons.length > 0 && (
              <ul className="reasons">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            )}
            <div className="discovery-footer">
              <small className="muted">Score : {(score * 100).toFixed(0)}%</small>
              {ownedNames.has(dish.name) ? (
                <button disabled>Déjà ajouté</button>
              ) : (
                <button className="primary" onClick={() => addCatalogDish(dish)}>
                  Ajouter à mes plats
                </button>
              )}
            </div>
          </article>
        ))}
      </div>
    </section>
  )
}

# Menu Semaine

Application web pour créer facilement des menus de repas à la semaine.

## Fonctionnalités

- **Gestion des plats** : ajoute les plats que tu aimes, avec leurs ingrédients, difficulté, côté healthy et compatibilité grossesse.
- **Génération de menu** : l'app pioche dans ta liste de plats pour composer la semaine, avec une probabilité qui favorise les plats non servis récemment (demi-vie de 14 jours).
- **Repas verrouillés** : force certains repas (🔒) pour qu'ils ne soient pas modifiés lors d'une génération, ou choisis manuellement un plat.
- **Re-roll par repas** : change un seul repas sans toucher au reste (⟳).
- **Liste de courses** : consolidation automatique des ingrédients de tous les plats de la semaine (fusion des doublons et des quantités par unité).
- **Découvertes** : suggestions de nouveaux plats basées sur un profil de goût construit à partir de ton carnet (ingrédients récurrents, type de plat, facilité, côté healthy, ustensiles).
- **Contraintes de semaine** : semaine normale, grossesse (contrainte forte : uniquement les plats sûrs), healthy (contrainte forte), plutôt healthy (les plats healthy sont favorisés mais rien n'est exclu).

Les données sont stockées localement (localStorage) — aucun compte requis, fonctionne hors ligne.

## Démarrage

```bash
npm install
npm run dev
```

## Scripts

| Commande | Description |
|---|---|
| `npm run dev` | Serveur de développement |
| `npm run build` | Compilation TypeScript + build production |
| `npm run test` | Tests unitaires (Vitest) |
| `npm run lint` | Lint (oxlint) |

## Architecture

```
src/
├── core/            # Logique métier pure, testable sans navigateur
│   ├── types.ts     # Dish, Menu, Meal, Ingredient…
│   ├── generator.ts # Générateur de menu pondéré
│   ├── shopping.ts  # Agrégation de la liste de courses
│   └── storage.ts   # Interface StorageAdapter
├── adapters/
│   └── localStorage.ts # Implémentation localStorage (remplaçable par API/SQLite)
├── store/
│   └── menuStore.ts    # État global Zustand
└── components/      # UI React (DishManager, WeeklyMenu, ShoppingList)
```

Le module `core/` n'a aucune dépendance au framework ni au DOM : le générateur
probabiliste, les contraintes de semaine, le moteur de recommandation et la
consolidation d'ingrédients sont couverts par des tests unitaires purs. Le
stockage passe par l'interface `StorageAdapter`, ce qui permettra de basculer
vers une API REST (sync multi-appareils) ou SQLite (packaging Android via
Capacitor) sans toucher aux composants.

### Recommandations

`core/graph.ts` construit un **graphe de similarité** entre plats : chaque paire
de plats est reliée par une arête pondérée (similarité Jaccard des ingrédients
+ bonus même catégorie). La recommandation propage les goûts le long du
graphe : un plat du catalogue est recommandé s'il est proche de plats de ton
carnet, avec un boost selon la fréquence réelle de consommation (`timesServed`)
et des explications (« Proche de « Risotto » (62% de similarité) »).

`core/recommendation.ts` conserve un scoring par profil de goût (fréquence des
ingrédients, catégories, difficulté, healthy, ustensiles) — les deux approches
sont destinées à être fusionnées. Le catalogue local (`data/catalog.ts`, ~50
plats français) est une donnée embarquée remplaçable par une API via le même
pattern adaptateur.
